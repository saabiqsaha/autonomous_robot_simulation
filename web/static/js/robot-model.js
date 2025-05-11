/**
 * robot-model.js
 * Creates and manages the 3D robot model.
 */

// Global robot object
let robot = {
    position: [0, 0],
    orientation: 0,
    status: 'idle',
    batteryLevel: 100,
    dimensions: {
        width: 0.5,
        length: 0.7,
        height: 0.4
    },
    model: null,
    path: [],
    pathLine: null
};

// Robot materials
const robotMaterials = {
    body: new THREE.MeshStandardMaterial({ 
        color: 0xe74c3c, 
        roughness: 0.5, 
        metalness: 0.7 
    }),
    wheels: new THREE.MeshStandardMaterial({ 
        color: 0x2c3e50, 
        roughness: 0.7, 
        metalness: 0.3 
    }),
    sensors: new THREE.MeshStandardMaterial({ 
        color: 0x3498db, 
        roughness: 0.3, 
        metalness: 0.8 
    }),
    gripper: new THREE.MeshStandardMaterial({ 
        color: 0xf39c12, 
        roughness: 0.4, 
        metalness: 0.6 
    }),
    detail: new THREE.MeshStandardMaterial({ 
        color: 0xecf0f1, 
        roughness: 0.4, 
        metalness: 0.5 
    })
};

/**
 * Create the 3D robot model
 */
function createRobotModel() {
    // Main group for the robot
    robot.model = new THREE.Group();
    robot.model.name = 'robot';
    
    // Robot body
    const bodyGeometry = new THREE.BoxGeometry(
        robot.dimensions.width, 
        robot.dimensions.height, 
        robot.dimensions.length
    );
    const body = new THREE.Mesh(bodyGeometry, robotMaterials.body);
    // Position the body so its bottom is at y=0
    body.position.y = robot.dimensions.height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    robot.model.add(body);
    
    // Add wheels (4 cylinders)
    const wheelRadius = 0.1;
    const wheelThickness = 0.05;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
    wheelGeometry.rotateX(Math.PI / 2); // Rotate to align with the robot's movement
    
    // Calculate wheel positions
    const wheelOffsetX = robot.dimensions.width / 2 - wheelRadius;
    const wheelOffsetZ = robot.dimensions.length / 2 - wheelRadius;
    const wheelPositions = [
        [-wheelOffsetX, wheelRadius, -wheelOffsetZ], // front left
        [wheelOffsetX, wheelRadius, -wheelOffsetZ],  // front right
        [-wheelOffsetX, wheelRadius, wheelOffsetZ],  // rear left
        [wheelOffsetX, wheelRadius, wheelOffsetZ]    // rear right
    ];
    
    // Add each wheel
    wheelPositions.forEach((pos, i) => {
        const wheel = new THREE.Mesh(wheelGeometry, robotMaterials.wheels);
        wheel.position.set(...pos);
        wheel.castShadow = true;
        wheel.name = `wheel_${i}`;
        robot.model.add(wheel);
    });
    
    // Add a sensor array (small dome on top)
    const sensorRadius = 0.15;
    const sensorGeometry = new THREE.SphereGeometry(sensorRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const sensor = new THREE.Mesh(sensorGeometry, robotMaterials.sensors);
    sensor.position.set(0, robot.dimensions.height + sensorRadius / 2, 0);
    sensor.castShadow = true;
    robot.model.add(sensor);
    
    // Add directional marker (small arrow to show orientation)
    const markerLength = robot.dimensions.length / 2;
    const markerGeometry = new THREE.ConeGeometry(0.08, markerLength, 8);
    markerGeometry.rotateX(-Math.PI / 2); // Point forward (along Z axis)
    const marker = new THREE.Mesh(markerGeometry, robotMaterials.detail);
    marker.position.set(0, robot.dimensions.height / 2, -robot.dimensions.length / 2 - markerLength / 2);
    marker.castShadow = true;
    robot.model.add(marker);
    
    // Add gripper (positioned at the front)
    addGripper();
    
    // Add robot to scene
    scene.add(robot.model);
    
    // Position robot initially
    updateRobotPosition([1, 1], 0);
}

/**
 * Add gripper to the robot model
 */
function addGripper() {
    const gripperGroup = new THREE.Group();
    gripperGroup.name = 'gripper';
    
    // Gripper base
    const baseGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.2);
    const base = new THREE.Mesh(baseGeometry, robotMaterials.gripper);
    base.castShadow = true;
    gripperGroup.add(base);
    
    // Gripper arms
    const armGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.2);
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, robotMaterials.gripper);
    leftArm.position.set(-0.125, 0.075, 0);
    leftArm.castShadow = true;
    gripperGroup.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, robotMaterials.gripper);
    rightArm.position.set(0.125, 0.075, 0);
    rightArm.castShadow = true;
    gripperGroup.add(rightArm);
    
    // Position gripper at the front of the robot
    gripperGroup.position.set(0, robot.dimensions.height / 3, -robot.dimensions.length / 2 - 0.1);
    
    robot.model.add(gripperGroup);
}

