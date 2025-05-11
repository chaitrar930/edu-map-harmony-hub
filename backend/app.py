
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
    # ... keep existing code (database initialization function)
    pass

# Initialize database when app starts
init_db()

@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "CO-PO Mapping API is running"})

@app.route('/submissions')
def get_submissions():
    # ... keep existing code (get submissions function)
    pass

@app.route('/submit-marks', methods=['POST'])
def submit_marks():
    # ... keep existing code (submit marks function)
    pass

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
        
        # Calculate PO attainment metrics
        po_data = calculate_po_attainment(data)
        
        # Calculate additional metrics for each question
        question_metrics = calculate_question_metrics(data)
        
        return jsonify({
            "status": "success",
            "message": "File processed successfully",
            "submission_id": submission_id,
            "co_data": co_data,
            "po_data": po_data,
            "question_metrics": question_metrics,
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
                        
            # Process Lab sheet if available
            if len(sheet_names) > 1:
                lab_df = pd.read_excel(file_path, sheet_name=sheet_names[1])
                
                # Similar processing for lab sheet
                # For lab, we'll add a prefix to distinguish questions
                lab_co_mapped = lab_df.iloc[0].to_dict()
                lab_max_marks_row = lab_df.iloc[2].to_dict()
                lab_students_data = lab_df.iloc[3:].copy()
                
                for _, row in lab_students_data.iterrows():
                    usn = row.get('USN', '')
                    name = row.get('STUDENT NAME', '')
                    
                    if not pd.isna(usn) and usn:
                        # Process each lab question's marks
                        for col in lab_df.columns:
                            if col not in ['USN', 'STUDENT NAME', 'Final LAB MARKS']:
                                # Only process if column has a valid question identifier
                                if col.startswith('Q'):
                                    mark = row.get(col, 0)
                                    if not pd.isna(mark):
                                        result['marks'].append({
                                            'usn': usn,
                                            'question_id': f"LAB_{col}",
                                            'mark': float(mark)
                                        })
                
                # Process Lab CO mappings
                for col in lab_df.columns:
                    if col.startswith('Q'):
                        co_mapping = lab_co_mapped.get(col, '')
                        if not pd.isna(co_mapping) and co_mapping:
                            result['co_mappings'].append({
                                'question_id': f"LAB_{col}",
                                'course_outcomes': str(co_mapping),
                                'max_mark': float(lab_max_marks_row.get(col, 0)) if not pd.isna(lab_max_marks_row.get(col, 0)) else 0
                            })
        
        return result
    
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        raise

def process_csv_file(file_path):
    """Process CSV file to extract marks and CO mappings"""
    # ... keep existing code (CSV processing function)
    pass

def calculate_question_metrics(data):
    """Calculate metrics for each question based on the requirements:
    1. 60% of max marks
    2. Number of students who attempted the question
    3. Number of students who scored > 60% of max marks
    4. CO attainment (B/A) for each question
    """
    result = {}
    
    # Group marks by question
    marks_by_question = {}
    for mark_record in data.get('marks', []):
        question_id = mark_record['question_id']
        if question_id not in marks_by_question:
            marks_by_question[question_id] = []
        marks_by_question[question_id].append(mark_record['mark'])
    
    # Get max marks for each question
    max_marks = {}
    for mapping in data.get('co_mappings', []):
        question_id = mapping['question_id']
        max_marks[question_id] = mapping.get('max_mark', 0)
    
    # Calculate metrics for each question
    for question_id, marks in marks_by_question.items():
        max_mark = max_marks.get(question_id, 0)
        threshold = 0.6 * max_mark  # 60% threshold
        
        # Number of students who attempted (A)
        num_attempted = len(marks)
        
        # Number of students who scored > 60% (B)
        num_above_threshold = sum(1 for mark in marks if mark >= threshold)
        
        # CO attainment (B/A)
        co_attainment = (num_above_threshold / num_attempted) * 100 if num_attempted > 0 else 0
        
        result[question_id] = {
            'max_mark': max_mark,
            'threshold': threshold,
            'num_attempted': num_attempted,
            'num_above_threshold': num_above_threshold,
            'co_attainment': round(co_attainment, 2)
        }
    
    return result

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
        co_attainment_theory = {}
        co_attainment_lab = {}
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
            
            total_theory_marks = 0
            total_theory_possible = 0
            
            total_lab_marks = 0
            total_lab_possible = 0
            
            for question in questions:
                question_id = question['question_id']
                max_mark = question['max_mark']
                
                # Calculate threshold (60% of max mark)
                threshold = 0.6 * max_mark
                
                if question_id in marks_by_question:
                    # Count students who scored above threshold
                    marks = marks_by_question[question_id]
                    above_threshold = sum(1 for mark in marks if mark >= threshold)
                    
                    # Calculate attainment as percentage of students above threshold
                    total_students = len(marks)
                    
                    if total_students > 0:
                        attainment = (above_threshold / total_students) * 100
                        
                        # Add to overall attainment
                        total_marks += above_threshold
                        total_possible += total_students
                        
                        # Separate theory and lab attainment
                        if question_id.startswith('LAB_'):
                            total_lab_marks += above_threshold
                            total_lab_possible += total_students
                        else:
                            total_theory_marks += above_threshold
                            total_theory_possible += total_students
            
            # Calculate overall attainment for this CO
            if total_possible > 0:
                co_attainment[co] = round((total_marks / total_possible) * 100, 2)
            else:
                co_attainment[co] = 0
            
            # Calculate theory attainment for this CO
            if total_theory_possible > 0:
                co_attainment_theory[co] = round((total_theory_marks / total_theory_possible) * 100, 2)
            else:
                co_attainment_theory[co] = 0
            
            # Calculate lab attainment for this CO
            if total_lab_possible > 0:
                co_attainment_lab[co] = round((total_lab_marks / total_lab_possible) * 100, 2)
            else:
                co_attainment_lab[co] = 0
        
        return {
            'co_attainment': co_attainment,
            'co_attainment_theory': co_attainment_theory,
            'co_attainment_lab': co_attainment_lab,
            'summary': {
                'average_attainment': round(sum(co_attainment.values()) / len(co_attainment) if co_attainment else 0, 2),
                'average_theory': round(sum(co_attainment_theory.values()) / len(co_attainment_theory) if co_attainment_theory else 0, 2),
                'average_lab': round(sum(co_attainment_lab.values()) / len(co_attainment_lab) if co_attainment_lab else 0, 2)
            }
        }
    
    except Exception as e:
        print(f"Error calculating CO attainment: {e}")
        return {}

def calculate_po_attainment(data):
    """Calculate PO attainment based on CO-PO mapping"""
    try:
        # This is a simplified example, in a real implementation, 
        # the CO-PO mapping would be stored in the database or provided as part of the input
        co_po_mapping = {
            '1': ['PO1', 'PO2'],
            '2': ['PO1', 'PO3', 'PO4'],
            '3': ['PO2', 'PO5'],
            '4': ['PO3', 'PO6'],
            '5': ['PO4', 'PO5', 'PO7']
        }
        
        # Get CO attainment data
        co_data = calculate_co_attainment(data)
        co_attainment = co_data.get('co_attainment', {})
        co_attainment_theory = co_data.get('co_attainment_theory', {})
        co_attainment_lab = co_data.get('co_attainment_lab', {})
        
        # Calculate PO attainment
        po_attainment = {}
        po_attainment_theory = {}
        po_attainment_lab = {}
        
        for co, pos in co_po_mapping.items():
            co_att = co_attainment.get(co, 0)
            co_att_theory = co_attainment_theory.get(co, 0)
            co_att_lab = co_attainment_lab.get(co, 0)
            
            for po in pos:
                if po not in po_attainment:
                    po_attainment[po] = []
                    po_attainment_theory[po] = []
                    po_attainment_lab[po] = []
                
                po_attainment[po].append(co_att)
                po_attainment_theory[po].append(co_att_theory)
                po_attainment_lab[po].append(co_att_lab)
        
        # Calculate average attainment for each PO
        po_average = {}
        po_average_theory = {}
        po_average_lab = {}
        
        for po, attainments in po_attainment.items():
            po_average[po] = round(sum(attainments) / len(attainments) if attainments else 0, 2)
        
        for po, attainments in po_attainment_theory.items():
            po_average_theory[po] = round(sum(attainments) / len(attainments) if attainments else 0, 2)
        
        for po, attainments in po_attainment_lab.items():
            po_average_lab[po] = round(sum(attainments) / len(attainments) if attainments else 0, 2)
        
        return {
            'po_attainment': po_average,
            'po_attainment_theory': po_average_theory,
            'po_attainment_lab': po_average_lab,
            'summary': {
                'average_attainment': round(sum(po_average.values()) / len(po_average) if po_average else 0, 2),
                'average_theory': round(sum(po_average_theory.values()) / len(po_average_theory) if po_average_theory else 0, 2),
                'average_lab': round(sum(po_average_lab.values()) / len(po_average_lab) if po_average_lab else 0, 2)
            }
        }
    
    except Exception as e:
        print(f"Error calculating PO attainment: {e}")
        return {}

def export_to_excel(submission_id, data):
    """Export the marks to an Excel file"""
    # ... keep existing code (export to excel function)
    pass

if __name__ == '__main__':
    app.run(debug=True)
