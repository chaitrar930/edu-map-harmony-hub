
from flask import Flask, request, jsonify
import sqlite3
import os
import numpy as np
from datetime import datetime
from flask_cors import CORS
import tempfile

app = Flask(__name__)
CORS(app)

# Check and import required packages
try:
    import pandas as pd
    import openpyxl
except ImportError as e:
    print(f"ERROR: Missing required dependency: {e}")
    print("Please install required packages using: pip install -r requirements.txt")

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
        # Check for required packages
        try:
            import pandas as pd
            import openpyxl
        except ImportError as e:
            return jsonify({
                "status": "error", 
                "message": f"Missing required dependency: {str(e)}. Use pip install -r requirements.txt to install required packages."
            }), 500
            
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
        po_data = calculate_po_attainment(data, co_data)
        
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
    """Process Excel file to extract marks and CO mappings for the specific format shown in the images"""
    try:
        # Read the Excel file
        xl = pd.ExcelFile(file_path)
        
        # Initialize result
        result = {
            'students': [],
            'marks': [],
            'co_mappings': [],
            'max_marks': {}
        }
        
        # Get sheets
        sheet_names = xl.sheet_names
        
        if len(sheet_names) > 0:
            # Read the first sheet (main marks sheet)
            df = pd.read_excel(file_path, sheet_name=sheet_names[0])
            
            # Find the row with "COs mapped" - usually row 0
            co_mapped_row = df.iloc[0]
            
            # Find the row with "Maximum Marks" - usually row 1 or 2
            max_marks_row = None
            for i in range(1, 5):  # Check first few rows
                if 'Maximum Marks' in str(df.iloc[i].values):
                    max_marks_row = df.iloc[i]
                    break
                
            if max_marks_row is None:
                # Try to find by column header
                max_marks_row = df[df.iloc[:, 0] == 'Maximum Marks'].iloc[0] if not df[df.iloc[:, 0] == 'Maximum Marks'].empty else None
            
            if max_marks_row is None:
                raise ValueError("Could not find Maximum Marks row in the Excel file")
            
            # Get the USN and student rows - they start after Maximum Marks row
            student_data_start_idx = None
            for i in range(5):
                if 'USN' in str(df.iloc[i].values) and 'STUDENT NAME' in str(df.iloc[i].values):
                    student_data_start_idx = i + 1
                    break
            
            if student_data_start_idx is None:
                # Find the first row with "USN" in the first column
                usn_rows = df[df.iloc[:, 0] == 'USN']
                if not usn_rows.empty:
                    student_data_start_idx = usn_rows.index[0] + 1
                else:
                    raise ValueError("Could not find student data in the Excel file")
            
            # Column indices for USN and student names
            usn_col_idx = None
            name_col_idx = None
            
            # Find column indices
            for i, col_name in enumerate(df.columns):
                if 'USN' in str(col_name):
                    usn_col_idx = i
                if 'STUDENT NAME' in str(col_name):
                    name_col_idx = i
            
            if usn_col_idx is None or name_col_idx is None:
                raise ValueError("Could not find USN or STUDENT NAME columns")
            
            # Extract headers for question columns (Q1A, Q1B, etc.)
            headers_row = df.iloc[student_data_start_idx - 1]
            question_columns = []
            
            for idx, col_name in enumerate(headers_row):
                # Skip USN and STUDENT NAME columns
                if idx != usn_col_idx and idx != name_col_idx:
                    # Check if column name starts with Q
                    if isinstance(col_name, str) and col_name.startswith('Q'):
                        question_columns.append({
                            'index': idx,
                            'name': col_name
                        })
            
            # Extract CO mappings for each question
            co_mappings = {}
            for question in question_columns:
                q_name = question['name']
                q_idx = question['index']
                co_mapping = co_mapped_row.iloc[q_idx]
                
                # Only add if there's a valid CO mapping
                if pd.notna(co_mapping) and str(co_mapping).strip():
                    co_mappings[q_name] = str(co_mapping).strip()
                    
                    # Also add max marks
                    max_mark = max_marks_row.iloc[q_idx]
                    if pd.notna(max_mark):
                        result['max_marks'][q_name] = float(max_mark)
                    else:
                        result['max_marks'][q_name] = 0
            
            # Process student data
            student_data = df.iloc[student_data_start_idx:]
            
            for _, row in student_data.iterrows():
                usn = row.iloc[usn_col_idx]
                name = row.iloc[name_col_idx] if name_col_idx is not None else ""
                
                # Skip rows without USN
                if pd.isna(usn) or not str(usn).strip():
                    continue
                
                # Add student to list
                result['students'].append({
                    'usn': str(usn).strip(),
                    'name': str(name).strip() if not pd.isna(name) else ""
                })
                
                # Process marks for each question
                for question in question_columns:
                    q_name = question['name']
                    q_idx = question['index']
                    
                    # Get mark for this question
                    mark = row.iloc[q_idx]
                    
                    # Only add if the mark is a valid number
                    if pd.notna(mark) and isinstance(mark, (int, float)):
                        result['marks'].append({
                            'usn': str(usn).strip(),
                            'question_id': q_name,
                            'mark': float(mark)
                        })
            
            # Add CO mappings to the result
            for q_name, co_mapping in co_mappings.items():
                result['co_mappings'].append({
                    'question_id': q_name,
                    'course_outcomes': co_mapping,
                    'max_mark': result['max_marks'].get(q_name, 0)
                })
                
            # If there are more sheets (lab sheets), process them similarly
            if len(sheet_names) > 1:
                for sheet_idx in range(1, min(len(sheet_names), 3)):  # Process up to 2 additional sheets
                    sheet_name = sheet_names[sheet_idx]
                    
                    # Add a prefix to differentiate lab questions
                    prefix = f"LAB_{sheet_idx}_"
                    
                    # Same process for lab sheet
                    lab_df = pd.read_excel(file_path, sheet_name=sheet_name)
                    
                    # Try to find CO mapped and max marks rows
                    lab_co_mapped_row = lab_df.iloc[0]
                    
                    lab_max_marks_row = None
                    for i in range(1, 5):
                        if 'Maximum Marks' in str(lab_df.iloc[i].values):
                            lab_max_marks_row = lab_df.iloc[i]
                            break
                    
                    if lab_max_marks_row is None:
                        lab_max_marks_row = lab_df[lab_df.iloc[:, 0] == 'Maximum Marks'].iloc[0] if not lab_df[lab_df.iloc[:, 0] == 'Maximum Marks'].empty else None
                    
                    if lab_max_marks_row is None:
                        print(f"Warning: Could not find Maximum Marks row in sheet {sheet_name}")
                        continue
                    
                    # Find student data rows
                    lab_student_data_start_idx = None
                    for i in range(5):
                        if 'USN' in str(lab_df.iloc[i].values) and 'STUDENT NAME' in str(lab_df.iloc[i].values):
                            lab_student_data_start_idx = i + 1
                            break
                    
                    if lab_student_data_start_idx is None:
                        lab_usn_rows = lab_df[lab_df.iloc[:, 0] == 'USN']
                        if not lab_usn_rows.empty:
                            lab_student_data_start_idx = lab_usn_rows.index[0] + 1
                        else:
                            print(f"Warning: Could not find student data in sheet {sheet_name}")
                            continue
                    
                    # Find column indices
                    lab_usn_col_idx = None
                    lab_name_col_idx = None
                    
                    for i, col_name in enumerate(lab_df.columns):
                        if 'USN' in str(col_name):
                            lab_usn_col_idx = i
                        if 'STUDENT NAME' in str(col_name):
                            lab_name_col_idx = i
                    
                    if lab_usn_col_idx is None:
                        print(f"Warning: Could not find USN column in sheet {sheet_name}")
                        continue
                    
                    # Extract headers for question columns
                    lab_headers_row = lab_df.iloc[lab_student_data_start_idx - 1]
                    lab_question_columns = []
                    
                    for idx, col_name in enumerate(lab_headers_row):
                        if idx != lab_usn_col_idx and idx != lab_name_col_idx:
                            if isinstance(col_name, str) and col_name.startswith('Q'):
                                lab_question_columns.append({
                                    'index': idx,
                                    'name': f"{prefix}{col_name}"  # Add prefix to differentiate lab questions
                                })
                    
                    # Extract CO mappings for each question
                    lab_co_mappings = {}
                    for question in lab_question_columns:
                        q_name = question['name']
                        q_idx = question['index']
                        co_mapping = lab_co_mapped_row.iloc[q_idx]
                        
                        if pd.notna(co_mapping) and str(co_mapping).strip():
                            lab_co_mappings[q_name] = str(co_mapping).strip()
                            
                            # Also add max marks
                            max_mark = lab_max_marks_row.iloc[q_idx]
                            if pd.notna(max_mark):
                                result['max_marks'][q_name] = float(max_mark)
                            else:
                                result['max_marks'][q_name] = 0
                    
                    # Process student data
                    lab_student_data = lab_df.iloc[lab_student_data_start_idx:]
                    
                    for _, row in lab_student_data.iterrows():
                        usn = row.iloc[lab_usn_col_idx]
                        
                        # Skip rows without USN
                        if pd.isna(usn) or not str(usn).strip():
                            continue
                        
                        # Process marks for each question
                        for question in lab_question_columns:
                            q_name = question['name']
                            q_idx = question['index']
                            
                            # Get mark for this question
                            mark = row.iloc[q_idx]
                            
                            # Only add if the mark is a valid number
                            if pd.notna(mark) and isinstance(mark, (int, float)):
                                result['marks'].append({
                                    'usn': str(usn).strip(),
                                    'question_id': q_name,
                                    'mark': float(mark)
                                })
                    
                    # Add CO mappings to the result
                    for q_name, co_mapping in lab_co_mappings.items():
                        result['co_mappings'].append({
                            'question_id': q_name,
                            'course_outcomes': co_mapping,
                            'max_mark': result['max_marks'].get(q_name, 0)
                        })
        
        return result
    
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        raise ValueError(f"Failed to process Excel file: {str(e)}")