/**
 * Update robot position and orientation
 * @param {Array} position - New position [x, z]
 * @param {number} orientation - New orientation in radians
 */
function updateRobotPosition(position, orientation) {
    if (!robot.model) return;
    
    // Update the model position
    robot.model.position.set(position[0], 0, position[1]);
    robot.model.rotation.y = orientation;
    
    // Update the robot state
    robot.position = position;
    robot.orientation = orientation;
    
    // Update camera if following robot
    if (config.followRobot) {
        const dist = 5; // Distance from robot
        const height = 3; // Height above robot
        const x = position[0] - Math.sin(orientation) * dist;
        const z = position[1] - Math.cos(orientation) * dist;
        
        camera.position.set(x, height, z);
        camera.lookAt(position[0], 0, position[1]);
    }
}

/**
 * Update robot path visualization
 * @param {Array} pathPoints - Array of path points [[x1, z1], [x2, z2], ...]
 */
function updateRobotPath(pathPoints) {
    // Remove old path line if it exists
    if (robot.pathLine) {
        scene.remove(robot.pathLine);
    }
    
    if (!pathPoints || pathPoints.length < 2 || !config.showPaths) {
        robot.path = [];
        robot.pathLine = null;
        return;
    }
    
    // Create a new path line
    const points = [
        new THREE.Vector3(robot.position[0], 0.05, robot.position[1]),
        ...pathPoints.map(p => new THREE.Vector3(p[0], 0.05, p[1]))
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xe74c3c, linewidth: 2 });
    
    robot.pathLine = new THREE.Line(geometry, material);
    robot.pathLine.name = 'path_line';
    
    // Add to scene
    scene.add(robot.pathLine);
    
    // Update the robot path state
    robot.path = pathPoints;
}

/**
 * Update the robot model based on status
 * @param {string} status - Robot status ('idle', 'moving', 'picking', 'placing', 'charging')
 */
function updateRobotStatus(status) {
    if (robot.status === status) return;
    
    robot.status = status;
    
    // Visual updates based on status
    if (status === 'idle') {
        robotMaterials.body.emissive.set(0x000000);
    } else if (status === 'moving') {
        robotMaterials.body.emissive.set(0x2ecc71);
        robotMaterials.body.emissiveIntensity = 0.3;
    } else if (status === 'picking' || status === 'placing') {
        robotMaterials.body.emissive.set(0xf39c12);
        robotMaterials.body.emissiveIntensity = 0.3;
    } else if (status === 'charging') {
        robotMaterials.body.emissive.set(0x3498db);
        robotMaterials.body.emissiveIntensity = 0.3;
    }
    
    // Animation effects could be added here
    
    // Update UI
    updateRobotUI();
}

/**
 * Update the robot battery level
 * @param {number} level - Battery level (0-100)
 */
function updateRobotBattery(level) {
    robot.batteryLevel = level;
    
    // Update UI
    updateRobotUI();
}

/**
 * Update the robot UI elements
 */
function updateRobotUI() {
    // Update status display
    const statusElement = document.getElementById('robot-status');
    if (statusElement) {
        statusElement.textContent = robot.status.charAt(0).toUpperCase() + robot.status.slice(1);
        
        // Reset classes and add current status
        statusElement.className = '';
        statusElement.classList.add(robot.status);
    }
    
    // Update battery display
    const batteryLevel = document.querySelector('.battery-level');
    const batteryPercentage = document.querySelector('.battery-percentage');
    
    if (batteryLevel && batteryPercentage) {
        const percentage = Math.max(0, Math.min(100, robot.batteryLevel));
        batteryLevel.style.width = `${percentage}%`;
        batteryPercentage.textContent = `${Math.round(percentage)}%`;
        
        // Color based on level
        if (percentage > 50) {
            batteryLevel.style.backgroundColor = '#2ecc71';
        } else if (percentage > 20) {
            batteryLevel.style.backgroundColor = '#f39c12';
        } else {
            batteryLevel.style.backgroundColor = '#e74c3c';
        }
    }
    
    // Update position and orientation displays
    const positionElement = document.getElementById('robot-position');
    const orientationElement = document.getElementById('robot-orientation');
    
    if (positionElement) {
        positionElement.textContent = `Position: (${robot.position[0].toFixed(2)}, ${robot.position[1].toFixed(2)})`;
    }
    
    if (orientationElement) {
        const degrees = (robot.orientation * 180 / Math.PI) % 360;
        orientationElement.textContent = `Orientation: ${degrees.toFixed(1)}°`;
    }
}
