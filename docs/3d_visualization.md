# 3D Visualization for Warehouse Robot Simulation

This document describes how to use the 3D web-based visualization for the autonomous warehouse robot simulation.

## Overview

The 3D visualization provides a real-time interactive view of the warehouse robot simulation. It allows you to monitor the robot's movement, task execution, and battery status in a visually rich environment.

## Running the Visualization

To start the simulation with 3D visualization:

```bash
python run_simulation.py --web
```

By default, the web server runs on port 5000. You can access the visualization by opening a web browser and navigating to:

```
http://localhost:5000
```

You can specify a different port using the `--web-port` option:

```bash
python run_simulation.py --web --web-port=8080
```

## Features

### Warehouse Environment

The 3D visualization displays:
- The warehouse floor and walls
- Storage racks
- Obstacles
- Items to be picked/placed
- Charging stations

### Robot Visualization

The robot is displayed with:
- Accurate position and orientation
- Visual status indicators (color changes based on status)
- Path visualization for planned routes
- Current task information

### User Interface

The interface includes:
- Real-time status display
- Battery level indicator
- Task list with current and pending tasks
- Statistics panel for performance metrics

### Camera Controls

- **Pan**: Click and drag with the left mouse button
- **Zoom**: Use the mouse wheel or pinch gestures
- **Rotate**: Click and drag with the right mouse button or CTRL+left-click
- **Reset**: Double-click to reset the camera view

### Control Buttons

- **Toggle Grid**: Show/hide the ground grid
- **Toggle Paths**: Show/hide robot planned paths
- **Top View**: Switch to top-down perspective
- **Follow Robot**: Toggle camera following the robot

## Technology

The 3D visualization is built using:
- **Three.js**: A JavaScript 3D library
- **Socket.IO**: For real-time bidirectional communication
- **Flask**: Python web framework serving the visualization
- **Flask-SocketIO**: WebSocket implementation for Flask

## Extending the Visualization

### Adding New Models

Custom 3D models can be added to the visualization by:
1. Creating new JavaScript functions in the appropriate files:
   - `robot-model.js` for robot components
   - `warehouse-model.js` for warehouse elements
   
2. Adding the model creation code and ensuring it's properly positioned

3. Updating the simulation state handling to include new data

### Customizing the UI

The UI can be customized by:
1. Modifying the CSS styles in `/web/static/css/styles.css`
2. Updating the HTML structure in `/web/templates/index.html`
3. Adding new UI elements and interaction in the JavaScript files

## Troubleshooting

If you encounter issues:

- **Blank page**: Ensure the web server is running and check the browser console for errors
- **No updates**: Verify WebSocket connections are working properly
- **Performance issues**: Reduce the complexity of the visualization by toggling off paths and grid
- **Connection errors**: Check firewall settings and ensure the port is available

## Performance Considerations

For optimal performance:
- Use a modern browser with WebGL support
- Close the 3D visualization if you're running long simulations and don't need to observe them
- For very large warehouses, consider using the `--headless` option with the simulation and only use the visualization when needed
