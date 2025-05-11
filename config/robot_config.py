"""
Robot configuration module.
"""

import os
import yaml

class RobotConfig:
    """Configuration for the robot properties and capabilities."""
    
    def __init__(self, config_name="default"):
        """
        Initialize the robot configuration.
        
        Args:
            config_name (str): Name of the configuration to load
        """
        self.config_name = config_name
        self.config_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "config",
            f"{config_name}_robot.yaml"
        )
        
        # Default configuration
        self.defaults = {
            "max_speed": 1.5,  # meters per second
            "max_acceleration": 0.5,  # meters per second squared
            "battery_capacity": 10000,  # mAh
            "battery_discharge_rate": 100,  # mAh per second at full speed
            "sensor_range": 5.0,  # meters
            "gripper_capacity": 5.0,  # kg
            "gripper_open_close_time": 1.0,  # seconds
            "width": 0.5,  # meters
            "length": 0.7,  # meters
            "height": 0.4,  # meters
            "camera_height": 0.3,  # meters from ground
            "camera_fov": 60,  # degrees
        }
        
        self.config = self.load_config()
        
    def load_config(self):
        """Load configuration from file or use defaults."""
        if os.path.exists(self.config_path):
            with open(self.config_path, 'r') as file:
                return {**self.defaults, **yaml.safe_load(file)}
        else:
            print(f"Warning: Configuration file {self.config_path} not found. Using defaults.")
            # Create default config file for future use
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w') as file:
                yaml.dump(self.defaults, file, default_flow_style=False)
            return self.defaults
            
    def get(self, key, default=None):
        """Get a configuration value."""
        return self.config.get(key, default)
        
    def set(self, key, value):
        """Set a configuration value."""
        self.config[key] = value
        
    def save(self):
        """Save the current configuration to file."""
        with open(self.config_path, 'w') as file:
            yaml.dump(self.config, file, default_flow_style=False)
            
    def __str__(self):
        """String representation of the configuration."""
        return f"RobotConfig({self.config_name}): {self.config}"
