#!/usr/bin/env python3
"""
Web server for the 3D visualization of the autonomous robot simulation.
"""

import os
import json
import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask(__name__, 
            static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web/static'),
            template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web/templates'))
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins="*")

# Store the latest simulation state
simulation_state = {
    "robot": {
        "position": [0, 0],
        "orientation": 0,
        "status": "idle"
    },
    "warehouse": {
        "width": 20,
        "length": 30,
        "obstacles": [],
        "items": [],
        "racks": [],
        "charging_stations": []
    },
    "tasks": []
}

@app.route('/')
def index():
    """Render the main 3D visualization page."""
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    """Handle client connection to the socket."""
    print("Client connected")
    # Send initial state
    socketio.emit('initial_state', simulation_state)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection from the socket."""
    print("Client disconnected")

def update_simulation_state(robot, warehouse, scheduler=None):
    """
    Update the simulation state with current data from the simulation.
    
    Args:
        robot: Robot object
        warehouse: Warehouse object
        scheduler: TaskScheduler object (optional)
    """
    global simulation_state
    
    # Update robot state
    simulation_state["robot"] = {
        "position": robot.position.tolist() if hasattr(robot.position, 'tolist') else list(robot.position),
        "orientation": robot.orientation,
        "status": robot.status,
        "battery_level": robot.battery_level,
        "battery_percentage": (robot.battery_level / robot.config.get("battery_capacity")) * 100,
        "dimensions": {
            "width": robot.config.get("width"),
            "length": robot.config.get("length"),
            "height": robot.config.get("height", 0.4)
        },
        "path": [p.tolist() if hasattr(p, 'tolist') else list(p) for p in robot.path] if robot.path else []
    }
    
    # Update warehouse state
    simulation_state["warehouse"] = {
        "width": warehouse.width,
        "length": warehouse.length,
        "obstacles": [
            {
                "position": list(obs.position),
                "dimensions": list(obs.dimensions)
            } for obs in warehouse.obstacles
        ],
        "items": [
            {
                "id": item.item_id,
                "type": item.item_type,
                "position": list(item.position),
                "dimensions": list(item.dimensions) if hasattr(item, 'dimensions') else [0.2, 0.2, 0.2]
            } for item in warehouse.items
        ],
        "racks": [
            {
                "position": list(rack_pos),
                "dimensions": [
                    warehouse.config.get("rack_width"),
                    warehouse.config.get("rack_length"),
                    1.0  # Default height
                ]
            } for rack_pos in warehouse.racks
        ],
        "charging_stations": [
            {
                "position": list(station_pos)
            } for station_pos in warehouse.charging_stations
        ]
    }
    
    # Update tasks if scheduler is provided
    if scheduler:
        simulation_state["tasks"] = [
            {
                "type": task.get_type(),
                "position": list(task.get_position()),
                "completed": task.completed
            } for task in scheduler.tasks
        ]
    
    # Emit updated state to all connected clients
    socketio.emit('state_update', simulation_state)

def start_web_server(debug=False, port=5000):
    """
    Start the web server for the 3D visualization.
    
    Args:
        debug (bool): Whether to run in debug mode
        port (int): Port to run the server on
    """
    print(f"Starting web server on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

if __name__ == "__main__":
    # If run directly, start the web server
    start_web_server(debug=True)
