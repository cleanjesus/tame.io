# Tame.io

Tame.io is a task management application designed to help users organize their time, boost productivity, and manage tasks efficiently. The application is built using Flask for the backend and React with Vite for the frontend.

## Features

- User authentication (login and registration)
- Create, update, and delete tasks
- Organize tasks by day and category
- Set task priorities (low, medium, high)
- Responsive design for mobile and desktop
- User settings for profile management and preferences

## Tech Stack

- **Frontend**: React, Vite, CSS
- **Backend**: Flask, SQLAlchemy, SQLite
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Python 3.x
- Node.js and npm
- SQLite

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd /tame.io/backend
   ```

2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```bash
   python main.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd /tame.io/frontend
   ```

2. Install the required Node packages:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### Usage

- Open your browser and navigate to `http://localhost:5173` to access the frontend.
- The backend API will be running at `http://127.0.0.1:5000`.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License.
