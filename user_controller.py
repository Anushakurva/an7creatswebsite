from flask import Blueprint, request, jsonify
from models.user import User
from utils.database import db
from utils.validators import validate_user_data, generate_user_id, format_response

user_bp = Blueprint('users', __name__)

@user_bp.route('/guest', methods=['POST'])
def create_guest_user():
    """Create a new guest user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        is_valid, message = validate_user_data(data)
        if not is_valid:
            return format_response(False, message), 400
        
        # Create guest user
        user_id = generate_user_id('GUEST')
        user = User(
            user_id=user_id,
            name=data['name'],
            status=data['status'],
            confusion_area=data['confusion_area'],
            struggle_type=data['struggle_type'],
            journey_days=data.get('journey_days', 7),
            user_type='guest'
        )
        
        # Save to database
        created_user = db.create_user(user.to_dict())
        
        return format_response(True, "Guest user created successfully", {
            'user_id': user_id,
            'user_type': 'guest',
            'user': created_user
        })
        
    except Exception as e:
        return format_response(False, f"Error creating guest user: {str(e)}"), 500

@user_bp.route('/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'status', 'confusion_area', 'struggle_type']
        for field in required_fields:
            if not data.get(field):
                return format_response(False, f"{field} is required"), 400
        
        # Validate data
        is_valid, message = validate_user_data(data)
        if not is_valid:
            return format_response(False, message), 400
        
        # Create registered user
        user_id = generate_user_id('REG')
        user = User(
            user_id=user_id,
            name=data['name'],
            email=data['email'],
            status=data['status'],
            confusion_area=data['confusion_area'],
            struggle_type=data['struggle_type'],
            journey_days=data.get('journey_days', 7),
            user_type='registered'
        )
        
        # In a real app, you'd hash the password here
        # For now, we'll store it as-is (NOT PRODUCTION READY)
        user_data = user.to_dict()
        user_data['password'] = data['password']  # Add password to user data
        
        # Save to database
        created_user = db.create_user(user_data)
        
        return format_response(True, "User registered successfully", {
            'user_id': user_id,
            'user_type': 'registered',
            'user': created_user
        })
        
    except Exception as e:
        return format_response(False, f"Error registering user: {str(e)}"), 500

@user_bp.route('/login', methods=['POST'])
def login_user():
    """Login existing user"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return format_response(False, "Email and password are required"), 400
        
        # Get user from database
        users = [user for user in db.get_all_users() if user.get('email') == data['email']]
        
        if not users:
            return format_response(False, "Invalid credentials"), 401
        
        user = users[0]
        
        # In a real app, you'd verify password hash here
        # For now, we'll do simple comparison (NOT PRODUCTION READY)
        if user.get('password') != data['password']:
            return format_response(False, "Invalid credentials"), 401
        
        return format_response(True, "Login successful", {
            'user_id': user['user_id'],
            'user_type': user['user_type'],
            'user': user
        })
        
    except Exception as e:
        return format_response(False, f"Error during login: {str(e)}"), 500

@user_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    try:
        user = db.get_user(user_id)
        
        if not user:
            return format_response(False, "User not found"), 404
        
        return format_response(True, "User found", {'user': user})
        
    except Exception as e:
        return format_response(False, f"Error getting user: {str(e)}"), 500

@user_bp.route('/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information"""
    try:
        data = request.get_json()
        
        # Get existing user
        existing_user = db.get_user(user_id)
        if not existing_user:
            return format_response(False, "User not found"), 404
        
        # Update user
        success = db.update_user(user_id, data)
        
        if success:
            return format_response(True, "User updated successfully")
        else:
            return format_response(False, "Failed to update user"), 500
        
    except Exception as e:
        return format_response(False, f"Error updating user: {str(e)}"), 500

# Add helper method to database manager for getting all users
def get_all_users_method():
    """Helper method to get all users from database"""
    return list(db.users.values()) if hasattr(db, 'users') else []

# Monkey patch the method to database manager
import utils.database
utils.database.DatabaseManager.get_all_users = get_all_users_method
