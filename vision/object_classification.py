"""
Object classification module for the vision system.
"""

import numpy as np

class ObjectClassifier:
    """
    Object classifier for categorizing detected objects.
    """
    
    def __init__(self, class_types=None, accuracy=0.9):
        """
        Initialize the object classifier.
        
        Args:
            class_types (list): List of possible object classes
            accuracy (float): Base accuracy of the classifier
        """
        self.class_types = class_types or ["box", "pallet", "container", "tool", "part"]
        self.accuracy = accuracy
        
        # Simulated confusion matrix - probabilities of misclassification
        # In a real system, this would be learned from training data
        num_classes = len(self.class_types)
        self.confusion_matrix = np.eye(num_classes) * self.accuracy
        
        # Fill in off-diagonal elements with misclassification probabilities
        off_diag_val = (1 - self.accuracy) / (num_classes - 1)
        
        for i in range(num_classes):
            for j in range(num_classes):
                if i != j:
                    self.confusion_matrix[i, j] = off_diag_val
    
    def classify(self, detected_objects):
        """
        Classify detected objects.
        
        Args:
            detected_objects (list): List of detected objects
            
        Returns:
            list: Objects with classification information
        """
        classified_objects = []
        
        for detection in detected_objects:
            obj = detection["object"]
            
            # Get the true class (in simulation, we already know this)
            # In reality, this would be determined through machine learning
            if hasattr(obj, "item_type"):
                true_class_name = obj.item_type
                
                # Map the true class to an index in our class types
                if true_class_name.startswith("type_"):
                    # Extract the number from the type_X format
                    try:
                        type_idx = int(true_class_name.split("_")[1]) - 1
                        true_class_idx = type_idx % len(self.class_types)
                    except (ValueError, IndexError):
                        true_class_idx = np.random.randint(0, len(self.class_types))
                else:
                    # Try to find the class name in our list
                    if true_class_name in self.class_types:
                        true_class_idx = self.class_types.index(true_class_name)
                    else:
                        true_class_idx = np.random.randint(0, len(self.class_types))
            else:
                # If no type information, assign random class
                true_class_idx = np.random.randint(0, len(self.class_types))
            
            # Apply the confusion matrix to simulate classification
            class_probs = self.confusion_matrix[true_class_idx]
            
            # Add some noise to the probabilities
            noise = np.random.normal(0, 0.05, len(class_probs))
            class_probs = np.clip(class_probs + noise, 0, 1)
            class_probs = class_probs / np.sum(class_probs)  # Normalize
            
            # Get the predicted class and confidence
            predicted_class_idx = np.argmax(class_probs)
            predicted_class = self.class_types[predicted_class_idx]
            confidence = class_probs[predicted_class_idx]
            
            # Modify confidence based on detection confidence
            detection_confidence = detection.get("confidence", 1.0)
            adjusted_confidence = confidence * detection_confidence
            
            # Create classification result
            classification = {
                **detection,  # Include all detection information
                "predicted_class": predicted_class,
                "confidence": adjusted_confidence,
                "class_probabilities": {
                    self.class_types[i]: float(class_probs[i])
                    for i in range(len(self.class_types))
                }
            }
            
            classified_objects.append(classification)
            
        return classified_objects
        
    def extract_features(self, detection):
        """
        Extract features from a detection for classification.
        This is a simulated function that would be more complex in a real system.
        
        Args:
            detection (dict): Detection information
            
        Returns:
            numpy.array: Feature vector
        """
        # In a real system, this would extract meaningful features
        # For simulation, we'll just create a random feature vector
        return np.random.rand(10)  # 10 random features
        
    def update_with_feedback(self, classification_result, correct_class):
        """
        Update classifier with feedback on a classification.
        
        Args:
            classification_result (dict): Previous classification result
            correct_class (str): Correct class name
            
        Returns:
            bool: Success status
        """
        if correct_class not in self.class_types:
            return False
            
        # In a real system, this would update the classifier
        # For simulation, we'll just improve the accuracy slightly
        correct_idx = self.class_types.index(correct_class)
        predicted_idx = self.class_types.index(classification_result["predicted_class"])
        
        if correct_idx != predicted_idx:
            # Slightly increase probability of correct classification
            improvement = 0.01
            self.confusion_matrix[correct_idx, correct_idx] += improvement
            self.confusion_matrix[correct_idx, predicted_idx] -= improvement
            
            # Ensure valid probabilities
            self.confusion_matrix[correct_idx] = np.clip(
                self.confusion_matrix[correct_idx], 0, 1)
            self.confusion_matrix[correct_idx] /= np.sum(self.confusion_matrix[correct_idx])
            
        return True
        
    def __str__(self):
        """String representation of the object classifier."""
        return f"ObjectClassifier(accuracy={self.accuracy}, classes={self.class_types})"
