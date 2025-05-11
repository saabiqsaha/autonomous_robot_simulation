"""
Task scheduling module for robot task management.
"""

import heapq
import time
from collections import deque

class TaskScheduler:
    """
    Task scheduler for managing robot tasks.
    """
    
    def __init__(self, tasks=None, max_queue_size=100):
        """
        Initialize the task scheduler.
        
        Args:
            tasks (list): Initial list of tasks
            max_queue_size (int): Maximum number of tasks in the queue
        """
        self.tasks = tasks or []
        self.max_queue_size = max_queue_size
        self.completed_tasks = []
        self.current_task = None
        
        # Task queue uses a priority queue
        self.task_queue = []
        for task in self.tasks:
            # Default priority is 1
            heapq.heappush(self.task_queue, (1, time.time(), task))
            
        # Statistics
        self.task_completion_times = {}
        self.task_wait_times = {}
        self.start_time = time.time()
        
    def add_task(self, task, priority=1):
        """
        Add a task to the scheduler.
        
        Args:
            task: Task to add
            priority (int): Priority level (lower is higher priority)
            
        Returns:
            bool: Success status
        """
        if len(self.task_queue) >= self.max_queue_size:
            return False
            
        # Add task with priority and timestamp (for stable sorting)
        heapq.heappush(self.task_queue, (priority, time.time(), task))
        self.tasks.append(task)
        
        # Record arrival time for statistics
        task_id = id(task)
        self.task_wait_times[task_id] = time.time()
        
        return True
        
    def add_tasks(self, tasks, priorities=None):
        """
        Add multiple tasks to the scheduler.
        
        Args:
            tasks (list): Tasks to add
            priorities (list): Priority levels
            
        Returns:
            int: Number of tasks successfully added
        """
        if priorities is None:
            priorities = [1] * len(tasks)
            
        added = 0
        for task, priority in zip(tasks, priorities):
            if self.add_task(task, priority):
                added += 1
                
        return added
        
    def get_next_task(self):
        """
        Get the next task from the queue.
        
        Returns:
            Task: Next task or None if queue is empty
        """
        if not self.task_queue:
            self.current_task = None
            return None
            
        # Get highest priority task
        _, _, task = heapq.heappop(self.task_queue)
        self.current_task = task
        
        return task
        
    def mark_completed(self, task):
        """
        Mark a task as completed.
        
        Args:
            task: Task that was completed
            
        Returns:
            bool: Success status
        """
        if task in self.tasks:
            self.tasks.remove(task)
            self.completed_tasks.append(task)
            
            # Record completion time for statistics
            task_id = id(task)
            now = time.time()
            self.task_completion_times[task_id] = now
            
            # Calculate wait time if we have the arrival time
            if task_id in self.task_wait_times:
                wait_time = now - self.task_wait_times[task_id]
                self.task_wait_times[task_id] = wait_time
                
            return True
        return False
        
    def cancel_task(self, task):
        """
        Cancel a task.
        
        Args:
            task: Task to cancel
            
        Returns:
            bool: Success status
        """
        # Need to rebuild the queue to remove the task
        if task in self.tasks:
            self.tasks.remove(task)
            
            # Rebuild the queue without the canceled task
            new_queue = [(p, ts, t) for p, ts, t in self.task_queue if t != task]
            heapq.heapify(new_queue)
            self.task_queue = new_queue
            
            return True
        return False
        
    def reprioritize_task(self, task, new_priority):
        """
        Change the priority of a task.
        
        Args:
            task: Task to reprioritize
            new_priority (int): New priority level
            
        Returns:
            bool: Success status
        """
        # Need to remove and re-add with new priority
        if task in self.tasks:
            # Remove task from queue
            self.cancel_task(task)
            
            # Add back with new priority
            heapq.heappush(self.task_queue, (new_priority, time.time(), task))
            self.tasks.append(task)
            
            return True
        return False
        
    def replan(self, robot_position, path_planner):
        """
        Replan tasks based on robot position and current state.
        
        Args:
            robot_position (tuple): Current robot position
            path_planner (PathPlanner): Path planner object
            
        Returns:
            list: New task queue
        """
        # This is a simplified implementation
        # In a real system, this would be more sophisticated
        
        # Sort tasks by distance to the robot
        tasks_with_distance = []
        for priority, timestamp, task in self.task_queue:
            task_pos = task.get_position()
            distance = ((task_pos[0] - robot_position[0])**2 + 
                       (task_pos[1] - robot_position[1])**2)**0.5
                       
            # Calculate a new priority based on distance and original priority
            # Lower value = higher priority
            new_priority = distance * priority * 0.1
            
            tasks_with_distance.append((new_priority, timestamp, task))
            
        # Create a new queue
        heapq.heapify(tasks_with_distance)
        self.task_queue = tasks_with_distance
        
        return self.task_queue
        
    def get_statistics(self):
        """
        Get scheduler statistics.
        
        Returns:
            dict: Scheduler statistics
        """
        running_time = time.time() - self.start_time
        
        # Calculate average completion time
        completion_times = list(self.task_completion_times.values())
        avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0
        
        # Calculate average wait time
        wait_times = [t for t in self.task_wait_times.values() if isinstance(t, float)]
        avg_wait_time = sum(wait_times) / len(wait_times) if wait_times else 0
        
        return {
            "num_completed_tasks": len(self.completed_tasks),
            "num_pending_tasks": len(self.task_queue),
            "avg_completion_time": avg_completion_time,
            "avg_wait_time": avg_wait_time,
            "throughput": len(self.completed_tasks) / running_time if running_time > 0 else 0,
        }
        
    def __str__(self):
        """String representation of the task scheduler."""
        return f"TaskScheduler(tasks={len(self.tasks)}, completed={len(self.completed_tasks)}, pending={len(self.task_queue)})"
