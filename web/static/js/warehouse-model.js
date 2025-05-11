/**
 * warehouse-model.js
 * Creates and manages the 3D warehouse environment.
 */

// Global warehouse object
let warehouse = {
    width: 20,
    length: 30,
    model: null,
    obstacles: [],
    racks: [],
    items: [],
    chargingStations: []
};

// Material definitions
const materials = {
    floor: new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        roughness: 0.7, 
        metalness: 0.1 
    }),
    wall: new THREE.MeshStandardMaterial({ 
        color: 0x94a3b8, 
        roughness: 0.6, 
        metalness: 0.2 
    }),
    rack: new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, 
        roughness: 0.8, 
        metalness: 0.2 
    }),
    obstacle: new THREE.MeshStandardMaterial({ 
        color: 0x4b5563, 
        roughness: 0.7, 
        metalness: 0.3 
    }),
    item: new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6, 
        roughness: 0.4, 
        metalness: 0.4 
    }),
    chargingStation: new THREE.MeshStandardMaterial({ 
        color: 0x10b981, 
        roughness: 0.3, 
        metalness: 0.6,
        emissive: 0x10b981,
        emissiveIntensity: 0.2
    })
};

/**
 * Initialize the warehouse environment
 * @param {Object} config - Warehouse configuration
 */
function initWarehouse(config) {
    // Update warehouse dimensions
    warehouse.width = config.width;
    warehouse.length = config.length;
    
    // Create warehouse model container
    warehouse.model = new THREE.Group();
    warehouse.model.name = 'warehouse';
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(warehouse.width, warehouse.length);
    const floor = new THREE.Mesh(floorGeometry, materials.floor);
    floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    floor.position.set(warehouse.width / 2, 0, warehouse.length / 2);
    floor.receiveShadow = true;
    warehouse.model.add(floor);
    
    // Create walls
    createWalls();
    
    // Add warehouse to scene
    scene.add(warehouse.model);
}

/**
 * Create walls around the warehouse
 */
