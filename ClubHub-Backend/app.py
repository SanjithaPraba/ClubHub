import os
from dotenv import load_dotenv
import mysql.connector
from flask import Flask, request, jsonify

load_dotenv()

# --- Database Configuration ---
# REPLACE these values with your actual GCP MySQL database credentials
DB_CONFIG = {
    'user': os.getenv('DB_USER'),      # e.g., 'clubhub_user'
    'password': os.getenv('DB_PASSWORD'),  # Your secure database password
    'host': os.getenv('DB_HOST'),      # Your GCP database instance public/private IP
    'database': os.getenv('DB_DATABASE')     # The database name you created
}

def get_db_connection():
    """Establishes and returns a database connection."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None

#Flask Set-Up
app = Flask(__name__)

# --- Core Functionality 1: New Student Sign-Up ---
@app.route('/signup', methods=['POST'])
def signup_student():
    """
    Handles new student registration by inserting a record into the student table.
    Requires all fields and a valid @virginia.edu email.
    """
    data = request.json
    
    # 1. Basic Field Validation (Required fields based on your CREATE TABLE statement)
    required_fields = ['student_id', 'username', 'school_email', 'password', 'class', 'major']
    for field in required_fields:
        if not data.get(field):
            # Return a 400 Bad Request error if any field is missing
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400

    # 2. UVA Email Validation
    school_email = data['school_email'].lower()
    if not school_email.endswith('@virginia.edu'):
        # Return an error if the email doesn't meet the requirement
        return jsonify({'success': False, 'message': 'Registration requires a valid @virginia.edu email.'}), 400

    # 3. Database Insertion
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error.'}), 500

    # NOTE: In a real app, you should securely hash the password (e.g., using Flask-Bcrypt)
    # For this assignment, we are using the 'hashedpw' concept from your sample data.
    insert_query = """
    INSERT INTO student (student_id, username, school_email, password, class, major)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    # NOTE: student_id must be unique and is manually provided here per your sample data [cite: 16, 119]
    values = (
        data['student_id'], 
        data['username'], 
        school_email, 
        data['password'], # Placeholder for hashed password
        data['class'], 
        data['major']
    )
    
    try:
        cursor = conn.cursor()
        cursor.execute(insert_query, values)
        conn.commit()
        
        # Security Note: This is an example of Application-Level Security.
        # The application enforces the '@virginia.edu' rule before the database ever sees the request.
        
        return jsonify({'success': True, 'message': 'Account created successfully!'}), 201
    
    except mysql.connector.Error as err:
        # Catch potential database errors (e.g., UNIQUE constraint violations for student_id, username, or email) [cite: 17]
        conn.rollback()
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# --- Simple Landing Page Placeholder ---
@app.route('/', methods=['GET'])
def home():
    """Serves the simple landing page (pre-login view)."""
    # This is where your limited, simple HTML for the sign-up page would be rendered in a full app.
    # For now, we return a simple message.
    return "Welcome to ClubHub! Please sign up to explore clubs and events."

@app.route('/test-db-connection', methods=['GET'])
def test_db_connection():
    """
    Tests the database connection and returns the total number of students.
    """
    conn = get_db_connection()
    if not conn:
        # If get_db_connection failed, it means credentials or network config is wrong.
        return jsonify({'success': False, 'message': 'Failed to connect to the database. Check .env and network.'}), 500

    try:
        cursor = conn.cursor()
        # SQL Query to count all students (Source data shows 20 students)
        query = "SELECT COUNT(*) FROM student"
        cursor.execute(query)
        
        # Fetch the single result
        result = cursor.fetchone()
        student_count = result[0]
        
        return jsonify({
            'success': True, 
            'message': 'Database connection successful and query executed.',
            'student_count': student_count
        }), 200
        
    except mysql.connector.Error as err:
        return jsonify({'success': False, 'message': f'SQL execution error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            print("Connection closed after test.")
@app.route('/clubs', methods=['GET'])
def get_clubs():
    """
    Returns all clubs from the 'club' table.
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM club")
        rows = cursor.fetchall()
        return jsonify({'success': True, 'clubs': rows}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    # You can uncomment this line to test the connection immediately
    # test_connection()
    # Flask runs on port 5000 by default
    # Change host to '0.0.0.0' if you need to access it from outside your machine (e.g., from a separate frontend container)
    app.run(debug=True)