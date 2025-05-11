# 3D Warehouse Robot Visualization

This component provides a web-based 3D visualization for the autonomous warehouse robot simulation. It allows users to monitor the robot, environment, and tasks in real-time through an interactive 3D interface.

## Features

- **Real-time 3D visualization** of the robot simulation
- **Interactive camera controls** to view the simulation from any angle
- **Status panels** showing robot information, tasks, and statistics
- **WebSocket communication** for live updates from the simulation

## System Architecture

The 3D visualization system consists of:

1. **Web Server**: A Flask application with Socket.IO integration that serves the web interface and handles real-time communication
2. **Frontend UI**: HTML/CSS interface with status panels and controls
3. **Three.js Visualization**: JavaScript modules using Three.js for 3D rendering
4. **WebSocket Communication**: Bidirectional communication channel between the simulation and the browser

## Directory Structure

```
/web
├── static/           # Static assets
│   ├── css/          # Stylesheets
│   │   └── styles.css    # Main CSS file
│   └── js/           # JavaScript modules
│       ├── robot-model.js       # 3D robot model
│       ├── simulation.js        # Simulation controller
│       ├── three-setup.js       # Three.js setup
│       └── warehouse-model.js   # 3D warehouse model
└── templates/        # HTML templates
    └── index.html        # Main visualization page
/web_server.py        # Flask/Socket.IO web server
```

## Module Descriptions

### Web Server (`web_server.py`)

Handles the communication between the Python simulation and the web browser:
- Serves the web pages and static assets
- Manages WebSocket connections using Socket.IO
- Transforms simulation state into a format suitable for the web visualization
- Broadcasts state updates to all connected clients

### HTML Template (`web/templates/index.html`)

Provides the structure for the web interface:
- Loads required libraries (Three.js, Socket.IO)
- Defines UI panels for robot status, tasks, and statistics
- Includes control buttons for visualization options

### CSS Styling (`web/static/css/styles.css`)

Styles the web interface:
- Defines layout and appearance of the UI panels
- Styles status indicators, battery display, and task list
- Provides responsive design for different screen sizes

### Three.js Setup (`web/static/js/three-setup.js`)

Initializes and configures the Three.js environment:
- Sets up the WebGL renderer
- Creates the scene, camera, and lighting
- Configures camera controls
- Handles window resizing and keyboard shortcuts

### Warehouse Model (`web/static/js/warehouse-model.js`)

Creates and manages the 3D warehouse environment:
- Renders the warehouse floor, walls, and grid
- Creates and updates obstacles, racks, and items
- Manages charging stations with visual effects

### Robot Model (`web/static/js/robot-model.js`)

Creates and manages the 3D robot model:
- Creates detailed robot model with animated components
- Updates robot position, orientation, and status
- Visualizes robot paths and battery level
- Provides visual feedback for different robot states

### Simulation Controller (`web/static/js/simulation.js`)

Handles the overall simulation logic and communication:
- Manages WebSocket connection to the server
- Processes incoming state updates
- Coordinates updates to warehouse and robot models
- Updates UI elements with current simulation state

## Usage

To use the 3D visualization:

1. Start the simulation with the `--web` flag:
   ```bash
   python run_simulation.py --web
   ```

2. Open a web browser and navigate to:
   ```
   http://localhost:5000
   ```

3. Use the mouse to navigate the 3D view:
   - Left-click and drag to rotate
   - Right-click and drag to pan
   - Scroll to zoom

4. Use the control buttons to:
   - Toggle grid visibility
   - Toggle path visibility
   - Switch to top view
   - Toggle robot following mode

5. Use keyboard shortcuts:
   - `T`: Toggle top view
   - `G`: Toggle grid
   - `P`: Toggle paths
   - `F`: Toggle follow robot
   - `R`: Reset camera

## Customization

### Adding New 3D Models

To add new visual elements:

1. Create new model creation functions in the appropriate JavaScript file
2. Update the state update handlers to process new data
3. Add any necessary UI elements to display information about the new models

### Changing the Visual Style

To customize the appearance:

1. Modify material colors and properties in the JavaScript files
2. Update CSS styles for UI elements
3. Adjust lighting parameters in `three-setup.js`

## Troubleshooting

### Common Issues

- **No connection**: Ensure the web server is running and the port is available
- **Missing 3D elements**: Check browser console for JavaScript errors
- **Performance issues**: Reduce scene complexity, disable shadows, or lower resolution

### Performance Optimization

For better performance:
- Reduce the number of shadow-casting lights
- Simplify geometries for less important objects
- Use level-of-detail (LOD) rendering for complex models
- Enable frustum culling for large environments
