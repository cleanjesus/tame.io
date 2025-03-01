from config import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    tasks = db.relationship('Task', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)  
    priority = db.Column(db.String(10), nullable=False)
    day = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    VALID_PRIORITIES = ['low', 'medium', 'high']
    VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    def __init__(self, **kwargs):
        super(Task, self).__init__(**kwargs)
        if self.priority.lower() not in self.VALID_PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(self.VALID_PRIORITIES)}")
        if self.day.lower() not in self.VALID_DAYS:
            raise ValueError(f"Day must be one of: {', '.join(self.VALID_DAYS)}")

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "priority": self.priority,
            "day": self.day
        }
