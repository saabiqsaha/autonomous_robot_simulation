"""
Dashboard module for displaying simulation metrics.
"""

import time
import matplotlib.pyplot as plt
from dashboard.metrics import MetricsCollector

class Dashboard:
    """
    Dashboard for displaying simulation metrics.
    """
    
    def __init__(self, update_interval=1.0):
        """
        Initialize the dashboard.
        
        Args:
            update_interval (float): Interval between updates in seconds
        """
        self.update_interval = update_interval
        self.metrics = MetricsCollector()
        self.last_update_time = time.time()
        
        # Metrics history
        self.history = {
            "timestamps": [],
            "robot_metrics": [],
            "task_metrics": [],
            "environment_metrics": []
        }
        
        # Display settings
        self.show_graphs = False
        self.active_plots = []
        
    def update(self, robot, warehouse, scheduler):
        """
        Update the dashboard with current metrics.
        
        Args:
            robot: Robot object
            warehouse: Warehouse object
            scheduler: TaskScheduler object
        """
        current_time = time.time()
        
        # Check if it's time to update
        if current_time - self.last_update_time < self.update_interval:
            return
            
        self.last_update_time = current_time
        
        # Collect metrics
        robot_metrics = robot.get_metrics()
        scheduler_metrics = scheduler.get_statistics()
        
        # Environment metrics would typically be collected from the warehouse
        # For this example, we'll use a simple count of objects and obstacles
        environment_metrics = {
            "num_items": len(warehouse.items),
            "num_obstacles": len(warehouse.obstacles),
            "num_racks": len(warehouse.racks),
            "total_area": warehouse.width * warehouse.length,
        }
        
        # Update metrics collector
        self.metrics.update(robot_metrics, scheduler_metrics, environment_metrics)
        
        # Store metrics in history
        self.history["timestamps"].append(current_time)
        self.history["robot_metrics"].append(robot_metrics.copy())
        self.history["task_metrics"].append(scheduler_metrics.copy())
        self.history["environment_metrics"].append(environment_metrics.copy())
        
        # Display metrics in text format
        self._display_text_metrics()
        
        # Update plots if enabled
        if self.show_graphs:
            self._update_plots()
            
    def _display_text_metrics(self):
        """Display metrics in text format."""
        latest_metrics = self.metrics.get_latest()
        
        # Format display
        print("\n===== Simulation Dashboard =====")
        print(f"Time: {time.time() - self.metrics.start_time:.2f}s")
        
        print("\n--- Robot Metrics ---")
        robot_metrics = latest_metrics["robot"]
        print(f"Position: ({robot_metrics.get('position', 'N/A')})")
        print(f"Battery: {robot_metrics.get('battery_percentage', 0):.1f}%")
        print(f"Distance traveled: {robot_metrics.get('distance_traveled', 0):.2f}m")
        print(f"Energy consumed: {robot_metrics.get('energy_consumed', 0):.2f}mAh")
        print(f"Tasks completed: {robot_metrics.get('tasks_completed', 0)}")
        print(f"Collisions: {robot_metrics.get('collisions', 0)}")
        
        print("\n--- Task Metrics ---")
        task_metrics = latest_metrics["tasks"]
        print(f"Completed tasks: {task_metrics.get('num_completed_tasks', 0)}")
        print(f"Pending tasks: {task_metrics.get('num_pending_tasks', 0)}")
        print(f"Avg completion time: {task_metrics.get('avg_completion_time', 0):.2f}s")
        print(f"Avg wait time: {task_metrics.get('avg_wait_time', 0):.2f}s")
        print(f"Throughput: {task_metrics.get('throughput', 0):.2f} tasks/s")
        
        print("\n--- Environment Metrics ---")
        env_metrics = latest_metrics["environment"]
        print(f"Items: {env_metrics.get('num_items', 0)}")
        print(f"Obstacles: {env_metrics.get('num_obstacles', 0)}")
        print(f"Racks: {env_metrics.get('num_racks', 0)}")
        print("=============================\n")
        
    def enable_graphs(self, enabled=True):
        """Enable or disable graphical display."""
        self.show_graphs = enabled
        
        if enabled and not self.active_plots:
            self._initialize_plots()
            
    def _initialize_plots(self):
        """Initialize plots for metrics visualization."""
        plt.ion()  # Turn on interactive mode
        
        # Create figure with subplots
        fig, axs = plt.subplots(2, 2, figsize=(12, 8))
        fig.suptitle('Robot Simulation Metrics')
        
        # Robot metrics plot
        self.active_plots.append({
            'ax': axs[0, 0],
            'lines': axs[0, 0].plot([], [], 'r-', [], [], 'b-'),
            'title': 'Robot Metrics',
            'legend': ['Battery %', 'Distance (m)'],
            'data_keys': ['battery_percentage', 'distance_traveled']
        })
        axs[0, 0].set_title('Robot Metrics')
        axs[0, 0].set_xlabel('Time (s)')
        axs[0, 0].set_ylabel('Value')
        axs[0, 0].legend(['Battery %', 'Distance (m)'])
        
        # Task metrics plot
        self.active_plots.append({
            'ax': axs[0, 1],
            'lines': axs[0, 1].plot([], [], 'g-', [], [], 'm-'),
            'title': 'Task Metrics',
            'legend': ['Completed', 'Pending'],
            'data_keys': ['num_completed_tasks', 'num_pending_tasks']
        })
        axs[0, 1].set_title('Task Metrics')
        axs[0, 1].set_xlabel('Time (s)')
        axs[0, 1].set_ylabel('Count')
        axs[0, 1].legend(['Completed', 'Pending'])
        
        # Efficiency plot
        self.active_plots.append({
            'ax': axs[1, 0],
            'lines': axs[1, 0].plot([], [], 'c-'),
            'title': 'Efficiency',
            'legend': ['Tasks / Energy'],
            'data_keys': ['efficiency']
        })
        axs[1, 0].set_title('Efficiency')
        axs[1, 0].set_xlabel('Time (s)')
        axs[1, 0].set_ylabel('Tasks/Energy')
        axs[1, 0].legend(['Tasks / Energy'])
        
        # Throughput plot
        self.active_plots.append({
            'ax': axs[1, 1],
            'lines': axs[1, 1].plot([], [], 'y-'),
            'title': 'Throughput',
            'legend': ['Tasks/s'],
            'data_keys': ['throughput']
        })
        axs[1, 1].set_title('Throughput')
        axs[1, 1].set_xlabel('Time (s)')
        axs[1, 1].set_ylabel('Tasks/s')
        axs[1, 1].legend(['Tasks/s'])
        
        plt.tight_layout()
        plt.show(block=False)
        
    def _update_plots(self):
        """Update plots with latest metrics."""
        if not self.active_plots:
            return
            
        # Prepare time data relative to start time
        times = [t - self.metrics.start_time for t in self.history["timestamps"]]
        
        # Update each plot
        for plot in self.active_plots:
            ax = plot['ax']
            lines = plot['lines']
            data_keys = plot['data_keys']
            
            # Clear the axis
            ax.clear()
            ax.set_title(plot['title'])
            ax.set_xlabel('Time (s)')
            
            # Update data for each line
            for i, key in enumerate(data_keys):
                data = []
                
                # Determine which metric category this key belongs to
                if key in self.history["robot_metrics"][0]:
                    data = [metrics.get(key, 0) for metrics in self.history["robot_metrics"]]
                elif key in self.history["task_metrics"][0]:
                    data = [metrics.get(key, 0) for metrics in self.history["task_metrics"]]
                elif key == 'efficiency':
                    # Calculate efficiency as tasks completed / energy consumed
                    tasks = [m.get('tasks_completed', 0) for m in self.history["robot_metrics"]]
                    energy = [m.get('energy_consumed', 1) for m in self.history["robot_metrics"]]
                    data = [t/e if e > 0 else 0 for t, e in zip(tasks, energy)]
                elif key == 'throughput':
                    data = [metrics.get('throughput', 0) for metrics in self.history["task_metrics"]]
                
                # Plot the data
                if data:
                    ax.plot(times, data, label=plot['legend'][i])
            
            ax.legend()
            
        plt.draw()
        plt.pause(0.001)
        
    def show_final_metrics(self):
        """Show final metrics at the end of the simulation."""
        print("\n====== Final Simulation Results ======")
        
        # Calculate total metrics
        total_metrics = self.metrics.get_totals()
        
        # Robot metrics
        robot_metrics = total_metrics["robot"]
        print(f"\nRobot Performance:")
        print(f"Total distance traveled: {robot_metrics.get('distance_traveled', 0):.2f}m")
        print(f"Total energy consumed: {robot_metrics.get('energy_consumed', 0):.2f}mAh")
        print(f"Total tasks completed: {robot_metrics.get('tasks_completed', 0)}")
        print(f"Total collisions: {robot_metrics.get('collisions', 0)}")
        print(f"Final battery level: {robot_metrics.get('battery_percentage', 0):.1f}%")
        
        # Task metrics
        task_metrics = total_metrics["tasks"]
        print(f"\nTask Performance:")
        print(f"Total tasks completed: {task_metrics.get('num_completed_tasks', 0)}")
        print(f"Average completion time: {task_metrics.get('avg_completion_time', 0):.2f}s")
        print(f"Average wait time: {task_metrics.get('avg_wait_time', 0):.2f}s")
        print(f"Final throughput: {task_metrics.get('throughput', 0):.2f} tasks/s")
        
        # Efficiency
        if robot_metrics.get('energy_consumed', 0) > 0:
            efficiency = (robot_metrics.get('tasks_completed', 0) / 
                         robot_metrics.get('energy_consumed', 1))
            print(f"\nOverall efficiency: {efficiency:.4f} tasks/mAh")
            
        # Total time
        total_time = self.history["timestamps"][-1] - self.metrics.start_time
        print(f"\nTotal simulation time: {total_time:.2f}s")
        
        print("\n====================================")
        
        # Show final plots
        if self.show_graphs:
            plt.ioff()
            self._update_plots()
            plt.show()
            
    def __str__(self):
        """String representation of the dashboard."""
        return f"Dashboard(metrics={len(self.history['timestamps'])})"
