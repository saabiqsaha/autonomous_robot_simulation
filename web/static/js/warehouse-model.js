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
    });
    warehouse.obstacles = [];
    
    // Create new obstacles
    obstacleData.forEach((data, index) => {
        const width = data.dimensions[0];
        const length = data.dimensions[1];
        const height = data.dimensions[2];
        
        const geometry = new THREE.BoxGeometry(width, height, length);
        const obstacle = new THREE.Mesh(geometry, materials.obstacle);
        
        // Position at center of obstacle with y at half height (bottom at y=0)
        obstacle.position.set(data.position[0], height / 2, data.position[1]);
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
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
    });
    warehouse.racks = [];
    
    // Create new racks
    rackData.forEach((data, index) => {
        const width = data.dimensions[0];
        const length = data.dimensions[1];
        const height = data.dimensions[2] || 2.0; // Default height if not specified
        
        const geometry = new THREE.BoxGeometry(width, height, length);
        const rack = new THREE.Mesh(geometry, materials.rack);
        
        // Position at center of rack with y at half height (bottom at y=0)
        rack.position.set(data.position[0], height / 2, data.position[1]);
        rack.castShadow = true;
        rack.receiveShadow = true;
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
    });
    warehouse.items = [];
    
    // Create new items
    itemData.forEach((data, index) => {
        // If item has dimensions use them, otherwise use defaults
        const width = data.dimensions ? data.dimensions[0] : 0.3;
        const height = data.dimensions ? data.dimensions[2] : 0.3;
        const length = data.dimensions ? data.dimensions[1] : 0.3;
        
        // Different geometries based on item type to add visual variety
        let geometry;
        let material = materials.item.clone(); // Clone the material to customize it
        
        // Adjust color based on item type
        if (data.type && data.type.includes('type_')) {
            // Extract type number and use it to generate a color
            const typeNum = parseInt(data.type.replace('type_', '')) || 1;
            const hue = (typeNum * 30) % 360; // Different hue for each type
            material.color.setHSL(hue / 360, 0.7, 0.5);
        }
        
        // Choose geometry based on item ID to add variety
        if (data.id % 3 === 0) {
            geometry = new THREE.BoxGeometry(width, height, length);
        } else if (data.id % 3 === 1) {
            geometry = new THREE.CylinderGeometry(width / 2, width / 2, height, 8);
        } else {
            geometry = new THREE.SphereGeometry(Math.min(width, length, height) / 2, 16, 16);
        }
        
        const item = new THREE.Mesh(geometry, material);
        
        // Position item with y at half height (bottom at y=0)
        item.position.set(data.position[0], height / 2, data.position[1]);
        item.castShadow = true;
        item.receiveShadow = true;
        item.name = `item_${data.id}`;
        
        warehouse.model.add(item);
        warehouse.items.push(item);
    });
}

/**
 * Update charging stations in the warehouse
 * @param {Array} stationData - New charging station data
 */
function updateChargingStations(stationData) {
    // Remove old charging stations
    warehouse.chargingStations.forEach(station => {
        warehouse.model.remove(station);
    });
    warehouse.chargingStations = [];
    
    // Create new charging stations
    stationData.forEach((data, index) => {
        // Create a charging station model
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.1, 16);
        const baseStation = new THREE.Mesh(baseGeometry, materials.chargingStation);
        
        const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16);
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
        
        // Add a point light to make it glow slightly
        const light = new THREE.PointLight(0x10b981, 0.5, 3);
        light.position.y = 0.5;
        station.add(light);
        
        // Position station
        station.position.set(data.position[0], 0, data.position[1]);
        station.name = `charging_station_${index}`;
        
        warehouse.model.add(station);
        warehouse.chargingStations.push(station);
    });
}
