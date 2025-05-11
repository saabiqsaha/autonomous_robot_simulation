/**
 * three-setup.js
 * Sets up the Three.js environment for the warehouse robot simulation.
 */

// Global variables
let camera, scene, renderer, controls;
let clock = new THREE.Clock();

// Shared resources for better performance
const sharedGeometries = {
    box: {},      // Will contain box geometries by size
    cylinder: {}, // Will contain cylinder geometries by size
    sphere: {}    // Will contain sphere geometries by size
};

// Configuration
const config = {
    showGrid: true,
    showPaths: true,
    followRobot: false,
    backgroundColor: 0xf0f0f0,
    gridSize: 50,  // Reduced from 100
    gridDivisions: 50,  // Reduced from 100
    gridColor: 0xcccccc,
    simplifiedView: false
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
    
    // Update loading progress
    if (typeof updateLoadingProgress === 'function') {
        updateLoadingProgress('startLoad', 'Creating 3D environment...');
    }
    scene.background = new THREE.Color(config.backgroundColor);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    
    // Configure shadow properties based on performance mode
    const currentPerformanceMode = typeof getPerformanceMode === 'function' ? 
                                  getPerformanceMode() : 'balanced';
    
    let shadowResolution = 1024; // Default (balanced)
    
    switch (currentPerformanceMode) {
        case 'low':
            shadowResolution = 512;
            break;
        case 'high':
            shadowResolution = 2048;
            break;
    }
    
    directionalLight.shadow.mapSize.width = shadowResolution;
    directionalLight.shadow.mapSize.height = shadowResolution;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    // Store reference to main shadow-casting light for later adjustments
    window.mainLight = directionalLight;
    
    scene.add(directionalLight);

    // Add a smaller fill light from the opposite direction
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-50, 50, -50);
    // Fill light doesn't cast shadows for better performance
    fillLight.castShadow = false;
    scene.add(fillLight);
    
    // Update loading progress
    if (typeof updateLoadingProgress === 'function') {
        updateLoadingProgress('gridLoaded', 'Setting up lighting...');
    }

    // Create perspective camera
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(25, 25, 25);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance' // Prioritize performance
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Set pixel ratio based on performance mode - default to balanced
    const currentPerformanceMode = typeof getPerformanceMode === 'function' ? 
                                  getPerformanceMode() : 'balanced';
    
    switch (currentPerformanceMode) {
        case 'low':
            renderer.setPixelRatio(1);
            break;
        case 'high':
            renderer.setPixelRatio(window.devicePixelRatio);
            break;
        case 'balanced':
        default:
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            break;
    }
    
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
 * Helper function to get a shared box geometry
 * @param {number} width - Width of the box
 * @param {number} height - Height of the box
 * @param {number} depth - Depth of the box
 * @returns {THREE.BoxGeometry} The box geometry
 */
function getSharedBoxGeometry(width, height, depth) {
    const key = `${width}_${height}_${depth}`;
    
    if (!sharedGeometries.box[key]) {
        sharedGeometries.box[key] = new THREE.BoxGeometry(width, height, depth);
    }
    
    return sharedGeometries.box[key];
}

/**
 * Helper function to get a shared cylinder geometry
 * @param {number} radius - Radius of the cylinder
 * @param {number} height - Height of the cylinder
 * @param {number} radialSegments - Number of segments around the circumference
 * @returns {THREE.CylinderGeometry} The cylinder geometry
 */
function getSharedCylinderGeometry(radius, height, radialSegments = 32) {
    const key = `${radius}_${height}_${radialSegments}`;
    
    if (!sharedGeometries.cylinder[key]) {
        sharedGeometries.cylinder[key] = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
    }
    
    return sharedGeometries.cylinder[key];
}

/**
 * Helper function to get a shared sphere geometry
 * @param {number} radius - Radius of the sphere
 * @param {number} segments - Number of segments (both width and height)
 * @returns {THREE.SphereGeometry} The sphere geometry
 */
