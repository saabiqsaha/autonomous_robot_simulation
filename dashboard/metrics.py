"""
Metrics collection and processing module.
"""

import time
import numpy as np
from collections import deque

class MetricsCollector:
    """
    Metrics collector for gathering and processing simulation metrics.
    """
    
    def __init__(self, history_length=100):
        """
        Initialize the metrics collector.
        
        Args:
            history_length (int): Number of historical metrics to keep
        """
        self.history_length = history_length
        self.start_time = time.time()
        
        # Metrics history stored in deques for efficient append/pop
        self.robot_metrics_history = deque(maxlen=history_length)
        self.task_metrics_history = deque(maxlen=history_length)
        self.environment_metrics_history = deque(maxlen=history_length)
        
        # Latest metrics
        self.latest_robot_metrics = {}
        self.latest_task_metrics = {}
        self.latest_environment_metrics = {}
        
        # Aggregated metrics
        self.total_robot_metrics = {}
        self.total_task_metrics = {}
        self.total_environment_metrics = {}
        
    def update(self, robot_metrics, task_metrics, environment_metrics):
        """
        Update metrics with new data.
        
        Args:
            robot_metrics (dict): Robot performance metrics
            task_metrics (dict): Task scheduler metrics
            environment_metrics (dict): Environment state metrics
        """
        # Store latest metrics
        self.latest_robot_metrics = robot_metrics
        self.latest_task_metrics = task_metrics
        self.latest_environment_metrics = environment_metrics
        
        # Add to history
        self.robot_metrics_history.append(robot_metrics.copy())
        self.task_metrics_history.append(task_metrics.copy())
        self.environment_metrics_history.append(environment_metrics.copy())
        
        # Update aggregated metrics
        self._update_aggregated_metrics()
        
    def _update_aggregated_metrics(self):
        """Update aggregated metrics from history."""
        # Robot metrics - use the latest values for most metrics
        self.total_robot_metrics = self.latest_robot_metrics.copy()
        
        # Task metrics - some metrics need special handling
        self.total_task_metrics = self.latest_task_metrics.copy()
        
        # Environment metrics - use latest values
        self.total_environment_metrics = self.latest_environment_metrics.copy()
        
        # Calculate moving averages for certain metrics
        if len(self.task_metrics_history) > 1:
            # Calculate throughput over different time windows
            self.total_task_metrics["throughput_1min"] = self._calculate_throughput(60)
            self.total_task_metrics["throughput_5min"] = self._calculate_throughput(300)
            
    def _calculate_throughput(self, time_window):
        """
        Calculate throughput over a specific time window.
        
        Args:
            time_window (float): Time window in seconds
            
        Returns:
            float: Throughput in tasks per second
        """
        current_time = time.time()
        window_start_time = current_time - time_window
        
        # Count tasks completed in the window
        tasks_in_window = sum(1 for metrics in self.task_metrics_history
                            if metrics.get("timestamp", 0) >= window_start_time)
        
        return tasks_in_window / min(time_window, current_time - self.start_time)
        
    def get_latest(self):
        """
        Get the latest metrics.
        
        Returns:
            dict: Latest metrics categorized
        """
        return {
            "robot": self.latest_robot_metrics,
            "tasks": self.latest_task_metrics,
            "environment": self.latest_environment_metrics
        }
        
    def get_totals(self):
        """
        Get the aggregated total metrics.
        
        Returns:
            dict: Total metrics categorized
        """
        return {
            "robot": self.total_robot_metrics,
            "tasks": self.total_task_metrics,
            "environment": self.total_environment_metrics
        }
        
    def get_history(self, metric_name, category="robot", window=None):
        """
        Get historical values for a specific metric.
        
        Args:
            metric_name (str): Name of the metric
            category (str): Category of the metric ('robot', 'tasks', or 'environment')
            window (int): Optional window length to limit history
            
        Returns:
            list: Historical values for the metric
        """
        if category == "robot":
            history = self.robot_metrics_history
        elif category == "tasks":
            history = self.task_metrics_history
        elif category == "environment":
            history = self.environment_metrics_history
        else:
            return []
            
        # Get values for the metric
        values = [metrics.get(metric_name, None) for metrics in history if metric_name in metrics]
        
        # Apply window if specified
        if window is not None and window < len(values):
            values = values[-window:]
            
        return values
        
    def calculate_statistics(self, metric_name, category="robot", window=None):
        """
        Calculate statistics for a specific metric.
        
        Args:
            metric_name (str): Name of the metric
            category (str): Category of the metric
            window (int): Optional window length to limit history
            
        Returns:
            dict: Statistics for the metric
        """
        values = self.get_history(metric_name, category, window)
        
        if not values:
            return {
                "mean": None,
                "median": None,
                "min": None,
                "max": None,
                "std": None
            }
            
        # Filter out None values
        values = [v for v in values if v is not None]
        
        if not values:
            return {
                "mean": None,
                "median": None,
                "min": None,
                "max": None,
                "std": None
            }
            
        return {
            "mean": np.mean(values),
            "median": np.median(values),
            "min": np.min(values),
            "max": np.max(values),
            "std": np.std(values)
        }
        
    def __str__(self):
        """String representation of the metrics collector."""
        return f"MetricsCollector(history={len(self.robot_metrics_history)})"
