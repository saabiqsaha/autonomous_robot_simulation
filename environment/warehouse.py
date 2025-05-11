"""
Warehouse environment module.
"""

import numpy as np
from environment.obstacle import Obstacle

class Task:
    """Class representing a warehouse task."""
    
    def __init__(self, task_type, position, item=None, location=None):
        """
        Initialize a task.
        
        Args:
            task_type (str): Type of task ('pick', 'place', 'charge')
            position (tuple): Position (x, y) of the task
            item: Item associated with the task
            location: Location associated with the task
        """
        self.task_type = task_type
        self.position = position
        self.item = item
        self.location = location
        self.priority = 1  # Default priority
        self.deadline = None  # Optional deadline
        self.completed = False
        
    def get_type(self):
        """Get the task type."""
        return self.task_type
        
    def get_position(self):
        """Get the task position."""
        return self.position
        
    def get_item(self):
        """Get the item associated with the task."""
        return self.item
        
    def get_location(self):
        """Get the location associated with the task."""
        return self.location
        
    def __str__(self):
        """String representation of the task."""
        return f"Task(type={self.task_type}, pos={self.position}, completed={self.completed})"


class Item:
    """Class representing an item in the warehouse."""
    
    def __init__(self, item_id, item_type, position, weight, dimensions):
        """
        Initialize an item.
        
        Args:
            item_id (int): Unique identifier
            item_type (str): Type of item
            position (tuple): Position (x, y) of the item
            weight (float): Weight in kg
            dimensions (tuple): Dimensions (length, width, height) in meters
        """
        self.item_id = item_id
        self.item_type = item_type
        self.position = position
        self.weight = weight
        self.dimensions = dimensions
        
    def __str__(self):
        """String representation of the item."""
        return f"Item(id={self.item_id}, type={self.item_type}, pos={self.position})"


