import os
from dotenv import load_dotenv
import mysql.connector
from flask import Flask, request, jsonify
from flask import session
from werkzeug.security import generate_password_hash, check_password_hash


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




@app.route('/clubs/<int:club_id>/membership', methods=['GET'])
def check_membership(club_id):
    """
    Checks if a student is a member of a specific club.
    Requires student_id as a query parameter.
    """
    student_id = request.args.get('student_id')
    if not student_id:
        return jsonify({'success': False, 'message': 'student_id is required.'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        # Check if membership exists (assuming table name is 'student_club' or 'membership')
        # Try common table names
        query = """
        SELECT * FROM member
        WHERE student_id = %s AND club_id = %s
        """
        cursor.execute(query, (student_id, club_id))
        membership = cursor.fetchone()
        
        is_member = membership is not None
        return jsonify({
            'success': True, 
            'is_member': is_member
        }), 200
    finally:
        cursor.close()
        conn.close()

@app.route('/clubs/<int:club_id>/join', methods=['POST'])
def join_club(club_id):
    """
    Adds a student to a club.
    Requires student_id in the request body.
    """
    data = request.json
    if not data or not data.get('student_id'):
        return jsonify({'success': False, 'message': 'student_id is required.'}), 400
    
    student_id = data['student_id']
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        # First check if already a member
        check_query = """
        SELECT * FROM member 
        WHERE student_id = %s AND club_id = %s
        """
        cursor.execute(check_query, (student_id, club_id))
        existing = cursor.fetchone()
        
        if existing:
            return jsonify({
                'success': False, 
                'message': 'Student is already a member of this club.'
            }), 400
        
        # Insert membership (try student_club table first)
        insert_query = """
        INSERT INTO member (student_id, club_id)
        VALUES (%s, %s)
        """
        cursor.execute(insert_query, (student_id, club_id))
        conn.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Successfully joined the club!'
        }), 201
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
@app.route('/clubs/<int:club_id>/events', methods=['GET'])
def get_club_events(club_id):
    """
    Returns upcoming events for a specific club.
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                event_name,
                event_description,
                event_type,
                event_date,
                start_time,
                end_time,
                venue
            FROM event
            WHERE club_id = %s
              AND (event_date IS NULL OR event_date >= CURDATE())
            ORDER BY event_date ASC
        """
        cursor.execute(query, (club_id,))
        events = cursor.fetchall()

        # --- FIX START: Convert timedelta objects to strings ---
        for event in events:
            if event.get('start_time'):
                event['start_time'] = str(event['start_time'])
            if event.get('end_time'):
                event['end_time'] = str(event['end_time'])
        # --- FIX END ---

        return jsonify({'success': True, 'events': events}), 200

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/clubs/<int:club_id>/events', methods=['POST'])
def create_club_event(club_id):
    """
    Creates a new event for a club. Only the club admin can create events.
    Expects JSON: {
      "student_id": <logged in student_id>,
      "event_name": "...",          # required
      "event_type": "...",          # optional
      "event_description": "...",   # optional
      "event_date": "YYYY-MM-DD",   # optional but recommended
      "start_time": "HH:MM:SS",     # optional
      "end_time": "HH:MM:SS",       # optional
      "venue": "..."                # optional
    }
    """
    data = request.json or {}

    # Basic validation
    if not data.get('student_id'):
        return jsonify({'success': False, 'message': 'student_id is required.'}), 400
    if not data.get('event_name'):
        return jsonify({'success': False, 'message': 'event_name is required.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 1) Verify club exists and who the admin is
        cursor.execute("SELECT admin_id FROM club WHERE club_id = %s", (club_id,))
        club_row = cursor.fetchone()
        if not club_row:
            return jsonify({'success': False, 'message': 'Club not found.'}), 404

        admin_id = club_row['admin_id']
        # student_id in DB might be INT, so cast both sides to int for comparison
        try:
            requester_id = int(data['student_id'])
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid student_id.'}), 400

        if requester_id != admin_id:
            return jsonify({'success': False, 'message': 'Only the club admin can create events.'}), 403

        # 2) Insert the event
        insert_query = """
            INSERT INTO event (
                club_id,
                event_name,
                event_type,
                event_description,
                event_date,
                start_time,
                end_time,
                venue
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            club_id,
            data['event_name'],
            data.get('event_type'),
            data.get('event_description'),
            data.get('event_date'),
            data.get('start_time'),
            data.get('end_time'),
            data.get('venue')
        )

        cursor.execute(insert_query, values)
        conn.commit()
        new_id = cursor.lastrowid

        # Return the created event so frontend can append without refetch
        created_event = {
            'event_id': new_id,
            'club_id': club_id,
            'event_name': data['event_name'],
            'event_type': data.get('event_type'),
            'event_description': data.get('event_description'),
            'event_date': data.get('event_date'),
            'start_time': data.get('start_time'),
            'end_time': data.get('end_time'),
            'venue': data.get('venue'),
        }

        return jsonify({'success': True, 'event': created_event}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
@app.route('/events/<int:event_id>/rsvp', methods=['POST'])
def rsvp_event(event_id):
    """
    Allows a student to RSVP to an event.
    Expects JSON: { "student_id": <int>, "status": "yes" | "no" | "maybe" }
    Saves or updates the RSVP in the rsvp table.
    """

    data = request.json or {}

    student_id = data.get('student_id')
    status = (data.get('status') or "").lower()

    # Validate fields
    if not student_id:
        return jsonify({
            'success': False,
            'message': 'student_id is required.'
        }), 400

    if status not in ('yes', 'no', 'maybe'):
        return jsonify({
            'success': False,
            'message': "status must be one of: 'yes', 'no', or 'maybe'."
        }), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({
            'success': False,
            'message': 'Database connection failed.'
        }), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Confirm event exists
        cursor.execute("SELECT event_id FROM event WHERE event_id = %s", (event_id,))
        if cursor.fetchone() is None:
            return jsonify({
                'success': False,
                'message': f'Event {event_id} does not exist.'
            }), 404

        # Confirm student exists
        cursor.execute("SELECT student_id FROM student WHERE student_id = %s", (student_id,))
        if cursor.fetchone() is None:
            return jsonify({
                'success': False,
                'message': f'Student {student_id} does not exist.'
            }), 404

        # UPSERT into rsvp table
        query = """
            INSERT INTO rsvp (student_id, event_id, status)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        """
        cursor.execute(query, (student_id, event_id, status))
        conn.commit()

        return jsonify({
            'success': True,
            'message': 'RSVP saved.',
            'event_id': event_id,
            'student_id': student_id,
            'status': status
        }), 200

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({
            'success': False,
            'message': f'Database error: {err}'
        }), 500

    finally:
        cursor.close()
        conn.close()


@app.route('/clubs/<int:club_id>/announcements', methods=['GET', 'POST'])
def club_announcements(club_id):
    """
    GET  -> list announcements for a club
    POST -> create a new announcement (admin only)
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        if request.method == 'GET':
            # ---- list announcements ----
            query = """
                SELECT 
                    announcement_id,
                    announcement_header,
                    announcement_body,
                    club_id
                FROM announcements
                WHERE club_id = %s
                ORDER BY announcement_id
            """
            cursor.execute(query, (club_id,))
            rows = cursor.fetchall()
            return jsonify({'success': True, 'announcements': rows}), 200

        # ---------- POST: create announcement (admin only) ----------
        data = request.json or {}
        student_id = data.get('student_id')
        header = (data.get('announcement_header') or '').strip()
        body = (data.get('announcement_body') or '').strip()

        if not student_id or not header or not body:
            return jsonify({
                'success': False,
                'message': 'student_id, announcement_header, and announcement_body are required.'
            }), 400

        # Check if this student is the admin for this club
        cursor.execute("SELECT admin_id FROM club WHERE club_id = %s", (club_id,))
        club_row = cursor.fetchone()
        if not club_row:
            return jsonify({'success': False, 'message': 'Club not found.'}), 404

        admin_id = club_row['admin_id']
        if str(admin_id) != str(student_id):
            return jsonify({'success': False, 'message': 'Only the club admin can post announcements.'}), 403

        # Insert announcement
        insert_query = """
            INSERT INTO announcements (announcement_header, announcement_body, club_id)
            VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, (header, body, club_id))
        conn.commit()

        return jsonify({'success': True, 'message': 'Announcement created.'}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/make_post', methods=['POST'])
def create_post():
    data = request.json
    
    # 1. Validation
    if not data.get('student_id') or not data.get('header') or not data.get('body'):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500

    try:
        cursor = conn.cursor()
        
        # 2. Insert ONLY the content. MySQL handles the post_id automatically.
        query = "INSERT INTO post (student_id, post_header, post_body) VALUES (%s, %s, %s)"
        values = (data['student_id'], data['header'], data['body'])
        
        cursor.execute(query, values)
        conn.commit()
        
        # 3. Retrieve the auto-generated ID (e.g., 207)
        new_post_id = cursor.lastrowid
        
        return jsonify({
            'success': True, 
            'message': 'Post created successfully!',
            'post': {
                'post_id': new_post_id,
                'student_id': data['student_id'],
                'post_header': data['header'],
                'post_body': data['body']
            }
        }), 201

    except mysql.connector.Error as err:
        return jsonify({'success': False, 'message': f'Database error: {err}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/get_posts', methods=['GET'])
def get_posts():
    """
    Returns all posts from the 'post' table.
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection failed.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM post")
        rows = cursor.fetchall()
        return jsonify({'success': True, 'post': rows}), 200

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


