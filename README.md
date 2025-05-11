# Autonomous Warehouse Robot Simulator

A comprehensive warehouse robot simulation platform with both 2D and 3D visualization capabilities. This application simulates an autonomous robot navigating a warehouse environment, performing tasks such as picking and placing items, and managing its battery level through charging stations. The simulation provides real-time visualization options and detailed metrics of the robot's performance.

## Features

* **Warehouse Environment Simulation:**
  * Dynamic warehouse setup with configurable dimensions
  * Placement of obstacles, storage racks, items, and charging stations
  * Realistic physical modeling of the environment

* **Robot Simulation:**
  * Path planning and navigation
  * Task scheduling and execution
  * Battery management
  * Picking and placing operations

* **Visualization Options:**
  * 2D top-down visualization for basic monitoring
  * 3D web-based visualization for detailed real-time monitoring
  * Performance metrics and statistics dashboard

* **Task Management:**
  * Automatic task generation
  * Priority-based task scheduling
  * Task completion tracking and metrics

## Tech Stack

* **Backend:**
  * Python 3.x
  * Flask (for the web server and API)
  * Flask-SocketIO (for real-time WebSocket communication)
  * Eventlet (as WebSocket server)

* **Frontend 3D Visualization:**
  * HTML5/CSS3
  * JavaScript (ES6+)
  * Three.js (for 3D rendering)
  * Socket.IO client (for real-time updates)

* **Core Simulation:**
  * Custom Python modules for warehouse environment
  * Path planning algorithms
  * Task scheduling logic
  * Robot control logic

## Project Structure

```
autonomous_robot_simulation/
├── config/                # Configuration files and classes
│   ├── default_robot.yaml     # Default robot configuration
│   ├── default_warehouse.yaml # Default warehouse configuration
│   ├── robot_config.py        # Robot configuration loader
│   └── warehouse_config.py    # Warehouse configuration loader
├── dashboard/            # Performance monitoring
│   ├── dashboard.py          # Main dashboard interface
│   └── metrics.py            # Performance metrics calculations
├── environment/          # Simulation environment
│   ├── obstacle.py           # Obstacle class definition
│   └── warehouse.py          # Warehouse environment class
├── planning/             # Planning algorithms
│   ├── path_planner.py       # Path planning algorithms
│   └── task_scheduler.py     # Task scheduling logic
├── robot/                # Robot implementation
│   ├── gripper.py            # Robot gripper mechanism
│   └── robot.py              # Main robot class
├── utils/                # Utility modules
│   └── visualization.py      # 2D visualization utilities
├── vision/               # Perception systems
│   ├── object_classification.py  # Object classification
│   └── object_detection.py       # Object detection
├── web/                  # Web-based 3D visualization
│   ├── static/               # Static web assets
│   │   ├── css/                  # Stylesheets
│   │   │   └── styles.css            # Main CSS file
│   │   └── js/                   # JavaScript files
│   │       ├── robot-model.js        # 3D robot model
│   │       ├── simulation.js         # Simulation controller
│   │       ├── three-setup.js        # Three.js setup
│   │       └── warehouse-model.js    # 3D warehouse model
│   └── templates/            # HTML templates
│       └── index.html            # Main visualization page
├── requirements.txt      # Python dependencies
├── run_simulation.py     # Main simulation runner
├── web_server.py         # Web server for 3D visualization
└── README.md             # This file
```

## Setup and Installation

### Prerequisites

* Python 3.7 or higher
* `pip` (Python package installer)
* A modern web browser (e.g., Chrome, Firefox, Edge)

### Installation Steps

1.  **Download or Clone the Project:**
    If you have this project in a Git repository, clone it:
    ```bash
    git clone <your-repository-url>
    cd warehouse_simulator
    ```
    Otherwise, ensure all project files are in a directory named `warehouse_simulator`.

2.  **Backend Setup:**
    Navigate to the backend directory and install the required Python packages:
    ```bash
    cd backend
    pip install -r requirements.txt
    cd ..
    ```

3.  **Frontend Setup:**
    No specific build or installation steps are required for the frontend as it uses vanilla HTML, CSS, and JavaScript.

## How to Run

You need to run both the backend server and a server for the frontend files.

1.  **Start the Backend Server:**
    Open a terminal, navigate to the `backend` directory, and run:
    ```bash
    python app.py
    ```
    The backend server will typically start on `http://localhost:5000`. Keep this terminal window open.

2.  **Start the Frontend Server:**
    Open a *new* terminal window, navigate to the `frontend` directory, and use Python's built-in HTTP server (or any other simple HTTP server):
    ```bash
    python -m http.server 8000
    ```
    (You can use any available port instead of `8000`).

3.  **Access the Application:**
    Open your web browser and go to `http://localhost:8000` (or the port you used for the frontend server).

## API Endpoints (Backend)

The backend exposes the following main API endpoints:

* `POST /initialize_warehouse`: Initializes the warehouse with given dimensions.
    * Payload: `{"width": int, "height": int}`
* `POST /obstacle`: Adds an obstacle.
    * Payload: `{"x": int, "y": int}` (Note: type can be added if backend supports it)
* `DELETE /obstacle`: Removes an obstacle.
    * Payload: `{"x": int, "y": int}`
* `POST /plan_path`: Calculates the path from a start to an end point.
    * Payload: `{"start": {"x": int, "y": int}, "end": {"x": int, "y": int}}`

## Future Enhancements (Ideas)

* Implement more advanced pathfinding algorithms (e.g., A*).
* Store obstacle types on the backend and allow types to affect pathfinding.
* Add animation for the robot's movement along the path.
* Save and load warehouse layouts.
* Introduce different robot types or capabilities.
* Display more detailed performance metrics (e.g., path length, calculation time).
