"""
Warehouse configuration module.
"""

import os
import yaml
import numpy as np

class WarehouseConfig:
    """Configuration for the warehouse environment."""
    
    def __init__(self, config_name="default"):
        """
        Initialize the warehouse configuration.
        
        Args:
            config_name (str): Name of the configuration to load
        """
        self.config_name = config_name
        self.config_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "config",
            f"{config_name}_warehouse.yaml"
        )
        
        # Default configuration
        self.defaults = {
            "width": 20.0,  # meters
            "length": 30.0,  # meters
            "num_racks": 10,
            "rack_length": 5.0,  # meters
            "rack_width": 1.0,  # meters
            "aisle_width": 2.0,  # meters
            "num_items": 100,
            "item_types": 10,
            "obstacle_density": 0.05,  # percentage of free space with obstacles
            "charging_stations": 2,
            "robot_start_position": [1.0, 1.0],  # x, y in meters
            "task_generation_rate": 0.1,  # tasks per second
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
    
    def generate_layout(self):
        """Generate a warehouse layout based on the configuration."""
        width = self.get("width")
        length = self.get("length")
        num_racks = self.get("num_racks")
        rack_length = self.get("rack_length")
        rack_width = self.get("rack_width")
        aisle_width = self.get("aisle_width")
        
        # Initialize empty layout
        layout = np.zeros((int(length * 10), int(width * 10)))  # 10 cm resolution
        
        # Place racks
        racks_per_row = num_racks // 2
        for i in range(racks_per_row):
            x_start = int((width / 2 - (racks_per_row * (rack_width + aisle_width)) / 2 + 
                       i * (rack_width + aisle_width)) * 10)
            
            # Top row rack
            y_start_top = int(length / 3 * 10)
            layout[y_start_top:y_start_top + int(rack_length * 10), 
                  x_start:x_start + int(rack_width * 10)] = 1
            
            # Bottom row rack
            y_start_bottom = int(2 * length / 3 * 10)
            layout[y_start_bottom:y_start_bottom + int(rack_length * 10), 
                  x_start:x_start + int(rack_width * 10)] = 1
        
        return layout
            
    def __str__(self):
        """String representation of the configuration."""
        return f"WarehouseConfig({self.config_name}): {self.config}"
