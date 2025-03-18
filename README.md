# Tareqi

Tareqi is a career guidance prototype designed to help individuals explore IT career paths based on their interests and preferences. Users answer a series of questions, and the app generates a customized roadmap with resources, mental health insights, and side hustle/job opportunities. While this is a fast prototype, our vision is to expand it into a comprehensive career guidance tool.

---
## Demo Video
https://github.com/MossabArektout/Tareqi---DevJamV4/tree/main/assests


## Features

### Interactive Career Questions
- Select answers for eight questions to guide career recommendations.

### Roadmap Generation
- Get a customized career roadmap based on responses.

### Resource Explorer
Click on roadmap sections to reveal a sidebar with helpful resources, including:
- **YouTube videos**
- **Official documentation**
- **PDFs**

### Mental Health Section
- Identifies potential mental health challenges related to the chosen career.
- Provides causes, solutions, prevention methods, and research papers.

### Side Hustles & Job Market Insights
- Lists side hustles and related job opportunities.
- Includes average salaries and application websites.

---

## Future Plans

### Expanded Career Paths
- Currently focused on IT careers due to high demand and accessibility.
- Plans to cover other industries in future updates.

### Dynamic Question System
- The current prototype features only 8 static questions due to time constraints.
- Future goal: Make it more adaptive and personalized.

### Improved Roadmap Design
- Right now, the focus is on functionality.
- Plans to enhance the visual appeal and user experience.

### More Advanced Features
- This is just a prototype, but with time and effort, we believe Tareqi can become a game-changer in career guidance.

---

## How to Run the Project

```bash
pip install Flask google-generativeai requests Flask-SQLAlchemy Flask-Mail sqlite3 dotenv
```

## Running the Application

### Clone the repository:

```bash
git clone https://github.com/yourusername/tareqi.git
cd tareqi
```

### Initialize the database
```bash
python init_db.py
```

### Run the Flask application:
```bash
python app.py
```
