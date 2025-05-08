
from flask import Flask, request, jsonify
import sqlite3
import os
import pandas as pd
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database setup
DATABASE = 'copomapping.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    
    # Create tables if they don't exist
    conn.execute('''
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_code TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        evaluation_type TEXT NOT NULL,
        batch_id TEXT NOT NULL,
        section TEXT NOT NULL,
        semester TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        submitted_at TIMESTAMP NOT NULL
    )
    ''')
    
    conn.execute('''
    CREATE TABLE IF NOT EXISTS student_marks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        usn TEXT NOT NULL,
        question_id TEXT NOT NULL,
        marks INTEGER NOT NULL,
        FOREIGN KEY (submission_id) REFERENCES submissions (id)
    )
    ''')
    
    conn.execute('''
    CREATE TABLE IF NOT EXISTS question_cos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        question_id TEXT NOT NULL,
        course_outcomes TEXT NOT NULL,
        FOREIGN KEY (submission_id) REFERENCES submissions (id)
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database when app starts
init_db()

@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "CO-PO Mapping API is running"})

@app.route('/submissions')
def get_submissions():
    conn = get_db_connection()
    submissions = conn.execute('SELECT * FROM submissions ORDER BY submitted_at DESC').fetchall()
    conn.close()
    
    # Convert to list of dicts
    result = []
    for row in submissions:
        item = {}
        for idx, col in enumerate(row.keys()):
            item[col] = row[idx]
        result.append(item)
    
    return jsonify(result)

@app.route('/submit-marks', methods=['POST'])
def submit_marks():
    try:
        data = request.json
        
        # Extract main data
        subject_code = data.get('subjectCode')
        subject_name = data.get('subjectName')
        evaluation_type = data.get('evaluationType')
        batch = data.get('batch')
        students = data.get('students', [])
        course_outcomes = data.get('courseOutcomes', {})
        
        # Validate required fields
        if not all([subject_code, subject_name, evaluation_type, batch]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
        
        # Insert into database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert submission
        cursor.execute('''
        INSERT INTO submissions (subject_code, subject_name, evaluation_type, 
                                batch_id, section, semester, academic_year, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            subject_code, 
            subject_name, 
            evaluation_type, 
            batch.get('batchId', ''),
            batch.get('section', ''),
            batch.get('semester', ''),
            batch.get('year', ''),
            datetime.now().isoformat()
        ))
        
        submission_id = cursor.lastrowid
        
        # Insert marks
        for student in students:
            usn = student.get('usn')
            marks = student.get('marks', {})
            
            for question_id, mark in marks.items():
                cursor.execute('''
                INSERT INTO student_marks (submission_id, usn, question_id, marks)
                VALUES (?, ?, ?, ?)
                ''', (submission_id, usn, question_id, mark))
        
        # Insert course outcomes
        for question_id, co_string in course_outcomes.items():
            if co_string:  # Only insert if there's a CO defined
                cursor.execute('''
                INSERT INTO question_cos (submission_id, question_id, course_outcomes)
                VALUES (?, ?, ?)
                ''', (submission_id, question_id, co_string))
        
        conn.commit()
        
        # Generate Excel export if needed
        try:
            export_to_excel(submission_id, data)
        except Exception as e:
            print(f"Excel export failed: {e}")
        
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Marks submitted successfully",
            "submission_id": submission_id
        })
        
    except Exception as e:
        print(f"Error submitting marks: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to submit marks: {str(e)}"
        }), 500

def export_to_excel(submission_id, data):
    """Export the marks to an Excel file"""
    try:
        # Create a dataframe for student marks
        marks_data = []
        
        subject_name = data.get('subjectName')
        evaluation_type = data.get('evaluationType')
        batch = data.get('batch')
        students = data.get('students', [])
        course_outcomes = data.get('courseOutcomes', {})
        
        for student in students:
            usn = student.get('usn')
            student_marks = student.get('marks', {})
            
            if not student_marks:  # Skip students with no marks
                continue
                
            student_row = {'USN': usn}
            
            for question_id, mark in student_marks.items():
                student_row[question_id] = mark
                
            marks_data.append(student_row)
        
        if not marks_data:  # No marks to export
            return
            
        # Create the dataframe and export
        df = pd.DataFrame(marks_data)
        
        # Add CO mapping as a separate sheet
        co_data = [{'Question': q, 'Course Outcomes': co} for q, co in course_outcomes.items()]
        co_df = pd.DataFrame(co_data)
        
        # Export to Excel
        filename = f"marks_export.xlsx"
        
        with pd.ExcelWriter(filename) as writer:
            df.to_excel(writer, sheet_name='Student Marks', index=False)
            co_df.to_excel(writer, sheet_name='CO Mapping', index=False)
            
            # Add metadata sheet
            metadata = pd.DataFrame([
                {'Field': 'Subject', 'Value': subject_name},
                {'Field': 'Evaluation', 'Value': evaluation_type},
                {'Field': 'Batch', 'Value': batch.get('batchId')},
                {'Field': 'Section', 'Value': batch.get('section')},
                {'Field': 'Semester', 'Value': batch.get('semester')},
                {'Field': 'Academic Year', 'Value': batch.get('year')},
                {'Field': 'Export Date', 'Value': datetime.now().isoformat()}
            ])
            metadata.to_excel(writer, sheet_name='Metadata', index=False)
        
        print(f"Exported marks to {filename}")
        
    except Exception as e:
        print(f"Failed to export marks: {e}")
        raise

if __name__ == '__main__':
    app.run(debug=True)
