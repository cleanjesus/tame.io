from flask import Blueprint, request, jsonify
from models import User, db
import jwt
from datetime import datetime, timedelta
from functools import wraps
import json

auth = Blueprint('auth', __name__)
SECRET_KEY = 'your-secret-key'  # In production, use environment variable

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # Convert timestamp back to datetime for comparison
            exp_timestamp = data.get('exp')
            if datetime.fromtimestamp(exp_timestamp) < datetime.utcnow():
                return jsonify({'message': 'Token has expired'}), 401
                
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except Exception as e:
            return jsonify({'message': f'Token is invalid: {str(e)}'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        # Validate required fields
        if not all(k in data for k in ["username", "email", "password"]):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Validate username
        if not data['username'] or len(data['username']) < 3:
            return jsonify({'message': 'Username must be at least 3 characters long'}), 400
        
        # Validate email format
        if not '@' in data['email'] or not '.' in data['email']:
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Check if username exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        
        # Check if email exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email']
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'username': new_user.username,
                'email': new_user.email
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500

@auth.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        if not all(k in data for k in ["username", "password"]):
            return jsonify({'message': 'Missing username or password'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        if not user:
            return jsonify({'message': 'Invalid username or password'}), 401
        
        if user.check_password(data['password']):
            # Extend token expiration to 7 days
            exp_time = datetime.utcnow() + timedelta(days=7)  # Changed from 1 to 7 days
            token_payload = {
                'user_id': user.id,
                'exp': exp_time.timestamp()
            }
            
            token = jwt.encode(token_payload, SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'token': token,
                'username': user.username,
                'user_id': user.id
            }), 200
        else:
            return jsonify({'message': 'Invalid username or password'}), 401
        
    except Exception as e:
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500

@auth.route('/update_profile', methods=['PATCH'])
@token_required
def update_profile(current_user):
    try:
        data = request.json
        
        if not data.get('current_password'):
            return jsonify({'message': 'Current password is required'}), 400
            
        if not current_user.check_password(data['current_password']):
            return jsonify({'message': 'Current password is incorrect'}), 401

        # Check if username is being updated
        if data.get('username'):
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'message': 'Username already exists'}), 400
            current_user.username = data['username']

        # Check if email is being updated
        if data.get('email'):
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'message': 'Email already exists'}), 400
            current_user.email = data['email']

        # Update password if provided
        if data.get('new_password'):
            current_user.set_password(data['new_password'])

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500 