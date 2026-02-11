from flask import Blueprint, request, jsonify
from models.task import Reflection
from utils.database import db
from utils.validators import validate_reflection_data, format_response
from services.reflection_service import ReflectionService

reflection_bp = Blueprint('reflections', __name__)

@reflection_bp.route('/', methods=['POST'])
def submit_reflection():
    """Submit a new reflection"""
    try:
        data = request.get_json()
        
        # Validate reflection data
        is_valid, message, validation_details = validate_reflection_data(data)
        if not is_valid:
            return format_response(False, message, validation_details), 400
        
        # Create reflection object
        reflection = Reflection(
            reflection_id=f"ref_{data['user_id']}_{data.get('day_number', 1)}",
            user_id=data['user_id'],
            task_id=data['task_id'],
            day_number=data.get('day_number', 1),
            learning=data['learning'],
            feeling=data['feeling'],
            improvement=data['improvement'],
            mood_before=data.get('mood_before', 'okay'),
            mood_after=data.get('mood_after', 'okay')
        )
        
        # Confirm honesty if provided
        if data.get('honesty_confirmed'):
            reflection.confirm_honesty()
        
        # Calculate quality score
        quality_score = reflection.calculate_quality_score()
        
        # Generate appreciation
        appreciation = reflection.generate_appreciation(data.get('mood_after', 'okay'))
        reflection.micro_appreciation = appreciation
        
        # Save to database
        reflection_service = ReflectionService(db)
        created_reflection = reflection_service.create_reflection(reflection.to_dict())
        
        # Update user progress
        reflection_service.update_user_progress(data['user_id'], reflection.word_count)
        
        return format_response(True, "Reflection submitted successfully", {
            'reflection_id': reflection.reflection_id,
            'quality_score': quality_score,
            'word_count': reflection.word_count,
            'micro_appreciation': appreciation,
            'validation_details': validation_details
        })
        
    except Exception as e:
        return format_response(False, f"Error submitting reflection: {str(e)}"), 500

@reflection_bp.route('/user/<user_id>', methods=['GET'])
def get_user_reflections(user_id):
    """Get all reflections for a user"""
    try:
        reflections = db.get_user_reflections(user_id)
        
        return format_response(True, "User reflections retrieved", {
            'reflections': reflections,
            'total_reflections': len(reflections)
        })
        
    except Exception as e:
        return format_response(False, f"Error getting user reflections: {str(e)}"), 500

@reflection_bp.route('/<reflection_id>', methods=['GET'])
def get_reflection(reflection_id):
    """Get specific reflection by ID"""
    try:
        reflection = db.get_reflection(reflection_id)
        
        if not reflection:
            return format_response(False, "Reflection not found"), 404
        
        return format_response(True, "Reflection retrieved", {'reflection': reflection})
        
    except Exception as e:
        return format_response(False, f"Error getting reflection: {str(e)}"), 500

@reflection_bp.route('/validate', methods=['POST'])
def validate_reflection():
    """Validate reflection without submitting"""
    try:
        data = request.get_json()
        
        # Validate reflection data
        is_valid, message, validation_details = validate_reflection_data(data)
        
        return format_response(True, message if is_valid else "Validation failed", {
            'is_valid': is_valid,
            'validation_details': validation_details
        })
        
    except Exception as e:
        return format_response(False, f"Error validating reflection: {str(e)}"), 500
