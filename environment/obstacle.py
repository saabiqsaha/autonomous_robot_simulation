"""
Obstacle module for the simulation environment.
"""

import numpy as np

class Obstacle:
    """
    Obstacle class representing physical barriers in the environment.
    """
    
    def __init__(self, obstacle_id, position, dimensions):
        """
        Initialize an obstacle.
        
        Args:
            obstacle_id (int): Unique identifier
            position (tuple): Position (x, y) of the obstacle
            dimensions (tuple): Dimensions (width, length, height) in meters
        """
        self.obstacle_id = obstacle_id
        self.position = position
        self.dimensions = dimensions
        
        # Calculate bounding box
        self.x_min = position[0] - dimensions[0] / 2
        self.x_max = position[0] + dimensions[0] / 2
        self.y_min = position[1] - dimensions[1] / 2
        self.y_max = position[1] + dimensions[1] / 2
        
    def is_point_inside(self, point):
        """
        Check if a point is inside the obstacle.
        
        Args:
            point (tuple): Point (x, y) to check
            
        Returns:
            bool: True if the point is inside the obstacle
        """
        x, y = point
        return (self.x_min <= x <= self.x_max and 
                self.y_min <= y <= self.y_max)
                
    def intersects_with_line(self, start, end):
        """
        Check if a line intersects with the obstacle.
        
        Args:
            start (tuple): Start point (x, y) of the line
            end (tuple): End point (x, y) of the line
            
        Returns:
            bool: True if the line intersects with the obstacle
        """
        # Check if either endpoint is inside the obstacle
        if self.is_point_inside(start) or self.is_point_inside(end):
            return True
            
        # Check if the line intersects with any of the 4 edges of the obstacle
        edges = [
            ((self.x_min, self.y_min), (self.x_max, self.y_min)),  # Bottom edge
            ((self.x_max, self.y_min), (self.x_max, self.y_max)),  # Right edge
            ((self.x_max, self.y_max), (self.x_min, self.y_max)),  # Top edge
            ((self.x_min, self.y_max), (self.x_min, self.y_min))   # Left edge
        ]
        
        for edge_start, edge_end in edges:
            if self._line_segments_intersect(start, end, edge_start, edge_end):
                return True
                
        return False
        
    def _line_segments_intersect(self, p1, p2, p3, p4):
        """
        Check if two line segments intersect.
        
        Args:
            p1, p2: First line segment endpoints
            p3, p4: Second line segment endpoints
            
        Returns:
            bool: True if the line segments intersect
        """
        # Calculate the direction vectors
        d1 = (p2[0] - p1[0], p2[1] - p1[1])
        d2 = (p4[0] - p3[0], p4[1] - p3[1])
        
        # Calculate the cross product
        cross = d1[0] * d2[1] - d1[1] * d2[0]
        
        # If cross product is zero, lines are parallel
        if abs(cross) < 1e-8:
            return False
            
        # Calculate the differences between the starting points
        s = (p3[0] - p1[0], p3[1] - p1[1])
        
        # Calculate the parameters for the intersection point
        t = (s[0] * d2[1] - s[1] * d2[0]) / cross
        u = (s[0] * d1[1] - s[1] * d1[0]) / cross
        
        # Check if the intersection is within both line segments
        return 0 <= t <= 1 and 0 <= u <= 1
        
    def get_distance(self, point):
        """
        Get the distance from a point to the obstacle.
        
        Args:
            point (tuple): Point (x, y)
            
        Returns:
            float: Distance to the obstacle surface
        """
        x, y = point
        
        # If point is inside, distance is zero
        if self.is_point_inside(point):
            return 0.0
            
        # Calculate distance to each edge
        dx = max(self.x_min - x, 0, x - self.x_max)
        dy = max(self.y_min - y, 0, y - self.y_max)
        
        return np.sqrt(dx**2 + dy**2)
        
    def __str__(self):
        """String representation of the obstacle."""
        return f"Obstacle(id={self.obstacle_id}, pos={self.position}, dim={self.dimensions})"
