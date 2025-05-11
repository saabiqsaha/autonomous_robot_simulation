"""
Robot module for autonomous robot simulation.
"""

import time
import math
import numpy as np
from robot.gripper import Gripper

class Robot:
    """
    Robot class representing an autonomous robot in a warehouse environment.
    """
    
    def __init__(self, config, start_position):
        """
        Initialize the robot.
        
        Args:
            config (RobotConfig): Robot configuration
            start_position (tuple): Initial position (x, y) in meters
        """
        self.config = config
        self.position = np.array(start_position, dtype=float)
        self.orientation = 0.0  # radians, 0 is east, pi/2 is north
        self.velocity = np.array([0.0, 0.0])
        self.gripper = Gripper(config)
        
        # Robot state
        self.battery_level = config.get("battery_capacity")
        self.load = None  # Currently held item
        self.status = "idle"  # idle, moving, picking, placing, charging
        self.path = []  # Current path being followed
        
        # Sensors
        self.detected_objects = []
        self.detected_obstacles = []
        
        # Metrics
        self.distance_traveled = 0.0
        self.energy_consumed = 0.0
        self.tasks_completed = 0
        self.collisions = 0
        self.start_time = time.time()
        
    def move(self, target_position, avoid_obstacles=True):
        """
        Move the robot to a target position.
        
        Args:
            target_position (tuple): Target position (x, y) in meters
            avoid_obstacles (bool): Whether to avoid obstacles during movement
            
        Returns:
            bool: Success status
        """
        target = np.array(target_position, dtype=float)
        direction = target - self.position
        distance = np.linalg.norm(direction)
        
        if distance < 0.01:  # Already at target
            return True
            
        # Normalize direction and calculate movement
        direction = direction / distance
        max_speed = self.config.get("max_speed")
        speed = min(max_speed, distance)  # Slow down when approaching target
        
        # Check for obstacles if needed
        if avoid_obstacles and self._obstacle_in_path(direction, distance):
            self.status = "blocked"
            return False
            
        # Update position and metrics
        movement = direction * speed
        self.position += movement
        self.orientation = math.atan2(direction[1], direction[0])
        self.velocity = movement
        
        # Update robot metrics
        movement_distance = np.linalg.norm(movement)
        self.distance_traveled += movement_distance
        
        # Calculate energy consumption
        energy_rate = self.config.get("battery_discharge_rate") * (speed / max_speed)
        self.energy_consumed += energy_rate
        self.battery_level -= energy_rate
        
        self.status = "moving"
        return distance < 0.1  # Return True if we're close enough to target
        
    def follow_path(self, path):
        """
        Follow a path of waypoints.
        
        Args:
            path (list): List of (x, y) waypoints
            
        Returns:
            bool: Success status
        """
        self.path = path
        
        for waypoint in path:
            success = False
            attempts = 0
            
            while not success and attempts < 10:
                success = self.move(waypoint)
                if not success:
                    # Try to find alternative path if blocked
                    # This is a simplified version; in reality, this would involve
                    # more complex path replanning
                    attempts += 1
                    offset = np.random.normal(0, 0.5, 2)  # Random offset to try to get around obstacle
                    success = self.move(self.position + offset, avoid_obstacles=False)
                
            if not success:
                return False
                
        self.path = []
        return True
        
    def pick(self, item):
        """
        Pick up an item.
        
        Args:
            item: Item to pick up
            
        Returns:
            bool: Success status
        """
        if self.load is not None:
            return False  # Already holding something
            
        self.status = "picking"
        success = self.gripper.grasp(item)
        
        if success:
            self.load = item
            
        return success
        
    def place(self, location):
        """
        Place the currently held item.
        
        Args:
            location: Location to place the item
            
        Returns:
            bool: Success status
        """
        if self.load is None:
            return False  # Not holding anything
            
        self.status = "placing"
        success = self.gripper.release(location)
        
        if success:
            self.load = None
            
        return success
        
    def execute_task(self, task):
        """
        Execute a task.
        
        Args:
            task: Task to execute
            
        Returns:
            bool: Success status
        """
        task_type = task.get_type()
        
        if task_type == "pick":
            return self.pick(task.get_item())
        elif task_type == "place":
            return self.place(task.get_location())
        elif task_type == "charge":
            return self.charge()
        else:
            return False
            
    def charge(self):
        """
        Charge the robot's battery.
        
        Returns:
            bool: Success status
        """
        self.status = "charging"
        charge_rate = 500  # mAh per second
        
        # In a real simulation, this would happen over time
        # For now, we'll just instantly charge to full
        self.battery_level = self.config.get("battery_capacity")
        
        return True
        
    def scan_environment(self, environment):
        """
        Scan the environment for objects and obstacles.
        
        Args:
            environment: Environment object
            
        Returns:
            tuple: (detected_objects, detected_obstacles)
        """
        sensor_range = self.config.get("sensor_range")
        
        # Get objects and obstacles within range
        self.detected_objects = environment.get_objects_in_range(self.position, sensor_range)
        self.detected_obstacles = environment.get_obstacles_in_range(self.position, sensor_range)
        
        return (self.detected_objects, self.detected_obstacles)
        
    def _obstacle_in_path(self, direction, distance):
        """
        Check if there's an obstacle in the path.
        
        Args:
            direction (numpy.array): Direction vector
            distance (float): Distance to check
            
        Returns:
            bool: True if obstacle detected
        """
        # In a real simulation, this would check the detected obstacles
        # For now, we'll just return False (no obstacles)
        return False
        
    def get_metrics(self):
        """Get robot performance metrics."""
        running_time = time.time() - self.start_time
        
        return {
            "distance_traveled": self.distance_traveled,
            "energy_consumed": self.energy_consumed,
            "tasks_completed": self.tasks_completed,
            "collisions": self.collisions,
            "battery_level": self.battery_level,
            "battery_percentage": (self.battery_level / self.config.get("battery_capacity")) * 100,
            "average_speed": self.distance_traveled / running_time if running_time > 0 else 0,
            "efficiency": self.tasks_completed / self.energy_consumed if self.energy_consumed > 0 else 0,
        }
        
    def __str__(self):
        """String representation of the robot."""
        return f"Robot at position {self.position}, orientation {math.degrees(self.orientation)}°, status: {self.status}"
