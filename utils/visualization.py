"""
Visualization module for the simulation.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Arrow

class Visualizer:
    """
    Visualizer for the robot simulation.
    """
    
    def __init__(self, warehouse, robot, figsize=(10, 8)):
        """
        Initialize the visualizer.
        
        Args:
            warehouse: Warehouse environment
            robot: Robot object
            figsize (tuple): Figure size (width, height) in inches
        """
        self.warehouse = warehouse
        self.robot = robot
        self.figsize = figsize
        
        # Initialize the plot
        plt.ion()  # Turn on interactive mode
        self.fig, self.ax = plt.subplots(figsize=self.figsize)
        self.fig.canvas.manager.set_window_title('Robot Simulation')
        
        # Elements to be updated
        self.robot_patch = None
        self.robot_direction = None
        self.path_line = None
        self.task_markers = []
        
        # Initial plot
        self._setup_plot()
        
    def _setup_plot(self):
        """Set up the initial plot."""
        # Set axis limits
        self.ax.set_xlim(0, self.warehouse.width)
        self.ax.set_ylim(0, self.warehouse.length)
        self.ax.set_aspect('equal')
        
        # Set title and labels
        self.ax.set_title('Warehouse Robot Simulation')
        self.ax.set_xlabel('X (meters)')
        self.ax.set_ylabel('Y (meters)')
        
        # Draw warehouse elements (racks, obstacles, etc.)
        self._draw_warehouse()
        
        # Draw robot
        self._draw_robot()
        
        plt.tight_layout()
        plt.draw()
        plt.pause(0.001)  # Small pause to update the plot
        
    def _draw_warehouse(self):
        """Draw the warehouse elements."""
        # Draw racks
        for rack_pos in self.warehouse.racks:
            rack_width = self.warehouse.config.get("rack_width")
            rack_length = self.warehouse.config.get("rack_length")
            
            rack = Rectangle(
                (rack_pos[0] - rack_width/2, rack_pos[1] - rack_length/2),
                rack_width, rack_length,
                linewidth=1, edgecolor='brown', facecolor='chocolate', alpha=0.7
            )
            self.ax.add_patch(rack)
            
        # Draw obstacles
        for obstacle in self.warehouse.obstacles:
            pos = obstacle.position
            width, length = obstacle.dimensions[0], obstacle.dimensions[1]
            
            obs = Rectangle(
                (pos[0] - width/2, pos[1] - length/2),
                width, length,
                linewidth=1, edgecolor='black', facecolor='gray', alpha=0.7
            )
            self.ax.add_patch(obs)
            
        # Draw items
        for item in self.warehouse.items:
            pos = item.position
            item_circle = Circle(
                pos, 0.2,
                linewidth=1, edgecolor='blue', facecolor='skyblue', alpha=0.7
            )
            self.ax.add_patch(item_circle)
            
        # Draw charging stations
        for station_pos in self.warehouse.charging_stations:
            station = Rectangle(
                (station_pos[0] - 0.5, station_pos[1] - 0.5),
                1.0, 1.0,
                linewidth=1, edgecolor='green', facecolor='lightgreen', alpha=0.7
            )
            self.ax.add_patch(station)
            
    def _draw_robot(self):
        """Draw the robot."""
        # Robot dimensions
        robot_width = self.robot.config.get("width")
        robot_length = self.robot.config.get("length")
        
        # Create robot patch
        pos = self.robot.position
        orientation = self.robot.orientation
        
        # Calculate corner positions based on orientation
        cos_theta = np.cos(orientation)
        sin_theta = np.sin(orientation)
        
        # Robot rectangle centered at robot position
        robot_rect = Rectangle(
            (pos[0] - robot_width/2, pos[1] - robot_length/2),
            robot_width, robot_length,
            angle=np.degrees(orientation),
            linewidth=2, edgecolor='red', facecolor='salmon', alpha=0.9
        )
        
        # Draw direction indicator (arrow)
        arrow_length = max(robot_width, robot_length) * 0.8
        arrow_x = pos[0] + arrow_length/2 * cos_theta
        arrow_y = pos[1] + arrow_length/2 * sin_theta
        
        direction_arrow = Arrow(
            pos[0], pos[1], 
            arrow_length * cos_theta, arrow_length * sin_theta,
            width=0.2, color='black'
        )
        
        # Add to plot
        if self.robot_patch is not None:
            self.robot_patch.remove()
        self.robot_patch = self.ax.add_patch(robot_rect)
        
        if self.robot_direction is not None:
            self.robot_direction.remove()
        self.robot_direction = self.ax.add_patch(direction_arrow)
        
        # Draw robot path if available
        if self.robot.path:
            path_x = [pos[0]] + [p[0] for p in self.robot.path]
            path_y = [pos[1]] + [p[1] for p in self.robot.path]
            
            if self.path_line is not None:
                self.path_line.remove()
            self.path_line = self.ax.plot(path_x, path_y, 'g--', linewidth=1)[0]
        elif self.path_line is not None:
            self.path_line.remove()
            self.path_line = None
            
    def _draw_tasks(self):
        """Draw task markers."""
        # Clear old task markers
        for marker in self.task_markers:
            marker.remove()
        self.task_markers = []
        
        # Draw new task markers
        for task in self.warehouse.tasks:
            pos = task.get_position()
            task_type = task.get_type()
            
            if task_type == "pick":
                marker = Circle(
                    pos, 0.3,
                    linewidth=2, edgecolor='magenta', facecolor='none', alpha=0.9
                )
            elif task_type == "place":
                marker = Rectangle(
                    (pos[0] - 0.3, pos[1] - 0.3),
                    0.6, 0.6,
                    linewidth=2, edgecolor='cyan', facecolor='none', alpha=0.9
                )
            else:  # charge
                marker = Circle(
                    pos, 0.3,
                    linewidth=2, edgecolor='yellow', facecolor='none', alpha=0.9
                )
                
            self.task_markers.append(self.ax.add_patch(marker))
            
    def update(self):
        """Update the visualization."""
        # Update robot position and orientation
        self._draw_robot()
        
        # Update task markers
        self._draw_tasks()
        
        # Update plot
        self.fig.canvas.draw_idle()
        plt.pause(0.001)  # Small pause to update the plot
        
    def show(self):
        """Show the plot (blocking)."""
        plt.ioff()
        plt.show()
        
    def save(self, filename):
        """Save the current visualization to a file."""
        plt.savefig(filename, dpi=100, bbox_inches='tight')
        
    def create_animation(self, frames, filename, fps=10):
        """
        Create an animation from a series of frames.
        
        Args:
            frames (list): List of (robot_pos, robot_orientation, path) tuples
            filename (str): Output filename
            fps (int): Frames per second
        """
        try:
            import matplotlib.animation as animation
            
            def update_frame(frame_idx):
                if frame_idx < len(frames):
                    pos, orientation, path = frames[frame_idx]
                    self.robot.position = pos
                    self.robot.orientation = orientation
                    self.robot.path = path
                    
                self._draw_robot()
                self._draw_tasks()
                
                return [self.robot_patch, self.robot_direction]
                
            ani = animation.FuncAnimation(
                self.fig, update_frame, frames=len(frames) + 1,
                interval=1000/fps, blit=True
            )
            
            ani.save(filename, writer='pillow', fps=fps)
            print(f"Animation saved to {filename}")
            
        except ImportError:
            print("Animation requires matplotlib animation support")
            
    def __str__(self):
        """String representation of the visualizer."""
        return f"Visualizer(warehouse={self.warehouse}, robot={self.robot})"