class Warehouse:
    """
    Warehouse environment for robot simulation.
    """
    
    def __init__(self, config):
        """
        Initialize the warehouse.
        
        Args:
            config (WarehouseConfig): Warehouse configuration
        """
        self.config = config
        self.width = config.get("width")
        self.length = config.get("length")
        
        # Generate the warehouse layout
        self.layout = config.generate_layout()
        
        # Initialize warehouse components
        self.obstacles = self._generate_obstacles()
        self.items = self._generate_items()
        self.racks = self._generate_racks()
        self.charging_stations = self._generate_charging_stations()
        
        # Tasks
        self.tasks = []
        self.completed_tasks = []
        
        # Start position for the robot
        self.start_position = config.get("robot_start_position")
        
    def _generate_obstacles(self):
        """Generate obstacles in the warehouse."""
        obstacles = []
        obstacle_density = self.config.get("obstacle_density")
        
        # Calculate number of obstacles based on density and free space
        free_space = self.width * self.length - np.sum(self.layout) / 100  # Layout is in cm resolution
        num_obstacles = int(free_space * obstacle_density)
        
        for i in range(num_obstacles):
            # Try to place obstacle in a free space
            for _ in range(10):  # Try 10 times
                x = np.random.uniform(0, self.width)
                y = np.random.uniform(0, self.length)
                
                # Check if position is free
                if not self._is_position_occupied((x, y)):
                    # Random obstacle properties
                    width = np.random.uniform(0.3, 1.0)
                    length = np.random.uniform(0.3, 1.0)
                    height = np.random.uniform(0.5, 1.5)
                    
                    obstacle = Obstacle(i, (x, y), (width, length, height))
                    obstacles.append(obstacle)
                    break
                    
        return obstacles
        
    def _generate_items(self):
        """Generate items in the warehouse."""
        items = []
        num_items = self.config.get("num_items")
        item_types = self.config.get("item_types")
        
        for i in range(num_items):
            # Place items on racks
            rack_idx = np.random.randint(0, len(self.racks))
            rack_pos = self.racks[rack_idx]
            
            # Offset from rack position
            offset_x = np.random.uniform(-0.4, 0.4)
            offset_y = np.random.uniform(-2.0, 2.0)
            position = (rack_pos[0] + offset_x, rack_pos[1] + offset_y)
            
            # Item properties
            item_type = f"type_{np.random.randint(1, item_types + 1)}"
            weight = np.random.uniform(0.1, 4.0)  # kg
            dimensions = (
                np.random.uniform(0.1, 0.5),  # length
                np.random.uniform(0.1, 0.5),  # width
                np.random.uniform(0.1, 0.5)   # height
            )
            
            item = Item(i, item_type, position, weight, dimensions)
            items.append(item)
            
        return items
        
    def _generate_racks(self):
        """Generate rack positions based on the layout."""
        racks = []
        layout_height, layout_width = self.layout.shape
        
        # Scale factors to convert from layout coordinates to meters
        scale_y = self.length / layout_height
        scale_x = self.width / layout_width
        
        # Find rack positions from the layout
        rack_positions = np.where(self.layout == 1)
        
        # Group adjacent rack positions
        rack_centers = []
        for y, x in zip(rack_positions[0], rack_positions[1]):
            # Convert to meters
            x_m = x * scale_x
            y_m = y * scale_y
            
            # Check if this is close to an existing rack center
            new_center = True
            for center in rack_centers:
                dist = np.sqrt((center[0] - x_m)**2 + (center[1] - y_m)**2)
                if dist < 1.0:  # If within 1 meter, consider it part of the same rack
                    new_center = False
                    break
            
            if new_center:
                rack_centers.append((x_m, y_m))
        
        return rack_centers
        
    def _generate_charging_stations(self):
        """Generate charging station positions."""
        charging_stations = []
        num_stations = self.config.get("charging_stations")
        
        for i in range(num_stations):
            # Place charging stations at the edges of the warehouse
            if i % 4 == 0:
                # Top edge
                x = np.random.uniform(1, self.width - 1)
                y = 1
            elif i % 4 == 1:
                # Right edge
                x = self.width - 1
                y = np.random.uniform(1, self.length - 1)
            elif i % 4 == 2:
                # Bottom edge
                x = np.random.uniform(1, self.width - 1)
                y = self.length - 1
            else:
                # Left edge
                x = 1
                y = np.random.uniform(1, self.length - 1)
                
            charging_stations.append((x, y))
            
        return charging_stations
        
    def _is_position_occupied(self, position):
        """Check if a position is occupied by an obstacle or rack."""
        x, y = position
        
        # Check layout
        layout_x = int(x / self.width * self.layout.shape[1])
        layout_y = int(y / self.length * self.layout.shape[0])
        
        if 0 <= layout_x < self.layout.shape[1] and 0 <= layout_y < self.layout.shape[0]:
            if self.layout[layout_y, layout_x] == 1:
                return True
                
        # Check obstacles
        for obstacle in self.obstacles:
            if obstacle.is_point_inside(position):
                return True
                
        return False
        
    def get_objects_in_range(self, position, range_radius):
        """Get objects within range of a position."""
        in_range = []
        
        for item in self.items:
            dist = np.sqrt((item.position[0] - position[0])**2 + 
                          (item.position[1] - position[1])**2)
            if dist <= range_radius:
                in_range.append(item)
                
        return in_range
        
    def get_obstacles_in_range(self, position, range_radius):
        """Get obstacles within range of a position."""
        in_range = []
        
        for obstacle in self.obstacles:
            dist = np.sqrt((obstacle.position[0] - position[0])**2 + 
                          (obstacle.position[1] - position[1])**2)
            if dist <= range_radius:
                in_range.append(obstacle)
                
        return in_range
        
    def generate_task(self):
        """Generate a new task."""
        task_type = np.random.choice(["pick", "place", "charge"], p=[0.45, 0.45, 0.1])
        
        if task_type == "pick":
            # Pick a random item
            if not self.items:
                return None
                
            item_idx = np.random.randint(0, len(self.items))
            item = self.items[item_idx]
            position = item.position
            task = Task("pick", position, item=item)
            
        elif task_type == "place":
            # Place at a random rack
            if not self.racks:
                return None
                
            rack_idx = np.random.randint(0, len(self.racks))
            rack_pos = self.racks[rack_idx]
            
            # Offset from rack position
            offset_x = np.random.uniform(-0.4, 0.4)
            offset_y = np.random.uniform(-2.0, 2.0)
            position = (rack_pos[0] + offset_x, rack_pos[1] + offset_y)
            
            task = Task("place", position, location=position)
            
        else:  # charge
            # Go to a random charging station
            if not self.charging_stations:
                return None
                
            station_idx = np.random.randint(0, len(self.charging_stations))
            position = self.charging_stations[station_idx]
            task = Task("charge", position)
            
        self.tasks.append(task)
        return task
        
    def generate_tasks(self, num_tasks):
        """Generate multiple tasks."""
        new_tasks = []
        
        for _ in range(num_tasks):
            task = self.generate_task()
            if task:
                new_tasks.append(task)
                
        return new_tasks
        
    def get_tasks(self):
        """Get all active tasks."""
        return self.tasks
        
    def complete_task(self, task):
        """Mark a task as completed."""
        if task in self.tasks:
            task.completed = True
            self.tasks.remove(task)
            self.completed_tasks.append(task)
            return True
        return False
        
    def get_map(self):
        """Get the warehouse map."""
        return self.layout
        
    def get_start_position(self):
        """Get the robot start position."""
        return self.start_position
        
    def __str__(self):
        """String representation of the warehouse."""
        return f"Warehouse({self.width}x{self.length}m, {len(self.obstacles)} obstacles, {len(self.items)} items)"