function getSharedSphereGeometry(radius, segments = 32) {
    const key = `${radius}_${segments}`;
    
    if (!sharedGeometries.sphere[key]) {
        sharedGeometries.sphere[key] = new THREE.SphereGeometry(radius, segments, segments);
    }
    
    return sharedGeometries.sphere[key];
}

/**
 * Update shadow resolution of all shadow-casting lights
 * @param {number} resolution - New shadow map resolution
 */
function updateShadowResolution(resolution) {
    scene.traverse(function(object) {
        if (object.isLight && object.castShadow) {
            object.shadow.mapSize.width = resolution;
            object.shadow.mapSize.height = resolution;
            // Force shadow map to update
            object.shadow.map = null;
        }
    });
}

/**
 * Dispose of all shared geometries to free memory
 */
function disposeSharedGeometries() {
    // Dispose box geometries
    Object.values(sharedGeometries.box).forEach(geometry => {
        geometry.dispose();
    });
    sharedGeometries.box = {};
    
    // Dispose cylinder geometries
    Object.values(sharedGeometries.cylinder).forEach(geometry => {
        geometry.dispose();
    });
    sharedGeometries.cylinder = {};
    
    // Dispose sphere geometries
    Object.values(sharedGeometries.sphere).forEach(geometry => {
        geometry.dispose();
    });
    sharedGeometries.sphere = {};
    
    console.log('Disposed all shared geometries');
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

/**
 * Toggle a simplified view mode for improved performance
 * @param {boolean} enabled - Whether simplified view is enabled
 */
function toggleSimplifiedView(enabled) {
    // Store current mode
    config.simplifiedView = enabled;
    console.log(`Simplified view mode: ${enabled ? 'enabled' : 'disabled'}`);
    
    // Update renderer settings
    if (enabled) {
        // Disable shadows completely
        renderer.shadowMap.enabled = false;
        
        // Reduce pixel ratio to minimum
        renderer.setPixelRatio(1);
        
        // Simplify all materials in the scene
        scene.traverse(function(object) {
            if (object.isMesh) {
                // Save original material if not already saved
                if (!object.userData.originalMaterial) {
                    object.userData.originalMaterial = object.material;
                }
                
                // Use a simple basic material with the same color
                if (object.userData.originalMaterial.color) {
                    object.material = new THREE.MeshBasicMaterial({ 
                        color: object.userData.originalMaterial.color,
                        wireframe: false
                    });
                } else {
                    // Default color if no color available
                    object.material = new THREE.MeshBasicMaterial({ 
                        color: 0xcccccc,
                        wireframe: false
                    });
                }
            }
        });
    } else {
        // Re-enable shadows based on current performance mode
        let performanceMode = 'balanced';
        if (typeof getPerformanceMode === 'function') {
            performanceMode = getPerformanceMode();
        }
        
        renderer.shadowMap.enabled = true;
        
        // Restore original materials
        scene.traverse(function(object) {
            if (object.isMesh && object.userData.originalMaterial) {
                object.material = object.userData.originalMaterial;
            }
        });
        
        // Restore pixel ratio based on performance mode
        switch (performanceMode) {
            case 'low':
                renderer.setPixelRatio(1);
                break;
            case 'high':
                renderer.setPixelRatio(window.devicePixelRatio);
                break;
            case 'balanced':
            default:
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                break;
        }
    }
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);

    // Update performance monitor
    if (typeof updatePerformanceMonitor === 'function') {
        updatePerformanceMonitor();
    }

    // Update controls
    controls.update();

    // Update robot and other animated elements
    updateFrame(clock.getDelta());
    
    // Apply robot level-of-detail based on camera distance
    if (typeof applyRobotLOD === 'function') {
        applyRobotLOD(camera);
    }
    
    // Apply frustum culling - don't render objects outside of camera view
    if (typeof applyFrustumCulling === 'function') {
        applyFrustumCulling(camera);
    }

    // Render scene
    renderer.render(scene, camera);
}
