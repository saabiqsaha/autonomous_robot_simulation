"""
Gripper module for robot manipulation.
"""

import time
import numpy as np

class Gripper:
    """
    Gripper class for robot manipulation tasks.
    """
    
    def __init__(self, robot_config):
        """
        Initialize the gripper.
        
        Args:
            robot_config (RobotConfig): Robot configuration
        """
        self.config = robot_config
        self.max_capacity = robot_config.get("gripper_capacity")
        self.open_close_time = robot_config.get("gripper_open_close_time")
        
        self.status = "open"  # open, closed, moving
        self.holding = None  # Currently held item
        
    def grasp(self, item):
        """
        Grasp an item.
        
        Args:
            item: Item to grasp
            
        Returns:
            bool: Success status
        """
        if self.status != "open":
            return False
        
        self.status = "moving"
        
        # Check if item is within weight limits
        if item.weight > self.max_capacity:
            self.status = "open"
            return False
            
        # Simulate gripper closing time
        # In a real simulation, this would take time
        # time.sleep(self.open_close_time)
        
        self.status = "closed"
        self.holding = item
        return True
        
    def release(self, location):
        """
        Release the currently held item.
        
        Args:
            location: Location to place the item
            
        Returns:
            bool: Success status
        """
        if self.status != "closed" or self.holding is None:
            return False
            
        self.status = "moving"
        
        # Simulate gripper opening time
        # In a real simulation, this would take time
        # time.sleep(self.open_close_time)
        
        # Place the item at the location
        self.holding.position = location
        
        self.status = "open"
        self.holding = None
        return True
        
    def get_status(self):
        """
        Get the current status of the gripper.
        
        Returns:
            dict: Status information
        """
        return {
            "status": self.status,
            "holding": self.holding,
            "capacity": self.max_capacity,
        }
        
    def __str__(self):
        """String representation of the gripper."""
        return f"Gripper: {self.status}, holding: {self.holding}"
