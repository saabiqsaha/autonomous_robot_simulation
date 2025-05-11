#!/usr/bin/env python3
"""
Test script to run the simulation with 3D visualization.
"""

import subprocess
import time
import sys
import os
import webbrowser

def print_header(message):
    """Print a header message."""
    print("\n" + "=" * 80)
    print(f" {message} ".center(80, "="))
    print("=" * 80 + "\n")

def main():
    """Run a test of the robot simulation with 3D visualization."""
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Print welcome message
    print_header("Warehouse Robot Simulation Test")
    print("This script will run the robot simulation with 3D visualization.")
    print("The simulation will run for 5 minutes by default.")
    print("You can view the 3D visualization in your web browser.")
    
    # Define the port for the web server
    port = 5000
    
    # Define the command to run
    cmd = [
        sys.executable,
        os.path.join(script_dir, "run_simulation.py"),
        "--web",
        f"--web-port={port}",
        "--duration=300"  # 5 minutes
    ]
    
    print("\nStarting simulation...")
    print(f"Command: {' '.join(cmd)}")
    
    # Start the simulation process
    process = subprocess.Popen(cmd)
    
    # Wait for the web server to start
    print("\nWaiting for web server to start...")
    time.sleep(2)
    
    # Open the web browser
    url = f"http://localhost:{port}"
    print(f"Opening web browser at: {url}")
    webbrowser.open(url)
    
    print("\nSimulation is running. Press Ctrl+C to stop.")
    
    try:
        # Wait for the process to complete
        process.wait()
        print("\nSimulation completed.")
    except KeyboardInterrupt:
        print("\nStopping simulation...")
        process.terminate()
        process.wait()
        print("Simulation stopped.")
    
    print_header("Test Completed")

if __name__ == "__main__":
    main()
