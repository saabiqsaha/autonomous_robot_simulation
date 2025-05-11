"""
Path planning module for the autonomous robot.
"""

import numpy as np
import heapq

class PathPlanner:
    """
    Path planner class for finding optimal paths through the warehouse.
    """
    
    def __init__(self, warehouse_map, resolution=0.1):
        """
        Initialize the path planner.
        
        Args:
            warehouse_map (numpy.array): 2D grid representation of the warehouse
            resolution (float): Resolution of the map in meters per cell
        """
        self.map = warehouse_map
        self.resolution = resolution
        
        # Precompute map dimensions
        self.height, self.width = self.map.shape
        
    def plan_path(self, start, goal, obstacle_detections=None):
        """
        Plan a path from start to goal.
        
        Args:
            start (tuple): Start position (x, y) in meters
            goal (tuple): Goal position (x, y) in meters
            obstacle_detections (list): Optional list of newly detected obstacles
            
        Returns:
            list: List of waypoints [(x, y), ...] in meters
        """
        # Convert positions from meters to grid coordinates
        start_grid = self._meters_to_grid(start)
        goal_grid = self._meters_to_grid(goal)
        
        # Create a copy of the map to add dynamic obstacles
        planning_map = self.map.copy()
        
        # Add detected obstacles to the map
        if obstacle_detections:
            for detection in obstacle_detections:
                obstacle = detection["obstacle"]
                min_x, min_y = self._meters_to_grid((obstacle.x_min, obstacle.y_min))
                max_x, max_y = self._meters_to_grid((obstacle.x_max, obstacle.y_max))
                
                # Ensure coordinates are within map bounds
                min_x = max(0, min(self.width - 1, min_x))
                max_x = max(0, min(self.width - 1, max_x))
                min_y = max(0, min(self.height - 1, min_y))
                max_y = max(0, min(self.height - 1, max_y))
                
                # Mark obstacle on the map
                planning_map[min_y:max_y+1, min_x:max_x+1] = 1
        
        # Plan path using A* algorithm
        path_grid = self._a_star(planning_map, start_grid, goal_grid)
        
        if not path_grid:
            # If A* fails, try a simpler approach or return a direct path
            return [start, goal]
            
        # Convert path from grid coordinates to meters
        path_meters = [self._grid_to_meters(pos) for pos in path_grid]
        
        # Simplify path by removing unnecessary waypoints
        simplified_path = self._simplify_path(path_meters, planning_map)
        
        return simplified_path
        
    def _a_star(self, grid_map, start, goal):
        """
        A* path planning algorithm.
        
        Args:
            grid_map (numpy.array): 2D grid map
            start (tuple): Start position in grid coordinates
            goal (tuple): Goal position in grid coordinates
            
        Returns:
            list: Path as a list of grid coordinates
        """
        # Check if start or goal is in an obstacle
        if grid_map[start[1], start[0]] == 1 or grid_map[goal[1], goal[0]] == 1:
            return []
            
        # A* algorithm
        open_set = []
        closed_set = set()
        came_from = {}
        
        # Cost from start to current
        g_score = {start: 0}
        
        # Estimated total cost
        f_score = {start: self._heuristic(start, goal)}
        
        # Priority queue with (f_score, position)
        heapq.heappush(open_set, (f_score[start], start))
        
        while open_set:
            _, current = heapq.heappop(open_set)
            
            if current == goal:
                # Reconstruct path
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                return path[::-1]  # Reverse to get start-to-goal
                
            closed_set.add(current)
            
            # Check neighbors
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0), 
                           (1, 1), (1, -1), (-1, 1), (-1, -1)]:
                neighbor = (current[0] + dx, current[1] + dy)
                
                # Check if out of bounds
                if (neighbor[0] < 0 or neighbor[0] >= self.width or
                    neighbor[1] < 0 or neighbor[1] >= self.height):
                    continue
                    
                # Check if obstacle or already visited
                if grid_map[neighbor[1], neighbor[0]] == 1 or neighbor in closed_set:
                    continue
                    
                # Calculate cost
                # Diagonal movement costs more
                if abs(dx) + abs(dy) == 2:
                    move_cost = 1.414  # sqrt(2)
                else:
                    move_cost = 1.0
                    
                tentative_g = g_score.get(current, float('inf')) + move_cost
                
                if (neighbor not in g_score or tentative_g < g_score[neighbor]):
                    # This path is better than any previous one
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self._heuristic(neighbor, goal)
                    
                    # Add to open set if not already there
                    if neighbor not in [item[1] for item in open_set]:
                        heapq.heappush(open_set, (f_score[neighbor], neighbor))
                        
        # No path found
        return []
        
    def _heuristic(self, a, b):
        """
        Heuristic function for A* (Euclidean distance).
        
        Args:
            a, b: Positions in grid coordinates
            
        Returns:
            float: Estimated cost between positions
        """
        return np.sqrt((b[0] - a[0])**2 + (b[1] - a[1])**2)
        
    def _meters_to_grid(self, position_m):
        """Convert position from meters to grid coordinates."""
        x, y = position_m
        grid_x = int(x / self.resolution)
        grid_y = int(y / self.resolution)
        
        # Ensure within grid bounds
        grid_x = max(0, min(self.width - 1, grid_x))
        grid_y = max(0, min(self.height - 1, grid_y))
        
        return (grid_x, grid_y)
        
    def _grid_to_meters(self, position_grid):
        """Convert position from grid coordinates to meters."""
        grid_x, grid_y = position_grid
        x = (grid_x + 0.5) * self.resolution  # Center of the cell
        y = (grid_y + 0.5) * self.resolution  # Center of the cell
        
        return (x, y)
        
    def _simplify_path(self, path, grid_map):
        """
        Simplify path by removing unnecessary waypoints.
        
        Args:
            path (list): Path as a list of (x, y) positions in meters
            grid_map (numpy.array): Grid map for collision checking
            
        Returns:
            list: Simplified path
        """
        if len(path) <= 2:
            return path
            
        simplified = [path[0]]  # Start with the first point
        current_idx = 0
        
        while current_idx < len(path) - 1:
            # Try to find the furthest point we can go to directly
            for i in range(len(path) - 1, current_idx, -1):
                start = path[current_idx]
                end = path[i]
                
                # Check if direct path is collision-free
                if self._is_path_clear(start, end, grid_map):
                    simplified.append(path[i])
                    current_idx = i
                    break
            
            # If we couldn't find a clear path, just add the next point
            if current_idx == len(path) - 1 or path[current_idx] == simplified[-1]:
                current_idx += 1
                if current_idx < len(path):
                    simplified.append(path[current_idx])
                    
        return simplified
        
    def _is_path_clear(self, start, end, grid_map):
        """
        Check if a straight path between start and end is clear of obstacles.
        
        Args:
            start, end: Positions in meters
            grid_map: Grid map for collision checking
            
        Returns:
            bool: True if path is clear
        """
        # Convert to grid coordinates
        start_grid = self._meters_to_grid(start)
        end_grid = self._meters_to_grid(end)
        
        # Bresenham's line algorithm to check for obstacles
        x0, y0 = start_grid
        x1, y1 = end_grid
        
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        
        while x0 != x1 or y0 != y1:
            if 0 <= y0 < grid_map.shape[0] and 0 <= x0 < grid_map.shape[1]:
                if grid_map[y0, x0] == 1:
                    return False  # Obstacle in the way
            
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy
                
        return True
        
    def __str__(self):
        """String representation of the path planner."""
        return f"PathPlanner(map_size={self.width}x{self.height}, resolution={self.resolution}m)"
