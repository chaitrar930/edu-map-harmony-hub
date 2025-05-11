
from flask import Flask, request, jsonify
import sqlite3
import os
import pandas as pd
import numpy as np
from datetime import datetime
from flask_cors import CORS
import tempfile

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

@app.route('/process-marks-file', methods=['POST'])
def process_marks_file():
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "No file uploaded"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"status": "error", "message": "No file selected"}), 400
        
        # Get additional form data
        subject = request.form.get('subject', '')
        subject_name = request.form.get('subjectName', '')
        evaluation_type = request.form.get('evaluationType', '')
        batch_id = request.form.get('batchId', '')
        section = request.form.get('section', '')
        semester = request.form.get('semester', '')
        academic_year = request.form.get('academicYear', '')
        
        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        # Save file to temp location
        temp_file_path = ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp:
            file.save(temp.name)
            temp_file_path = temp.name
            
        # Process file based on extension
        if file_ext == '.xlsx':
            # Process Excel file
            data = process_excel_file(temp_file_path)
        elif file_ext == '.csv':
            # Process CSV file
            data = process_csv_file(temp_file_path)
        else:
            # Delete temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return jsonify({"status": "error", "message": "Unsupported file format"}), 400
        
        # Delete temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        # Insert data into database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert submission
        cursor.execute('''
        INSERT INTO submissions (subject_code, subject_name, evaluation_type, 
                                batch_id, section, semester, academic_year, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            subject, 
            subject_name, 
            evaluation_type, 
            batch_id,
            section,
            semester,
            academic_year,
            datetime.now().isoformat()
        ))
        
        submission_id = cursor.lastrowid
        
        # Insert marks and CO mappings from processed data
        if 'marks' in data:
            for record in data['marks']:
                cursor.execute('''
                INSERT INTO student_marks (submission_id, usn, question_id, marks)
                VALUES (?, ?, ?, ?)
                ''', (submission_id, record['usn'], record['question_id'], record['mark']))
                
        if 'co_mappings' in data:
            for record in data['co_mappings']:
                cursor.execute('''
                INSERT INTO question_cos (submission_id, question_id, course_outcomes)
                VALUES (?, ?, ?)
                ''', (submission_id, record['question_id'], record['course_outcomes']))
        
        conn.commit()
        conn.close()
        
        # Calculate CO attainment metrics
        co_data = calculate_co_attainment(data)
        
        return jsonify({
            "status": "success",
            "message": "File processed successfully",
            "submission_id": submission_id,
            "co_data": co_data,
            "summary": {
                "total_students": len(data.get('students', [])),
                "total_questions": len(data.get('co_mappings', [])),
                "subject": subject_name,
                "evaluation": evaluation_type
            }
        })
        
    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to process file: {str(e)}"
        }), 500

def process_excel_file(file_path):
    """Process Excel file to extract marks and CO mappings"""
    try:
        # Read the Excel file
        xl = pd.ExcelFile(file_path)
        
        # Initialize result
        result = {
            'students': [],
            'marks': [],
            'co_mappings': []
        }
        
        # Get sheets
        sheet_names = xl.sheet_names
        
        # Process theory sheet (first sheet)
        if len(sheet_names) > 0:
            df = pd.read_excel(file_path, sheet_name=sheet_names[0])
            
            # Extract COs mapped row
            co_mapped = df.iloc[0].to_dict()
            
            # Extract maximum marks row
            max_marks_row = df.iloc[2].to_dict()
            
            # Get USN and student names
            students_data = df.iloc[3:].copy()
            
            # Process student marks
            for _, row in students_data.iterrows():
                usn = row.get('USN', '')
                name = row.get('STUDENT NAME', '')
                
                if not pd.isna(usn) and usn:
                    # Add to students list
                    result['students'].append({
                        'usn': usn,
                        'name': name
                    })
                    
                    # Process each question's marks
                    for col in df.columns:
                        if col not in ['USN', 'STUDENT NAME', 'Final SEE MARKS']:
                            # Only process if column has a valid question identifier
                            if col.startswith('Q'):
                                mark = row.get(col, 0)
                                if not pd.isna(mark):
                                    result['marks'].append({
                                        'usn': usn,
                                        'question_id': col,
                                        'mark': float(mark)
                                    })
            
            # Process CO mappings
            for col in df.columns:
                if col.startswith('Q'):
                    co_mapping = co_mapped.get(col, '')
                    if not pd.isna(co_mapping) and co_mapping:
                        result['co_mappings'].append({
                            'question_id': col,
                            'course_outcomes': str(co_mapping),
                            'max_mark': float(max_marks_row.get(col, 0)) if not pd.isna(max_marks_row.get(col, 0)) else 0
                        })
        
        return result
    
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        raise

def process_csv_file(file_path):
    """Process CSV file to extract marks and CO mappings"""
    try:
        # Read the CSV file
        df = pd.read_csv(file_path)
        
        # Initialize result (similar structure to Excel processing)
        result = {
            'students': [],
            'marks': [],
            'co_mappings': []
        }
        
        # Extract COs mapped row
        co_mapped = df.iloc[0].to_dict()
        
        # Extract maximum marks row
        max_marks_row = df.iloc[2].to_dict()
        
        # Get USN and student names
        students_data = df.iloc[3:].copy()
        
        # Process student marks
        for _, row in students_data.iterrows():
            usn = row.get('USN', '')
            name = row.get('STUDENT NAME', '')
            
            if not pd.isna(usn) and usn:
                # Add to students list
                result['students'].append({
                    'usn': usn,
                    'name': name
                })
                
                # Process each question's marks
                for col in df.columns:
                    if col not in ['USN', 'STUDENT NAME', 'Final SEE MARKS']:
                        # Only process if column has a valid question identifier
                        if col.startswith('Q'):
                            mark = row.get(col, 0)
                            if not pd.isna(mark):
                                result['marks'].append({
                                    'usn': usn,
                                    'question_id': col,
                                    'mark': float(mark)
                                })
        
        # Process CO mappings
        for col in df.columns:
            if col.startswith('Q'):
                co_mapping = co_mapped.get(col, '')
                if not pd.isna(co_mapping) and co_mapping:
                    result['co_mappings'].append({
                        'question_id': col,
                        'course_outcomes': str(co_mapping),
                        'max_mark': float(max_marks_row.get(col, 0)) if not pd.isna(max_marks_row.get(col, 0)) else 0
                    })
    
        return result
    
    except Exception as e:
        print(f"Error processing CSV file: {e}")
        raise

def calculate_co_attainment(data):
    """Calculate CO attainment from processed marks data"""
    try:
        # Create a map of CO to questions that assess it
        co_to_questions = {}
        
        for mapping in data.get('co_mappings', []):
            co_list = mapping['course_outcomes'].split(',')
            question_id = mapping['question_id']
            max_mark = mapping.get('max_mark', 0)
            
            for co in co_list:
                co = co.strip()
                if co not in co_to_questions:
                    co_to_questions[co] = []
                
                co_to_questions[co].append({
                    'question_id': question_id,
                    'max_mark': max_mark
                })
        
        # Calculate attainment for each CO
        co_attainment = {}
        marks_by_question = {}
        
        # Group marks by question
        for mark_record in data.get('marks', []):
            question_id = mark_record['question_id']
            if question_id not in marks_by_question:
                marks_by_question[question_id] = []
            
            marks_by_question[question_id].append(mark_record['mark'])
        
        # Calculate attainment percentage for each CO
        for co, questions in co_to_questions.items():
            total_marks = 0
            total_possible = 0
            
            for question in questions:
                question_id = question['question_id']
                max_mark = question['max_mark']
                
                if question_id in marks_by_question:
                    total_marks += sum(marks_by_question[question_id])
                    total_possible += max_mark * len(marks_by_question[question_id])
            
            if total_possible > 0:
                attainment = (total_marks / total_possible) * 100
                co_attainment[co] = round(attainment, 2)
            else:
                co_attainment[co] = 0
        
        return {
            'co_attainment': co_attainment,
            'summary': {
                'average_attainment': round(sum(co_attainment.values()) / len(co_attainment) if co_attainment else 0, 2)
            }
        }
    
    except Exception as e:
        print(f"Error calculating CO attainment: {e}")
        return {}

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
