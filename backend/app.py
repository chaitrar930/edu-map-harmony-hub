from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:8080", "http://127.0.0.1:8080"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'instance', 'copomapping.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Models
class Batch(db.Model):
    __tablename__ = 'batch'
    id = db.Column(db.String(50), primary_key=True)
    batch_id = db.Column(db.String(20), nullable=False)
    year = db.Column(db.String(20), nullable=False)
    section = db.Column(db.String(5), nullable=False)
    semester = db.Column(db.String(5), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    submissions = db.relationship('MarkSubmission', backref='batch', lazy=True)

class MarkSubmission(db.Model):
    __tablename__ = 'mark_submission'
    id = db.Column(db.Integer, primary_key=True)
    subject_code = db.Column(db.String(20), nullable=False)
    subject_name = db.Column(db.String(100), nullable=False)
    evaluation_type = db.Column(db.String(20), nullable=False)
    question_paper = db.Column(db.String(100))
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    batch_id = db.Column(db.String(50), db.ForeignKey('batch.id'), nullable=False)
    student_marks = db.relationship('StudentMark', backref='submission', lazy=True)

class StudentMark(db.Model):
    __tablename__ = 'student_mark'
    id = db.Column(db.Integer, primary_key=True)
    usn = db.Column(db.String(20), nullable=False)
    marks_data = db.Column(db.JSON, nullable=False)
    submission_id = db.Column(db.Integer, db.ForeignKey('mark_submission.id'), nullable=False)

# Initialize Database
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "EduMap Harmony Hub Backend is running!"

@app.route('/test-db')
def test_db():
    try:
        db.session.execute("SELECT 1")
        return jsonify({"success": True, "message": "Database connected"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/submit-marks', methods=['POST'])
def submit_marks():
    try:
        data = request.get_json()
        app.logger.info("Received submission data: %s", data)

        # Validate required fields
        required_fields = ['subjectCode', 'subjectName', 'evaluationType', 'batch', 'students']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': f'Missing required fields: {required_fields}'}), 400

        # Validate batch data
        batch_data = data['batch']
        required_batch_fields = ['id', 'batchId', 'year', 'section', 'semester']
        if not all(field in batch_data for field in required_batch_fields):
            return jsonify({'success': False, 'message': f'Invalid batch data. Required: {required_batch_fields}'}), 400

        # Process batch
        batch = Batch.query.get(batch_data['id'])
        if not batch:
            batch = Batch(
                id=batch_data['id'],
                batch_id=batch_data['batchId'],
                year=batch_data['year'],
                section=batch_data['section'],
                semester=batch_data['semester']
            )
            db.session.add(batch)
            db.session.flush()

        # Create submission
        submission = MarkSubmission(
            subject_code=data['subjectCode'],
            subject_name=data['subjectName'],
            evaluation_type=data['evaluationType'],
            question_paper=data.get('questionPaper', ''),
            batch_id=batch.id
        )
        db.session.add(submission)
        db.session.flush()

        # Process student marks
        valid_students = []
        for student in data['students']:
            if not all(k in student for k in ['usn', 'marks']):
                continue
            if not isinstance(student['marks'], dict):
                continue
            valid_students.append(StudentMark(
                usn=student['usn'],
                marks_data=student['marks'],
                submission_id=submission.id
            ))

        if not valid_students:
            return jsonify({'success': False, 'message': 'No valid student records provided'}), 400

        db.session.add_all(valid_students)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Marks submitted for {len(valid_students)} students',
            'submission_id': submission.id
        }), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error("Submission error: %s", str(e), exc_info=True)
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': str(e) if app.debug else None
        }), 500

@app.route('/submissions', methods=['GET'])
def get_submissions():
    try:
        submissions = MarkSubmission.query.options(db.joinedload(MarkSubmission.batch)).all()
        result = [{
            'id': sub.id,
            'subject': f"{sub.subject_code} - {sub.subject_name}",
            'evaluation': sub.evaluation_type,
            'batch': sub.batch.batch_id if sub.batch else None,
            'section': sub.batch.section if sub.batch else None,
            'date': sub.submission_date.isoformat(),
            'student_count': len(sub.student_marks)
        } for sub in submissions]
        return jsonify({'success': True, 'submissions': result})
    except Exception as e:
        app.logger.error("Error fetching submissions: %s", str(e))
        return jsonify({'success': False, 'message': 'Error fetching submissions'}), 500

@app.route('/reset-db', methods=['POST'])
def reset_database():
    if not app.debug:
        return jsonify({'success': False, 'message': 'Not allowed in production'}), 403
    try:
        db.drop_all()
        db.create_all()
        return jsonify({'success': True, 'message': 'Database reset'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

app.debug = True  # Enable debug mode
if __name__ == '__main__':
    os.makedirs(os.path.join(os.path.dirname(__file__), 'instance'), exist_ok=True)
    app.run(host='0.0.0.0', port=5000)
