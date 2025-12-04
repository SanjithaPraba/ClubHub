import os
from dotenv import load_dotenv
import mysql.connector
from flask import Flask, request, jsonify
from flask import session

load_dotenv()


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

app = Flask(__name__)

@app.route('/signup', methods=['POST'])
def signup_student():
    """
    Handles new student registration by inserting a record into the student table.
    Requires all fields and a valid @virginia.edu email.
    """
    data = request.json
    
    # field validation
    required_fields = ['student_id', 'username', 'school_email', 'password', 'class', 'major']
    for field in required_fields:
        if not data.get(field):
            # Return a 400 Bad Request error if any field is missing
            return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400

    school_email = data['school_email'].lower()
    if not school_email.endswith('@virginia.edu'):
        # Return an error if the email doesn't meet the requirement
        return jsonify({'success': False, 'message': 'Registration requires a valid @virginia.edu email.'}), 400

    # db insertion
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error.'}), 500
    insert_query = """
    INSERT INTO student (student_id, username, school_email, password, class, major)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (
        data['student_id'], 
        data['username'], 
        school_email, 
        data['password'],
        data['class'], 
        data['major']
    )
    
    try:
        cursor = conn.cursor()
        cursor.execute(insert_query, values)
        conn.commit()
        
        
        return jsonify({'success': True, 'message': 'Account created successfully!'}), 201
    
    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/login', methods=['POST'])
def login_student():
    """
    Handles student login by verifying credentials.
    Returns user data if credentials are valid.
    """
    data = request.json
    
    if not data.get('school_email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400
    
    school_email = data['school_email'].lower()
    password = data['password']
    
    # Database query to find user
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error.'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT student_id, username, school_email, password, class, major
        FROM student
        WHERE school_email = %s
        """
        cursor.execute(query, (school_email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401
        
        #Not doing hashed passwords so don't use your real password when you sign up w testing data lmao
        if user['password'] != password:
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401
        
        # Return user data (excluding password)
        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'user': {
                'student_id': str(user['student_id']),
                'username': user['username'],
                'school_email': user['school_email'],
                'class': user['class'],
                'major': user['major']
            }
        }), 200
    
    except mysql.connector.Error as err:
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/', methods=['GET'])
def home():
    """Serves the simple landing page (pre-login view)."""
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

@app.route('/my_clubs', methods=['GET'])
def get_my_clubs():
    """
    Returns all of the associated student's clubs.
    """

    sid = request.args.get('sid')
    if not sid:
        return jsonify({
            'success': False,
            'message': 'Missing student ID (sid).'
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500
    

    try:
        cursor = conn.cursor(dictionary=True)
        query = """ 
                (SELECT c.club_id,c.club_name,c.club_type, c.club_biography
                FROM member m
                JOIN club c on m.club_id = c.club_id
                WHERE m.student_id=%s)

                UNION
                (SELECT c.club_id,c.club_name,c.club_type, c.club_biography
                FROM manages mg
                JOIN club c on mg.club_id = c.club_id
                WHERE mg.student_id=%s
                )


        """
        cursor.execute(query,(sid,sid))
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


