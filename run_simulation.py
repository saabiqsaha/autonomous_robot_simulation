#!/usr/bin/env python3
"""
Main simulation runner for the autonomous robot simulation.
"""

import sys
import os
import time
import argparse

# Add the project directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.robot_config import RobotConfig
from config.warehouse_config import WarehouseConfig
from robot.robot import Robot
from environment.warehouse import Warehouse
from vision.object_detection import ObjectDetector
from planning.path_planner import PathPlanner
from planning.task_scheduler import TaskScheduler
from dashboard.dashboard import Dashboard
from utils.visualization import Visualizer

def parse_args():
    parser = argparse.ArgumentParser(description="Autonomous Robot Simulation")
    parser.add_argument("--config", type=str, default="default", help="Configuration name")
    parser.add_argument("--headless", action="store_true", help="Run without visualization")
    parser.add_argument("--duration", type=int, default=300, help="Simulation duration in seconds")
    return parser.parse_args()

def main():
    args = parse_args()
    
    try:
        print("Loading configurations...")
        # Load configurations
        robot_config = RobotConfig(args.config)
        warehouse_config = WarehouseConfig(args.config)
        
        print("Initializing warehouse environment...")
        # Initialize components
        warehouse = Warehouse(warehouse_config)
        print(f"Warehouse initialized with {len(warehouse.obstacles)} obstacles, {len(warehouse.items)} items, {len(warehouse.racks)} racks")
        
        print("Initializing robot...")
        robot = Robot(robot_config, warehouse.get_start_position())
        
        print("Initializing other components...")
        detector = ObjectDetector()
        path_planner = PathPlanner(warehouse.get_map())
        scheduler = TaskScheduler(warehouse.get_tasks())
        dashboard = Dashboard()
        
        try:
            visualizer = None if args.headless else Visualizer(warehouse, robot)
        except Exception as vis_err:
            print(f"Warning: Could not initialize visualizer: {vis_err}")
            visualizer = None
            
        print(f"Starting simulation with config: {args.config}")
        
        # Main simulation loop
        start_time = time.time()
        sim_time = 0
        
        try:
            while sim_time < args.duration:
                # Get current task
                current_task = scheduler.get_next_task()
                
                if current_task:
                    print(f"Executing task: {current_task}")
                    # Plan path to target
                    target_position = current_task.get_position()
                    path = path_planner.plan_path(robot.position, target_position)
                    
                    # Execute path
                    robot.follow_path(path)
                    
                    # Complete task
                    robot.execute_task(current_task)
                    scheduler.mark_completed(current_task)
                
                # Update dashboard
                dashboard.update(robot, warehouse, scheduler)
                
                # Visualize if needed
                if visualizer:
                    try:
                        visualizer.update()
                    except Exception as vis_err:
                        print(f"Warning: Visualization error: {vis_err}")
                        visualizer = None
                
                # Update simulation time
                sim_time = time.time() - start_time
                time.sleep(0.1)  # Simulation step
        
        except KeyboardInterrupt:
            print("\nSimulation terminated by user")
        
        # Show final metrics
        dashboard.show_final_metrics()
        print(f"Simulation completed after {sim_time:.2f} seconds")
    
    except Exception as e:
        import traceback
        print(f"Error during simulation: {e}")
        traceback.print_exc()
    
    print(f"Starting simulation with config: {args.config}")
    
    # Main simulation loop
    start_time = time.time()
    sim_time = 0
    
    try:
        while sim_time < args.duration:
            # Get current task
            current_task = scheduler.get_next_task()
            
            if current_task:
                # Plan path to target
                target_position = current_task.get_position()
                path = path_planner.plan_path(robot.position, target_position)
                
                # Execute path
                robot.follow_path(path)
                
                # Complete task
                robot.execute_task(current_task)
                scheduler.mark_completed(current_task)
            
            # Update dashboard
            dashboard.update(robot, warehouse, scheduler)
            
            # Visualize if needed
            if visualizer:
                visualizer.update()
            
            # Update simulation time
            sim_time = time.time() - start_time
            time.sleep(0.1)  # Simulation step
    
    except KeyboardInterrupt:
        print("\nSimulation terminated by user")
    
    # Show final metrics
    dashboard.show_final_metrics()
    print(f"Simulation completed after {sim_time:.2f} seconds")

if __name__ == "__main__":
    main()
