from flask import Flask, request, jsonify
from tensorflow import keras
import numpy as np
from PIL import Image
import os

app = Flask(__name__)

# Load model once at startup (caching)
# Load model using absolute path relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_model', 'chest_xray_pneumonia_final.keras')
model = None

# Class order - CRITICAL
CLASS_NAMES = ['Normal', 'Not_Xray', 'Pneumonia']
CONFIDENCE_THRESHOLD = 0.70

def load_model():
    """Load the Keras model"""
    global model
    if model is None:
        print("Starting ML Service...")
        print(f"Model path: {MODEL_PATH}")
        print(f"Model file exists: {os.path.exists(MODEL_PATH)}")
        
        try:
            print("Loading model...")
            # Load model with compile=False for TensorFlow 2.15
            import tensorflow as tf
            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            print("Model loaded successfully!")
            print(f"Model input shape: {model.input_shape}")
            print(f"Model output shape: {model.output_shape}")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    return model

def diagnose_chest_xray(image_path):
    """
    Diagnose chest X-ray image using the CNN model.
    
    Args:
        image_path: Path to the chest X-ray image
        
    Returns:
        dict: Contains diagnosis, message, and confidence
    """
    try:
        # Step A: Image Preprocessing
        # 1. Load image
        img = Image.open(image_path)
        
        # 2. Resize to 224x224
        img = img.resize((224, 224))
        
        # 3. Convert to RGB (in case of grayscale or RGBA)
        img = img.convert('RGB')
        
        # 4. Convert to NumPy array
        img_array = np.array(img)
        
        # 5. Normalize pixel values to [0, 1]
        img_array = img_array / 255.0
        
        # 6. Expand dimensions for batch (1, 224, 224, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        # Step B: Model Prediction
        model = load_model()
        predictions = model.predict(img_array, verbose=0)
        
        # Get probabilities for each class
        probabilities = predictions[0]
        
        # Step C: Business Validation Logic
        # 1. Identify max prediction
        max_prob_index = np.argmax(probabilities)
        max_prob = float(probabilities[max_prob_index])
        predicted_class = CLASS_NAMES[max_prob_index]
        
        # 2. Validation Rule 1: Non-X-ray Check
        if predicted_class == 'Not_Xray':
            return {
                "diagnosis": "Invalid Image",
                "message": "Please upload a valid chest X-ray image.",
                "confidence": max_prob
            }
        
        # 3. Validation Rule 2: Confidence Threshold Check
        if max_prob < CONFIDENCE_THRESHOLD:
            return {
                "diagnosis": "Uncertain",
                "message": "Confidence is too low. Review by a specialist is required.",
                "confidence": max_prob
            }
        
        # 4. Final Diagnosis
        return {
            "diagnosis": predicted_class,
            "message": "Diagnosis confirmed.",
            "confidence": max_prob
        }
        
    except Exception as e:
        print(f"Error in diagnosis: {str(e)}")
        return {
            "diagnosis": "Error",
            "message": f"Error processing image: {str(e)}",
            "confidence": 0.0
        }

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint for predictions"""
    if 'image_path' not in request.json:
        return jsonify({"error": "No image_path provided"}), 400
    
    image_path = request.json['image_path']
    
    if not os.path.exists(image_path):
        return jsonify({"error": "Image file not found"}), 404
    
    result = diagnose_chest_xray(image_path)
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

if __name__ == '__main__':
    load_model()  # Pre-load model at startup
    app.run(host='0.0.0.0', port=5001, debug=False)