def process_csv_file(file_path):
    """Process CSV file to extract marks and CO mappings"""
    try:
        # Similar approach to Excel, but with CSV
        df = pd.read_csv(file_path)
        
        # Initialize result
        result = {
            'students': [],
            'marks': [],
            'co_mappings': [],
            'max_marks': {}
        }
        
        # Find the row with "COs mapped"
        co_mapped_row_idx = None
        max_marks_row_idx = None
        student_data_start_idx = None
        
        for i in range(min(10, len(df))):
            if 'COs mapped' in str(df.iloc[i].values):
                co_mapped_row_idx = i
            if 'Maximum Marks' in str(df.iloc[i].values):
                max_marks_row_idx = i
            if 'USN' in str(df.iloc[i].values) and 'STUDENT NAME' in str(df.iloc[i].values):
                student_data_start_idx = i + 1
        
        if co_mapped_row_idx is None or max_marks_row_idx is None or student_data_start_idx is None:
            raise ValueError("Could not find required header rows in CSV file")
        
        co_mapped_row = df.iloc[co_mapped_row_idx]
        max_marks_row = df.iloc[max_marks_row_idx]
        
        # Find column indices
        usn_col_idx = None
        name_col_idx = None
        
        for i, col_name in enumerate(df.columns):
            if 'USN' in str(col_name):
                usn_col_idx = i
            if 'STUDENT NAME' in str(col_name):
                name_col_idx = i
        
        if usn_col_idx is None or name_col_idx is None:
            raise ValueError("Could not find USN or STUDENT NAME columns")
        
        # Extract headers for question columns
        headers_row = df.iloc[student_data_start_idx - 1]
        question_columns = []
        
        for idx, col_name in enumerate(headers_row):
            if idx != usn_col_idx and idx != name_col_idx:
                if isinstance(col_name, str) and col_name.startswith('Q'):
                    question_columns.append({
                        'index': idx,
                        'name': col_name
                    })
        
        # Extract CO mappings for each question
        co_mappings = {}
        for question in question_columns:
            q_name = question['name']
            q_idx = question['index']
            co_mapping = co_mapped_row.iloc[q_idx]
            
            if pd.notna(co_mapping) and str(co_mapping).strip():
                co_mappings[q_name] = str(co_mapping).strip()
                
                # Also add max marks
                max_mark = max_marks_row.iloc[q_idx]
                if pd.notna(max_mark):
                    result['max_marks'][q_name] = float(max_mark)
                else:
                    result['max_marks'][q_name] = 0
        
        # Process student data
        student_data = df.iloc[student_data_start_idx:]
        
        for _, row in student_data.iterrows():
            usn = row.iloc[usn_col_idx]
            name = row.iloc[name_col_idx] if name_col_idx is not None else ""
            
            # Skip rows without USN
            if pd.isna(usn) or not str(usn).strip():
                continue
            
            # Add student to list
            result['students'].append({
                'usn': str(usn).strip(),
                'name': str(name).strip() if not pd.isna(name) else ""
            })
            
            # Process marks for each question
            for question in question_columns:
                q_name = question['name']
                q_idx = question['index']
                
                # Get mark for this question
                mark = row.iloc[q_idx]
                
                # Only add if the mark is a valid number
                if pd.notna(mark) and isinstance(mark, (int, float)):
                    result['marks'].append({
                        'usn': str(usn).strip(),
                        'question_id': q_name,
                        'mark': float(mark)
                    })
        
        # Add CO mappings to the result
        for q_name, co_mapping in co_mappings.items():
            result['co_mappings'].append({
                'question_id': q_name,
                'course_outcomes': co_mapping,
                'max_mark': result['max_marks'].get(q_name, 0)
            })
                
        return result
    
    except Exception as e:
        print(f"Error processing CSV file: {e}")
        raise ValueError(f"Failed to process CSV file: {str(e)}")

