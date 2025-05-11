"""
Object detection module for the vision system.
"""

import numpy as np

class ObjectDetector:
    """
    Object detector class for identifying objects in the environment.
    """
    
    def __init__(self, detection_range=5.0, detection_probability=0.95):
        """
        Initialize the object detector.
        
        Args:
            detection_range (float): Maximum detection range in meters
            detection_probability (float): Probability of detecting an object in range
        """
        self.detection_range = detection_range
        self.detection_probability = detection_probability
        
    def detect_objects(self, robot_position, objects):
        """
        Detect objects in the environment from the robot's position.
        
        Args:
            robot_position (tuple): Robot's position (x, y)
            objects (list): List of objects in the environment
            
        Returns:
            list: Detected objects with their positions and metadata
        """
        detected = []
        
        for obj in objects:
            # Calculate distance to object
            dist = np.sqrt((obj.position[0] - robot_position[0])**2 + 
                           (obj.position[1] - robot_position[1])**2)
            
            # Check if within detection range
            if dist <= self.detection_range:
                # Apply detection probability
                if np.random.random() < self.detection_probability:
                    # Add some noise to the detected position
                    noise_factor = 0.05  # 5% noise
                    position_noise = np.random.normal(0, dist * noise_factor, 2)
                    detected_position = (
                        obj.position[0] + position_noise[0],
                        obj.position[1] + position_noise[1]
                    )
                    
                    # Create detection result
                    detection = {
                        "object": obj,
                        "position": detected_position,
                        "distance": dist,
                        "confidence": max(0, 1 - dist / self.detection_range)
                    }
                    
                    detected.append(detection)
        
        return detected
        
    def detect_obstacles(self, robot_position, obstacles):
        """
        Detect obstacles in the environment from the robot's position.
        
        Args:
            robot_position (tuple): Robot's position (x, y)
            obstacles (list): List of obstacles in the environment
            
        Returns:
            list: Detected obstacles with their positions and metadata
        """
        detected = []
        
        for obstacle in obstacles:
            # Calculate distance to obstacle center
            dist_center = np.sqrt((obstacle.position[0] - robot_position[0])**2 + 
                                  (obstacle.position[1] - robot_position[1])**2)
                                  
            # Get actual distance to obstacle surface
            dist = obstacle.get_distance(robot_position)
            
            # Check if within detection range
            if dist <= self.detection_range:
                # Apply detection probability (higher for closer obstacles)
                detection_prob = self.detection_probability * (1 - dist / self.detection_range)
                
                if np.random.random() < detection_prob:
                    # Add some noise to the detected position
                    noise_factor = 0.03  # 3% noise
                    position_noise = np.random.normal(0, dist * noise_factor, 2)
                    detected_position = (
                        obstacle.position[0] + position_noise[0],
                        obstacle.position[1] + position_noise[1]
                    )
                    
                    # Create detection result
                    detection = {
                        "obstacle": obstacle,
                        "position": detected_position,
                        "distance": dist,
                        "dimensions": obstacle.dimensions,
                        "confidence": max(0, 1 - dist / self.detection_range)
                    }
                    
                    detected.append(detection)
        
        return detected
        
    def create_occupancy_grid(self, robot_position, detected_obstacles, grid_size=(100, 100), cell_size=0.1):
        """
        Create an occupancy grid based on detected obstacles.
        
        Args:
            robot_position (tuple): Robot's position (x, y)
            detected_obstacles (list): List of detected obstacles
            grid_size (tuple): Size of the grid in cells
            cell_size (float): Size of each cell in meters
            
        Returns:
            numpy.array: Occupancy grid where 0 is free space and 1 is occupied
        """
        # Initialize empty grid
        grid = np.zeros(grid_size)
        
        # Calculate grid center in world coordinates
        grid_width_m = grid_size[1] * cell_size
        grid_height_m = grid_size[0] * cell_size
        
        grid_min_x = robot_position[0] - grid_width_m / 2
        grid_min_y = robot_position[1] - grid_height_m / 2
        
        # Mark detected obstacles in the grid
        for detection in detected_obstacles:
            obstacle = detection["obstacle"]
            
            # Convert obstacle bounds to grid coordinates
            min_x_cell = int((obstacle.x_min - grid_min_x) / cell_size)
            max_x_cell = int((obstacle.x_max - grid_min_x) / cell_size)
            min_y_cell = int((obstacle.y_min - grid_min_y) / cell_size)
            max_y_cell = int((obstacle.y_max - grid_min_y) / cell_size)
            
            # Ensure within grid bounds
            min_x_cell = max(0, min(grid_size[1] - 1, min_x_cell))
            max_x_cell = max(0, min(grid_size[1] - 1, max_x_cell))
            min_y_cell = max(0, min(grid_size[0] - 1, min_y_cell))
            max_y_cell = max(0, min(grid_size[0] - 1, max_y_cell))
            
            # Mark cells as occupied
            grid[min_y_cell:max_y_cell+1, min_x_cell:max_x_cell+1] = 1
            
        return grid
        
    def __str__(self):
        """String representation of the object detector."""
        return f"ObjectDetector(range={self.detection_range}m, prob={self.detection_probability})"