function createWalls() {
    const wallHeight = 3;
    const wallThickness = 0.3;
    
    // Wall geometries
    const northSouthWallGeometry = new THREE.BoxGeometry(warehouse.width + wallThickness * 2, wallHeight, wallThickness);
    const eastWestWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, warehouse.length);
    
    // North wall (z = 0)
    const northWall = new THREE.Mesh(northSouthWallGeometry, materials.wall);
    northWall.position.set(warehouse.width / 2, wallHeight / 2, -wallThickness / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    warehouse.model.add(northWall);
    
    // South wall (z = length)
    const southWall = new THREE.Mesh(northSouthWallGeometry, materials.wall);
    southWall.position.set(warehouse.width / 2, wallHeight / 2, warehouse.length + wallThickness / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    warehouse.model.add(southWall);
    
    // East wall (x = width)
    const eastWall = new THREE.Mesh(eastWestWallGeometry, materials.wall);
    eastWall.position.set(warehouse.width + wallThickness / 2, wallHeight / 2, warehouse.length / 2);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    warehouse.model.add(eastWall);
    
    // West wall (x = 0)
    const westWall = new THREE.Mesh(eastWestWallGeometry, materials.wall);
    westWall.position.set(-wallThickness / 2, wallHeight / 2, warehouse.length / 2);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    warehouse.model.add(westWall);
}

/**
 * Update the warehouse with new data
 * @param {Object} warehouseData - New warehouse data from the server
 */
function updateWarehouse(warehouseData) {
    // Update dimensions if changed
    if (warehouse.width !== warehouseData.width || warehouse.length !== warehouseData.length) {
        warehouse.width = warehouseData.width;
        warehouse.length = warehouseData.length;
        
        // Remove old model and recreate
        if (warehouse.model) {
            scene.remove(warehouse.model);
        }
        initWarehouse(warehouseData);
    }
    
    // Update obstacles
    updateObstacles(warehouseData.obstacles);
    
    // Update racks
    updateRacks(warehouseData.racks);
    
    // Update items
    updateItems(warehouseData.items);
    
    // Update charging stations
    updateChargingStations(warehouseData.charging_stations);
}

/**
 * Update obstacles in the warehouse
 * @param {Array} obstacleData - New obstacle data
 */
function updateObstacles(obstacleData) {
    // Remove old obstacles
    warehouse.obstacles.forEach(obstacle => {
        warehouse.model.remove(obstacle);
        if (obstacle.geometry) obstacle.geometry.dispose();
        if (obstacle.material) obstacle.material.dispose();
    });
    warehouse.obstacles = [];
    
    // Limit the number of obstacles for better performance (max 20)
    const limitedObstacles = obstacleData.slice(0, 20);
    
    // Check if obstacles have similar dimensions to use instancing
    let canUseInstancing = true;
    let defaultDimensions = limitedObstacles.length > 0 ? [
        limitedObstacles[0].dimensions[0],
        limitedObstacles[0].dimensions[1],
        limitedObstacles[0].dimensions[2]
    ] : [1, 1, 1];
    
    for (const data of limitedObstacles) {
        if (data.dimensions[0] !== defaultDimensions[0] ||
            data.dimensions[1] !== defaultDimensions[1] ||
            data.dimensions[2] !== defaultDimensions[2]) {
            canUseInstancing = false;
            break;
        }
    }
    
    // Create shared geometry if possible
    let sharedGeometry = null;
    if (canUseInstancing && limitedObstacles.length > 0) {
        sharedGeometry = new THREE.BoxGeometry(
            defaultDimensions[0],
            defaultDimensions[2],
            defaultDimensions[1]
        );
    }
    
    // Create new obstacles
    limitedObstacles.forEach((data, index) => {
        let obstacle;
        
        if (sharedGeometry) {
            // Use shared geometry
            obstacle = new THREE.Mesh(sharedGeometry, materials.obstacle);
            obstacle.position.set(data.position[0], defaultDimensions[2] / 2, data.position[1]);
        } else {
            // Create individual geometry
            const width = data.dimensions[0];
            const length = data.dimensions[1];
            const height = data.dimensions[2];
            
            const geometry = new THREE.BoxGeometry(width, height, length);
            obstacle = new THREE.Mesh(geometry, materials.obstacle);
            
            // Position at center of obstacle with y at half height (bottom at y=0)
            obstacle.position.set(data.position[0], height / 2, data.position[1]);
        }
        
        obstacle.castShadow = index < 5; // Only first 5 obstacles cast shadows
        obstacle.receiveShadow = index < 5; // Only first 5 obstacles receive shadows
        obstacle.name = `obstacle_${index}`;
        
        warehouse.model.add(obstacle);
        warehouse.obstacles.push(obstacle);
    });
}

/**
 * Update racks in the warehouse
 * @param {Array} rackData - New rack data
 */
function updateRacks(rackData) {
    // Remove old racks
    warehouse.racks.forEach(rack => {
        warehouse.model.remove(rack);
        if (rack.geometry) rack.geometry.dispose();
        if (rack.material) rack.material.dispose();
    });
    warehouse.racks = [];
    
    // Limit the number of racks to improve performance (max 30)
    // For a large warehouse, showing a subset of racks is sufficient for visualization
    const limitedRacks = rackData.slice(0, 30);
    
    // Create a shared geometry and material for better performance
    const defaultWidth = limitedRacks.length > 0 && limitedRacks[0].dimensions ? 
                          limitedRacks[0].dimensions[0] : 1.0;
    const defaultLength = limitedRacks.length > 0 && limitedRacks[0].dimensions ? 
                           limitedRacks[0].dimensions[1] : 1.0;
    const defaultHeight = limitedRacks.length > 0 && limitedRacks[0].dimensions ? 
                           limitedRacks[0].dimensions[2] || 2.0 : 2.0; // Default height if not specified
    
    const sharedGeometry = new THREE.BoxGeometry(defaultWidth, defaultHeight, defaultLength);
    
    // Create new racks
    limitedRacks.forEach((data, index) => {
        // Check if this rack has custom dimensions
        const hasCustomDimensions = data.dimensions && 
             (data.dimensions[0] !== defaultWidth || 
              data.dimensions[1] !== defaultLength || 
              data.dimensions[2] !== defaultHeight);
        
        let rack;
        
        if (hasCustomDimensions) {
            // If custom dimensions, create a new geometry
            const width = data.dimensions[0];
            const length = data.dimensions[1];
            const height = data.dimensions[2] || 2.0; // Default height if not specified
            
            const geometry = new THREE.BoxGeometry(width, height, length);
            rack = new THREE.Mesh(geometry, materials.rack);
            
            // Position at center of rack with y at half height (bottom at y=0)
            rack.position.set(data.position[0], height / 2, data.position[1]);
        } else {
            // Use shared geometry for better performance
            rack = new THREE.Mesh(sharedGeometry, materials.rack);
            
            // Position at center of rack with y at half height (bottom at y=0)
            rack.position.set(data.position[0], defaultHeight / 2, data.position[1]);
        }
        
        rack.castShadow = true;
        rack.receiveShadow = index < 10; // Only the first 10 racks receive shadows
        rack.name = `rack_${index}`;
        
        warehouse.model.add(rack);
        warehouse.racks.push(rack);
    });
}

/**
 * Update items in the warehouse
 * @param {Array} itemData - New item data
 */
function updateItems(itemData) {
    // Remove old items
    warehouse.items.forEach(item => {
        warehouse.model.remove(item);
        if (item.geometry) item.geometry.dispose();
        if (item.material) item.material.dispose();
    });
    warehouse.items = [];
    
    // Limit the number of rendered items for performance (max 50)
    const limitedItems = itemData.slice(0, 50);
    
    // Create shared geometries for common item types
    const sharedGeoms = {
        box: {},
        cylinder: {},
        sphere: {}
    };
    
    // Create new items
    limitedItems.forEach((data, index) => {
        // If item has dimensions use them, otherwise use defaults
        const width = data.dimensions ? data.dimensions[0] : 0.3;
        const height = data.dimensions ? data.dimensions[2] : 0.3;
        const length = data.dimensions ? data.dimensions[1] : 0.3;
        
        let geometry;
        let material = materials.item.clone(); // Clone the material to customize it
        
        // Adjust color based on item type
        if (data.type && data.type.includes('type_')) {
            // Extract type number and use it to generate a color
            const typeNum = parseInt(data.type.replace('type_', '')) || 1;
            const hue = (typeNum * 30) % 360; // Different hue for each type
            material.color.setHSL(hue / 360, 0.7, 0.5);
        }
        
        // Choose geometry based on item ID to add variety with shared geometries for better performance
        const geometryType = data.id % 3;
        
        if (geometryType === 0) {
            // Box geometry
            const key = `${width}_${height}_${length}`;
            if (!sharedGeoms.box[key]) {
                sharedGeoms.box[key] = new THREE.BoxGeometry(width, height, length);
            }
            geometry = sharedGeoms.box[key];
        } else if (geometryType === 1) {
            // Cylinder geometry with reduced segments
            const key = `${width}_${height}`;
            if (!sharedGeoms.cylinder[key]) {
                sharedGeoms.cylinder[key] = new THREE.CylinderGeometry(width / 2, width / 2, height, 6); // Reduced segments
            }
            geometry = sharedGeoms.cylinder[key];
        } else {
            // Sphere geometry with reduced segments
            const radius = Math.min(width, length, height) / 2;
            const key = `${radius}`;
            if (!sharedGeoms.sphere[key]) {
                sharedGeoms.sphere[key] = new THREE.SphereGeometry(radius, 8, 8); // Reduced segments
            }
            geometry = sharedGeoms.sphere[key];
        }
        
        const item = new THREE.Mesh(geometry, material);
        
        // Position item with y at half height (bottom at y=0)
        item.position.set(data.position[0], height / 2, data.position[1]);
        
        // Only items close to the camera cast shadows for better performance
        item.castShadow = index < 10; // Only the first 10 items cast shadows
        item.receiveShadow = false; // Items don't receive shadows for better performance
        item.name = `item_${data.id}`;
        
        warehouse.model.add(item);
        warehouse.items.push(item);
    });
    
    // Update loading progress
    if (typeof updateLoadingProgress === 'function') {
        updateLoadingProgress('warehouseLoaded', 'Warehouse components loaded');
    }
}

/**
 * Update charging stations in the warehouse
 * @param {Array} stationData - New charging station data
 */
function updateChargingStations(stationData) {
    // Remove old charging stations
    warehouse.chargingStations.forEach(station => {
        warehouse.model.remove(station);
        // Dispose of geometries and materials
        station.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    });
    warehouse.chargingStations = [];
    
    // Create new charging stations - limit to max 5 for performance
    const limitedStations = stationData.slice(0, 5);
    
    limitedStations.forEach((data, index) => {
        // Create a charging station model with simplified geometry
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.1, 8); // Reduced from 16
        const baseStation = new THREE.Mesh(baseGeometry, materials.chargingStation);
        
        const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6); // Reduced from 16
        const pillar = new THREE.Mesh(pillarGeometry, materials.chargingStation);
        pillar.position.y = 0.45; // Half its height above the base
        
        const connectorGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
        const connector = new THREE.Mesh(connectorGeometry, materials.chargingStation);
        connector.position.y = 0.75; // Position at top of pillar
        
        // Create a group to hold the parts
        const station = new THREE.Group();
        station.add(baseStation);
        station.add(pillar);
        station.add(connector);
        
        // Use emissive material instead of a point light for better performance
        const chargingStationMaterialGlow = materials.chargingStation.clone();
        chargingStationMaterialGlow.emissive.set(0x10b981);
        chargingStationMaterialGlow.emissiveIntensity = 0.5;
        connector.material = chargingStationMaterialGlow;
        
        // Position station
        station.position.set(data.position[0], 0, data.position[1]);
        station.name = `charging_station_${index}`;
        
        warehouse.model.add(station);
        warehouse.chargingStations.push(station);
    });
}