def calculate_question_metrics(data):
    """Calculate metrics for each question"""
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
                        if "LAB_" in question_id:
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

def calculate_po_attainment(data, co_data):
    """Calculate PO attainment based on CO-PO mapping"""
    try:
        # Get CO attainment data from previous calculation
        co_attainment = co_data.get('co_attainment', {})
        co_attainment_theory = co_data.get('co_attainment_theory', {})
        co_attainment_lab = co_data.get('co_attainment_lab', {})
        
        # Check if there's a CO-PO mapping in the data, otherwise use default
        co_po_mapping = {}
        
        # Try to extract CO-PO mapping from data if available
        # If not, use a default mapping
        if not co_po_mapping:
            co_po_mapping = {
                '0': ['PO1', 'PO5', 'PO8', 'PO9', 'PO10', 'PO12'],
                '1': ['PO1', 'PO5', 'PO9', 'PO10', 'PO12'],
                '2': ['PO1', 'PO5', 'PO9', 'PO10', 'PO12'],
                '3': ['PO1', 'PO5', 'PO8', 'PO9', 'PO10', 'PO12'],
                '4': ['PO1', 'PO5', 'PO9', 'PO10', 'PO12'],
                '5': ['PO1', 'PO5', 'PO9', 'PO10', 'PO12'],
                '6': ['PO1', 'PO5', 'PO8', 'PO9', 'PO10', 'PO12']
            }
        
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

if __name__ == '__main__':
    app.run(debug=True)
