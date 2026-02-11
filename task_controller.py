from flask import Blueprint, request, jsonify
from datetime import datetime
from models.task import Task
from utils.database import db
from utils.validators import validate_task_window, format_response
from services.task_service import TaskService

task_bp = Blueprint('tasks', __name__)

@task_bp.route('/today/<user_id>', methods=['GET'])
def get_today_task(user_id):
    """Get today's task for a user"""
    try:
        # Check if within task window
        is_valid, message = validate_task_window()
        if not is_valid:
            return format_response(False, message), 403
        
        # Get user
        user = db.get_user(user_id)
        if not user:
            return format_response(False, "User not found"), 404
        
        # Get today's task
        task_service = TaskService(db)
        today_task = task_service.get_or_create_today_task(user_id, user)
        
        return format_response(True, "Today's task retrieved", {
            'task': today_task.to_dict() if today_task else None,
            'user_current_day': user.get('current_day', 1),
            'journey_days': user.get('journey_days', 7)
        })
        
    except Exception as e:
        return format_response(False, f"Error getting today's task: {str(e)}"), 500

@task_bp.route('/<task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Mark a task as completed"""
    try:
        data = request.get_json() or {}
        response = data.get('response', '')
        
        # Get task
        task = db.get_task(task_id)
        if not task:
            return format_response(False, "Task not found"), 404
        
        # Update task completion
        task_obj = Task(
            task_id=task['task_id'],
            user_id=task['user_id'],
            day_number=task['day_number'],
            task_content=task['task_content'],
            task_type=task.get('task_type', 'learning'),
            difficulty=task.get('difficulty', 'medium'),
            mood_adapted=task.get('mood_adapted', 'okay')
        )
        task_obj.complete(response)
        
        # Update in database
        success = db.update_user(task['user_id'], {
            'current_day': task['day_number'] + 1,
            'last_active_date': datetime.utcnow().isoformat()
        })
        
        if success:
            return format_response(True, "Task completed successfully", {
                'task_completed': True,
                'next_day': task['day_number'] + 1
            })
        else:
            return format_response(False, "Failed to update user progress"), 500
        
    except Exception as e:
        return format_response(False, f"Error completing task: {str(e)}"), 500

@task_bp.route('/user/<user_id>', methods=['GET'])
def get_user_tasks(user_id):
    """Get all tasks for a user"""
    try:
        tasks = db.get_user_tasks(user_id)
        
        return format_response(True, "User tasks retrieved", {
            'tasks': tasks,
            'total_tasks': len(tasks)
        })
        
    except Exception as e:
        return format_response(False, f"Error getting user tasks: {str(e)}"), 500

@task_bp.route('/<task_id>', methods=['GET'])
def get_task(task_id):
    """Get specific task by ID"""
    try:
        task = db.get_task(task_id)
        
        if not task:
            return format_response(False, "Task not found"), 404
        
        return format_response(True, "Task retrieved", {'task': task})
        
    except Exception as e:
        return format_response(False, f"Error getting task: {str(e)}"), 500
