from flask import request, jsonify
from config import app, db
from models import Task
from datetime import datetime
from auth import auth, token_required
from flask import g

# Register the auth blueprint
app.register_blueprint(auth, url_prefix='/auth')

@app.route("/tasks/<day>", methods=["GET"])
@token_required
def get_tasks(current_user, day):
    if day.lower() not in Task.VALID_DAYS:
        return jsonify({"message": "Invalid day"}), 400
        
    tasks = Task.query.filter_by(
        user_id=current_user.id,
        day=day.lower()
    ).all()
    tasks.sort(key=lambda task: task.start_time)
    return jsonify({"tasks": [task.to_json() for task in tasks]})

@app.route("/create_task", methods=["POST"])
@token_required
def create_task(current_user):
    try:
        data = request.json
        title = data.get("title")
        category = data.get("category")
        start_time = data.get("start_time")
        end_time = data.get("end_time")
        priority = data.get("priority", "").lower()
        day = data.get("day", "").lower()

        # Validate required fields
        if not all([title, category, start_time, end_time, priority, day]):
            return jsonify({
                "message": "All fields are required: title, category, start_time, end_time, priority, and day"
            }), 400

        # Validate priority
        if priority not in Task.VALID_PRIORITIES:
            return (
                jsonify({"message": f"Priority must be one of: {', '.join(Task.VALID_PRIORITIES)}"}),
                400,
            )

        # Parse time values from string to time objects
        try:
            start_time = datetime.strptime(start_time, '%H:%M').time()  # Parsing time
            end_time = datetime.strptime(end_time, '%H:%M').time()      # Parsing time
        except ValueError:
            return jsonify({"message": "Invalid time format. Use HH:MM"}), 400
        
        # Check for time overlap
        existing_tasks = Task.query.filter_by(user_id=current_user.id).all()
        for task in existing_tasks:
            if (task.start_time < end_time and task.end_time > start_time):
                return jsonify({"message": "Task overlaps with existing task"}), 400


        # Create new task
        new_task = Task(
            title=title,
            category=category,
            start_time=start_time,
            end_time=end_time,
            priority=priority,
            day=day,
            user_id=current_user.id
        )

        db.session.add(new_task)
        db.session.commit()
        return jsonify({"message": "Task Created!", "task": new_task.to_json()}), 201

    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route("/update_task/<int:task_id>", methods=["PATCH"])
@token_required
def update_task(current_user, task_id):
    try:
        task = Task.query.get(task_id)
        if not task:
            return jsonify({"message": "Task not found"}), 404
        
        # Add ownership check
        if task.user_id != current_user.id:
            return jsonify({"message": "Unauthorized access"}), 403
        
        data = request.json
        if "title" in data:
            task.title = data["title"]
        if "category" in data:
            task.category = data["category"]
        
        # Handle time updates (not dates)
        if "start_time" in data:
            try:
                task.start_time = datetime.strptime(data["start_time"], '%H:%M').time()  # Parsing time
            except ValueError:
                return jsonify({"message": "Invalid start time format. Use HH:MM"}), 400
                
        if "end_time" in data:
            try:
                task.end_time = datetime.strptime(data["end_time"], '%H:%M').time()  # Parsing time
            except ValueError:
                return jsonify({"message": "Invalid end time format. Use HH:MM"}), 400
        
        # Check for time overlap
        existing_tasks = Task.query.filter(Task.id != task_id, Task.user_id == current_user.id).all()
        for existing_task in existing_tasks:
            if (existing_task.start_time < task.end_time and existing_task.end_time > task.start_time):
                return jsonify({"message": "Task overlaps with existing task"}), 400
        
        # Validate that the end time is after the start time (if both are provided)
        if task.end_time < task.start_time:
            return jsonify({"message": "End time cannot be before start time"}), 400
            
        if "priority" in data:
            priority = data["priority"].lower()
            if priority not in Task.VALID_PRIORITIES:
                return jsonify({"message": f"Priority must be one of: {', '.join(Task.VALID_PRIORITIES)}"}), 400
            task.priority = priority

        db.session.commit()
        return jsonify({"message": "Task updated", "task": task.to_json()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route("/delete_task/<int:task_id>", methods=["DELETE"])
@token_required
def delete_task(current_user, task_id):
    try:
        task = Task.query.get(task_id)
        if not task:
            return jsonify({"message": "Task not found"}), 404
        
        # Add ownership check
        if task.user_id != current_user.id:
            return jsonify({"message": "Unauthorized access"}), 403
        
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted"}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'message': 'Unauthorized access'}), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({'message': 'Forbidden'}), 403

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
