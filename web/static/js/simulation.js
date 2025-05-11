/**
 * simulation.js
 * Handles the simulation logic and communication with the server.
 */

// Socket.io connection
let socket;

// Simulation state
let simulationState = {
    isConnected: false,
    isRunning: false,
    tasks: []
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Three.js environment
    initThreeJS();
    
    // Connect to the server
    connectToServer();
    
    // Start the animation loop
    animate();
    
    // Add event listeners for UI controls
    setupEventListeners();
});

/**
 * Setup event listeners for UI controls
 */
function setupEventListeners() {
    // Toggle robot following mode button
    const followRobotBtn = document.getElementById('toggle-follow-robot');
    if (followRobotBtn) {
        followRobotBtn.addEventListener('click', () => {
            // Button text is updated in the toggleFollowRobot() function
            toggleFollowRobot();
        });
    }
    
    // Add reconnect button functionality if it exists
    const reconnectBtn = document.getElementById('reconnect-button');
    if (reconnectBtn) {
        reconnectBtn.addEventListener('click', () => {
            if (!simulationState.isConnected) {
                connectToServer();
            }
        });
    }
    
    // Add simulation control buttons if they exist
    const startBtn = document.getElementById('start-simulation');
    const stopBtn = document.getElementById('stop-simulation');
    
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            socket.emit('start_simulation');
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            socket.emit('stop_simulation');
        });
    }
}

/**
 * Connect to the WebSocket server
 */
function connectToServer() {
    // Show loading message
    showLoadingMessage('Connecting to server...');
    
    // Get the server URL (current host)
    const serverUrl = window.location.origin;
    
    // Connect to Socket.IO server
    socket = io(serverUrl);
    
    // Connection event handlers
    socket.on('connect', () => {
        console.log('Connected to server');
        simulationState.isConnected = true;
        
        // Update loading message
        showLoadingMessage('Loading simulation data...');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        simulationState.isConnected = false;
        
        // Show disconnected message
        showLoadingMessage('Disconnected from server. Trying to reconnect...');
    });
    
    // Initial state from server
    socket.on('initial_state', (data) => {
        console.log('Received initial state:', data);
        
        // Initialize with received data
        initializeSimulation(data);
        
        // Hide loading message
        hideLoadingMessage();
    });
    
    // State updates from server
    socket.on('state_update', (data) => {
        // Update simulation with new data
        updateSimulation(data);
    });
    
    // Error handling
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        showLoadingMessage('Connection error. Retrying...');
    });
}

/**
 * Initialize the simulation with initial data
 * @param {Object} data - Initial simulation data
 */
function initializeSimulation(data) {
    // Initialize warehouse
    initWarehouse(data.warehouse);
    
    // Create robot model
    createRobotModel();
    
    // Update with initial data
    updateSimulation(data);
    
    // Start simulation
    simulationState.isRunning = true;
}

/**
 * Update simulation with new data
 * @param {Object} data - Updated simulation data
 */
function updateSimulation(data) {
    if (!simulationState.isRunning) return;
    
    // Update warehouse
    if (data.warehouse) {
        updateWarehouse(data.warehouse);
    }
    
    // Update robot
    if (data.robot) {
        // Update position and orientation
        updateRobotPosition(
            data.robot.position,
            data.robot.orientation
        );
        
        // Update robot dimensions if provided
        if (data.robot.dimensions) {
            robot.dimensions = data.robot.dimensions;
        }
        
        // Update robot status
        updateRobotStatus(data.robot.status);
        
        // Update robot battery
        if (data.robot.battery_percentage !== undefined) {
            updateRobotBattery(data.robot.battery_percentage);
        }
        
        // Update robot path
        if (data.robot.path) {
            updateRobotPath(data.robot.path);
        }
    }
    
    // Update tasks
    if (data.tasks) {
        updateTasks(data.tasks);
    }
}

/**
 * Update simulation on each frame
 * @param {number} deltaTime - Time since last update in seconds
 */
function updateFrame(deltaTime) {
    // Update UI elements that need continuous updates
    
    // This would include animations, interpolations between state updates, etc.
    // For now, we'll just update task display
    updateTaskDisplay();
}

/**
 * Update task information
 * @param {Array} tasks - Task data from server
 */