/**
 * Apply frustum culling to warehouse objects
 * @param {THREE.Camera} camera - The camera to use for culling
 */
function applyFrustumCulling(camera) {
    if (!camera || !warehouse.model) return;
    
    // Create frustum from camera
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();
    
    // Calculate the frustum
    camera.updateMatrixWorld(); // Make sure the camera matrix is up to date
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
    
    // Cache camera position for distance checks
    const cameraPosition = camera.position;
    
    // Define distance thresholds for LOD
    const NEAR_DISTANCE = 20;
    const MID_DISTANCE = 40;
    
    // Check all warehouse objects
    // Racks
    warehouse.racks.forEach(rack => {
        // First check if the rack is in the frustum
        const distance = cameraPosition.distanceTo(rack.position);
        
        // Basic frustum culling - if not in view, hide
        if (!frustum.intersectsObject(rack)) {
            rack.visible = false;
            return;
        }
        
        rack.visible = true;
        
        // Apply level of detail based on distance
        if (distance > MID_DISTANCE) {
            // Far - simplify rendering
            rack.castShadow = false;
            rack.receiveShadow = false;
        } else if (distance > NEAR_DISTANCE) {
            // Medium - cast shadows but keep them simple
            rack.castShadow = true;
            rack.receiveShadow = true;
        } else {
            // Near - full detail
            rack.castShadow = true;
            rack.receiveShadow = true;
        }
    });
    
    // Obstacles
    warehouse.obstacles.forEach(obstacle => {
        // Check if the obstacle is in the frustum
        const distance = cameraPosition.distanceTo(obstacle.position);
        
        // Basic frustum culling - if not in view, hide
        if (!frustum.intersectsObject(obstacle)) {
            obstacle.visible = false;
            return;
        }
        
        obstacle.visible = true;
        
        // Apply level of detail based on distance
        if (distance > MID_DISTANCE) {
            // Far - simplify rendering
            obstacle.castShadow = false;
            obstacle.receiveShadow = false;
        } else if (distance > NEAR_DISTANCE) {
            // Medium - limited shadows
            obstacle.castShadow = distance < 30; // Only cast shadows if relatively close
            obstacle.receiveShadow = true;
        } else {
            // Near - full detail
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
        }
    });
    
    // Items
    warehouse.items.forEach(item => {
        // Check if the item is in the frustum
        const distance = cameraPosition.distanceTo(item.position);
        
        // Basic frustum culling - if not in view, hide
        if (!frustum.intersectsObject(item)) {
            item.visible = false;
            return;
        }
        
        item.visible = true;
        
        // Apply level of detail based on distance
        if (distance > MID_DISTANCE) {
            // Far - simplify rendering
            item.castShadow = false;
            item.receiveShadow = false;
        } else if (distance > NEAR_DISTANCE) {
            // Medium - limited shadows
            item.castShadow = false; // Small items don't cast shadows at medium distance
            item.receiveShadow = true;
        } else {
            // Near - full detail
            item.castShadow = distance < 15; // Only cast shadows if very close
            item.receiveShadow = true;
        }
    });
}
