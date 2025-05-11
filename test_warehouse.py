#!/usr/bin/env python3

import sys
import os

# Add the project directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.robot_config import RobotConfig
from config.warehouse_config import WarehouseConfig
from environment.warehouse import Warehouse

def main():
    try:
        print("Starting test...")
        
        # Load configurations
        config_name = "default"
        print(f"Loading configuration: {config_name}")
        warehouse_config = WarehouseConfig(config_name)
        
        # Initialize warehouse
        print("Initializing warehouse...")
        warehouse = Warehouse(warehouse_config)
        
        # Print warehouse info
        print(f"Warehouse initialized: {warehouse}")
        print(f"Racks: {len(warehouse.racks)}")
        print(f"Obstacles: {len(warehouse.obstacles)}")
        print(f"Items: {len(warehouse.items)}")
        
        print("Test completed successfully.")
        
    except Exception as e:
        import traceback
        print(f"Error during test: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