function updateTasks(tasks) {
    simulationState.tasks = tasks;
    
    // Update visual representation of tasks
    updateTaskVisuals(tasks);
    
    // Update task list in UI
    updateTaskDisplay();
}

/**
 * Update the visual representation of tasks in the 3D scene
 * @param {Array} tasks - Task data
 */
function updateTaskVisuals(tasks) {
    // Remove old task markers
    const existingMarkers = scene.children.filter(obj => obj.name && obj.name.startsWith('task_marker_'));
    existingMarkers.forEach(marker => {
        scene.remove(marker);
    });
    
    // Create new task markers
    tasks.forEach((task, index) => {
        // Skip completed tasks
        if (task.completed) return;
        
        // Create a marker based on task type
        let markerGeometry, markerMaterial;
        
        switch (task.type) {
            case 'pick':
                // Create a ring for pick tasks
                markerGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
                markerMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
                break;
                
            case 'place':
                // Create a square for place tasks
                markerGeometry = new THREE.PlaneGeometry(1, 1);
                markerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x3498db,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                break;
                
            case 'charge':
                // Create a lightning bolt shape for charge tasks
                markerGeometry = new THREE.CircleGeometry(0.5, 32);
                markerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xf39c12,
                    transparent: true,
                    opacity: 0.7
                });
                break;
                
            default:
                // Default marker for other task types
                markerGeometry = new THREE.CircleGeometry(0.3, 16);
                markerMaterial = new THREE.MeshBasicMaterial({ color: 0x95a5a6 });
        }
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
        // Position marker slightly above the floor
        marker.position.set(task.position[0], 0.1, task.position[1]);
        
        // Rotate plane markers to be horizontal
        if (task.type === 'place') {
            marker.rotation.x = -Math.PI / 2;
        }
        
        marker.name = `task_marker_${index}`;
        scene.add(marker);
        
        // Add a pulsing animation for the marker
        // This would be handled in the animation loop
    });
}

/**
 * Update the task list display in the UI
 */
function updateTaskDisplay() {
    const taskListElement = document.getElementById('task-list');
    if (!taskListElement) return;
    
    // Clear current list
    taskListElement.innerHTML = '';
    
    // Get current task (assumed to be the first task the robot is handling)
    const currentTask = simulationState.tasks.find(task => 
        robot.status === 'picking' && task.type === 'pick' ||
        robot.status === 'placing' && task.type === 'place' ||
        robot.status === 'charging' && task.type === 'charge'
    );
    
    // Update current task display
    const currentTaskElement = document.getElementById('robot-task');
    if (currentTaskElement) {
        if (currentTask) {
            currentTaskElement.textContent = `Current Task: ${currentTask.type.charAt(0).toUpperCase() + currentTask.type.slice(1)}`;
        } else {
            currentTaskElement.textContent = 'Current Task: None';
        }
    }
    
    // If no tasks, show message
    if (simulationState.tasks.length === 0) {
        taskListElement.innerHTML = '<div class="no-tasks">No tasks in queue</div>';
        return;
    }
    
    // Add tasks to the list
    simulationState.tasks.forEach((task, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.type} ${task.completed ? 'completed' : ''}`;
        
        const taskType = task.type.charAt(0).toUpperCase() + task.type.slice(1);
        const taskPosition = `(${task.position[0].toFixed(1)}, ${task.position[1].toFixed(1)})`;
        const taskStatus = task.completed ? 'Completed' : 'Pending';
        
        taskItem.innerHTML = `
            <div class="task-header">
                <span class="task-type">${taskType}</span>
                <span class="task-status">${taskStatus}</span>
            </div>
            <div class="task-details">
                <span class="task-position">Position: ${taskPosition}</span>
            </div>
        `;
        
        taskListElement.appendChild(taskItem);
    });
}

/**
 * Show a loading message
 * @param {string} message - Message to display
 */
function showLoadingMessage(message) {
    // Remove any existing loading overlay
    hideLoadingMessage();
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
    `;
    
    // Add to simulation container
    const container = document.getElementById('simulation-container');
    if (container) {
        container.appendChild(overlay);
    }
}

/**
 * Hide the loading message
 */
function hideLoadingMessage() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}
