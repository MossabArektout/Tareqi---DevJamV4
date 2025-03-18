from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
import google.generativeai as genai
import requests

from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
import sqlite3
import secrets
import re
import hashlib
import os
import logging
import json
from dotenv import load_dotenv
load_dotenv(override=True)


app = Flask(__name__)

app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email Configuration (using Gmail SMTP)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")

db = SQLAlchemy(app)
mail = Mail(app)

# Set up logging
logging.basicConfig(level=logging.INFO)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    otp = db.Column(db.String(6), nullable=True)

# Create all database tables
with app.app_context():
    db.create_all()
    logging.info("Database tables created successfully")

# Utility Functions
def generate_otp():
    return secrets.randbelow(900000) + 100000  # 6-digit OTP

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# Configure Gemini API
#loading env variables
load_dotenv(override=True)

# GEMINI_API_KEY = "AIzaSyAmEm0lOvt7kN2iSbRIJX5kd_mx5U8gWpY"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-1.5-pro')

# YouTube API Key
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def predict_job(answers):
    """Send user answers to Gemini and get a predicted job title."""
    prompt = f"""
    Act as an API. Analyze career questionnaire responses and return ONLY the best-suited IT job title.

    Input:
    1:What interests you most about technology: {answers[0]}
    2:Do you enjoy working with data: {answers[1]}
    3:How do you feel about coding: {answers[2]}
    4:Work environment preference: {answers[3]}
    5:Interested in AI/ML: {answers[4]}
    6:Working with large datasets: {answers[5]}
    7:Build or analyze systems: {answers[6]}
    8:Career goal: {answers[7]}

    Output: should be only the name of the best career not return anythng else.
    """
    
    response = model.generate_content(prompt)
    job_title = response.text.strip("[]")  # Extract job title
    return job_title

def generate_roadmap(job_role):
    """Generate a roadmap using Gemini API."""
    prompt = f"""
    Create a detailed and structured roadmap for a {job_role}.
    Include key skills, technologies, and milestones.
    Format the roadmap in Markdown with proper headings, bullet points, and bold text for emphasis.
    """
    
    response = model.generate_content(prompt)
    return response.text

def generate_school_recommendations(job_role):
    prompt=f""""Given the career path of a {job_role}, suggest relevant universities, engineering schools, business schools, or specialized institutions in Morocco that can help a student follow this path.

        The output should include:

       - 🎓 School Name
       - 📍 City
       - 🧭 Domain(s) of specialization related to this career
       - 🎯 Why it fits this career path
       - 🔗 (Optionally, include a link to the official website if known)
        Organize the list in a structured format with bullet points or table style.
        Suggest both public and private institutions, and prioritize those known for excellence in the required skills for this job."""
    response = model.generate_content(prompt)
    return response.text
def generate_mental_health_report(job_role):


    prompt=f"""
    I want you to act as a mental health and occupational wellness expert. I will give this {job_role} role, and your task is to analyze and provide a detailed, structured report on the potential psychological and mental health risks associated with this profession.

    Please structure your response as follows:

    1- Job Role Overview: A short description of the job, main duties, and work environment.

    2- Common Work-Related Stressors: List the main sources of stress or pressure in this job.

    3- Mental Health Risks: Identify specific mental health issues that professionals in this job may commonly face (e.g., anxiety, depression, burnout, etc.).

    4- Root Causes: Explain the underlying causes or contributing factors behind each issue.

    5- Real-life Case Examples (optional): If possible, include examples or statistics from studies or real reports.

    6- Preventive Measures and Recommendations: Provide practical suggestions for coping, self-care, and workplace improvement to minimize these risks.
    
    7- Recommended Resources and Research Papers:
        -Include 5 to 7 links to articles, official reports, or mental health organization pages (like WHO, NIMH, APA, etc.) that users can read to learn more about mental health issues related to job of {job_role}.

    Format everything using clear headings, bullet points, and concise explanations.
    """
    response = model.generate_content(prompt)
    return response.text

def generate_side_hustles(job_role):
    prompt=f"""
    I want you to act as a career and side hustle strategist. 

    Please provide a list of potential side hustles or income-generating opportunities that are most suitable and complementary to someone working as a {job_role}. The suggestions should consider the typical skill set and flexibility of that profession.

    Structure the answer like this:

    1. **Side Hustle Title**
    - **Description:** What it is and how it works.
    - **Estimated Time Commitment**
    - **Income Potential (Range)**
    - **Required Skills or Tools**
    - **Getting Started:** Provide a helpful link (platform, tool, or guide) to explore or start this side hustle.

    Please provide 5 to 7 well-researched and diverse side hustle ideas. Include direct links to freelance websites, remote work platforms, marketplaces, tools, or free courses. Format everything clearly in Markdown.
    Make sure to include **actual links** to real websites (no placeholders like [example.com]) that help people get started with the side hustle.
    """
    response = model.generate_content(prompt)
    return response.text

