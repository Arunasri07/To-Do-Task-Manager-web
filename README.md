To-Do Task Manager Web Application

Project Description

The To-Do Task Manager is a full-stack web application that helps users create, manage, update, and track their daily tasks.

Features

- Add new tasks with a title, description, and deadline
- View all tasks
- Edit and delete tasks
- Mark tasks as Pending or Completed
- Filter tasks by status
- Search tasks by title or description
- Set task priorities: Low, Medium, and High
- Identify overdue tasks
- Store task information in an SQLite database
- Responsive user interface

Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Python Flask
- Database: SQLite
- API: REST API

Project Structure

todo-task-manager/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
└── README.md

Installation and Setup

1. Clone the repository:
   
   git clone https://github.com/Arunasri07/To-Do-Task-Manager-web.git

2. Navigate to the project folder:
   
   cd To-Do-Task-Manager-web

3. Create and activate a virtual environment:
   
   python -m venv .venv
   
   On Windows:
   
   .venv\Scripts\activate

4. Install dependencies:
   
   pip install -r backend/requirements.txt

5. Start the Flask application:
   
   cd backend
python app.py

6. Open your browser and visit:
   "http://127.0.0.1:5000"

Database

SQLite stores task information. The database is created automatically when the backend starts.

Project Objective

To develop a responsive task management application using Flask REST APIs and SQLite for persistent task storage.
