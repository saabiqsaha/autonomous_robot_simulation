/**
 * three-setup.js
 * Sets up the Three.js environment for the warehouse robot simulation.
 */

// Global variables
let camera, scene, renderer, controls;
let clock = new THREE.Clock();

// Configuration
const config = {
    showGrid: true,
    showPaths: true,
    followRobot: false,
    backgroundColor: 0xf0f0f0,
    gridSize: 100,
    gridDivisions: 100,
    gridColor: 0xcccccc
};

/**
 * Initialize the Three.js scene
 */
function initThreeJS() {
    // Get container dimensions
    const container = document.getElementById('simulation-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    scene.add(directionalLight);

    // Add a smaller fill light from the opposite direction
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-50, 50, -50);
    scene.add(fillLight);

    // Create perspective camera
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(25, 25, 25);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add renderer to container
    container.appendChild(renderer.domElement);

    // Add OrbitControls for camera manipulation
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 100;

    // Add grid helper
    addGrid();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Add event listeners for control buttons
    document.getElementById('toggle-grid').addEventListener('click', toggleGrid);
    document.getElementById('toggle-paths').addEventListener('click', togglePaths);
    document.getElementById('toggle-top-view').addEventListener('click', setTopView);
    document.getElementById('toggle-follow-robot').addEventListener('click', toggleFollowRobot);
    
    // Add keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);
}

/**
 * Create and add a ground grid to the scene
 */
function addGrid() {
    if (config.showGrid) {
        const gridHelper = new THREE.GridHelper(config.gridSize, config.gridDivisions, config.gridColor, config.gridColor);
        gridHelper.position.y = 0;
        gridHelper.name = 'grid';
        scene.add(gridHelper);
    }
}

/**
 * Handle window resize
 */
function onWindowResize() {
    const container = document.getElementById('simulation-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Update robot and other animated elements
    updateFrame(clock.getDelta());

    // Render scene
    renderer.render(scene, camera);
}

/**
 * Toggle grid visibility
 */
function toggleGrid() {
    config.showGrid = !config.showGrid;
    
    const grid = scene.getObjectByName('grid');
    if (grid) {
        grid.visible = config.showGrid;
    } else if (config.showGrid) {
        addGrid();
    }
}

/**
 * Toggle path visibility
 */
function togglePaths() {
    config.showPaths = !config.showPaths;
    
    // Update paths visibility
    const pathObjects = scene.children.filter(obj => obj.name && obj.name.startsWith('path'));
    pathObjects.forEach(obj => {
        obj.visible = config.showPaths;
    });
}

/**
 * Set camera to top view
 */
function setTopView() {
    camera.position.set(0, 50, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.update();
}

/**
 * Toggle robot following mode
 */
function toggleFollowRobot() {
    config.followRobot = !config.followRobot;
    document.getElementById('toggle-follow-robot').innerText = 
        config.followRobot ? 'Free Camera' : 'Follow Robot';
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyDown(event) {
    // Ignore keyboard shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (event.key.toLowerCase()) {
        case 't':
            // Toggle top view
            setTopView();
            break;
        case 'g':
            // Toggle grid
            toggleGrid();
            break;
        case 'p':
            // Toggle paths
            togglePaths();
            break;
        case 'f':
            // Toggle follow robot
            toggleFollowRobot();
            break;
        case 'r':
            // Reset camera
            camera.position.set(25, 25, 25);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            break;
    }
}