@app.route('/', endpoint='index')
def question_page():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        # Validate email
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            flash('Invalid email address', 'error')
            return redirect(url_for('register'))

        # Check password match
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('register'))

        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered', 'error')
            return redirect(url_for('register'))

        # Generate OTP
        otp = str(generate_otp())

        # Send OTP via email
        msg = Message('Your OTP for Registration', 
                      sender='taiqi', 
                      recipients=[email])
        msg.body = f'Your OTP is: {otp}'
        try:
            mail.send(msg)
            logging.info(f'OTP sent to {email}')
        except Exception as e:
            logging.error(f'Failed to send OTP: {e}')
            flash('Failed to send OTP. Please try again.', 'error')
            return redirect(url_for('register'))

        # Store OTP and email in session for OTP verification
        session['registration_email'] = email
        session['registration_password'] = password
        session['otp'] = otp  # Store OTP in session
        return redirect(url_for('verify_otp'))

    return render_template('register.html')

@app.route('/verify_otp', methods=['GET', 'POST'])
def verify_otp():
    if 'registration_email' not in session:
        flash('Please register first', 'error')
        return redirect(url_for('register'))

    if request.method == 'POST':
        entered_otp = request.form['otp']
        email = session['registration_email']
        registration_password = session['registration_password']
        otp = session['otp']

        if otp == entered_otp:
            # Create new user after OTP verification
            new_user = User(
                email=email, 
                password=hash_password(registration_password),  # Use the password from the form
                is_verified=True,
                otp=None  # Clear OTP after verification
            )
            db.session.add(new_user)
            db.session.commit()

            flash('Registration successful! Please login.', 'success')
            session.pop('registration_email', None)
            session.pop('registration_password', None)
            session.pop('otp', None)  # Clear OTP from session
            return redirect(url_for('login'))
        else:
            flash('Invalid OTP. Please try again.', 'error')

    return render_template('verify_otp.html')

# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if request.method == 'POST':
#         email = request.form['email']
#         password = request.form['password']

#         user = User.query.filter_by(email=email).first()
#         if user and user.password == hash_password(password) and user.is_verified:
#             session['user_id'] = user.id
#             flash('Login successful!', 'success')
#             return redirect(url_for('index'))
#         else:
#             flash('Invalid credentials or unverified account', 'error')

#     return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()
        if user and user.password == hash_password(password) and user.is_verified:
            session['user_id'] = user.id
            session['user_email'] = user.email  # Store email in session
            flash('Login successful!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid credentials or unverified account', 'error')

    return render_template('login.html')


@app.route('/question')
def question():
    if 'user_id' not in session:
        flash('Please login first', 'error')
        return redirect(url_for('login'))
    
    return render_template('question.html')

# @app.route('/recommend-job', methods=['POST'])
# def recommend_job():
#     data = request.get_json()
#     answers = data.get("answers")
    
#     if not answers or len(answers) != 8:
#         return jsonify({"error": "Invalid input"}), 400

#     try:
#         job_title = predict_job(answers)
#         return jsonify({"job": job_title})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/roadmap/<job_role>')
# def roadmap_page(job_role):
#     return render_template('roadmap.html', job_role=job_role)

@app.route('/recommend-job', methods=['POST'])
def recommend_job():
    data = request.get_json()
    answers = data.get("answers")
    
    if not answers or len(answers) != 8:
        return jsonify({"error": "Invalid input"}), 400

    try:
        job_title = predict_job(answers)
        return jsonify({"job": job_title})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/roadmap/<job_role>')
def roadmap_page(job_role):
    return render_template('roadmap.html', job_role=job_role)

@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap_route():
    job_role = request.form.get('job_role')
    if not job_role:
        return jsonify({"error": "Job role is required"}), 400

    try:
        roadmap_markdown = generate_roadmap(job_role)
        return jsonify({"markdown": roadmap_markdown})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/fetch-youtube-courses', methods=['GET'])
def fetch_youtube_courses():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        # Fetch YouTube courses using the YouTube Data API
        response = requests.get(f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query} tutorials&type=video&key={YOUTUBE_API_KEY}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/fetch-research-papers', methods=['GET'])
def fetch_research_papers():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit=5&fields=title,url"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        papers = []
        for paper in data.get('data', []):
            papers.append({
                "title": paper.get("title"),
                "link": paper.get("url")
            })

        return jsonify(papers)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/generate-school-recommendations', methods=['POST'])
def generate_school_recommendations_route():
    job_role = request.form.get('job_role')
    if not job_role:
        return jsonify({"error": "Job role is required"}), 400

    try:
        school_recommendations_markdown = generate_school_recommendations(job_role)
        return jsonify({"markdown": school_recommendations_markdown})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate-side-hustles', methods=['POST'])
def generate_side_hustles_route():
    job_role = request.form.get('job_role')
    if not job_role:
        return jsonify({"error": "Job role is required"}), 400

    try:
        side_hustles_markdown = generate_side_hustles(job_role)
        return jsonify({"markdown": side_hustles_markdown})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/generate-mental-health-report', methods=['POST'])
def generate_mental_health_report_route():
    job_role = request.form.get('job_role')
    if not job_role:
        return jsonify({"error": "Job role is required"}), 400

    try:
        mental_health_report_markdown = generate_mental_health_report(job_role)
        return jsonify({"markdown": mental_health_report_markdown})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)