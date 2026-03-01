# Place Your Model Here

**Required File:** `chest_xray_pneumonia_final.keras`

This directory should contain your trained Keras/TensorFlow CNN model for pneumonia detection.

## Instructions

1. Copy your model file to this directory:
   ```
   chest_xray_pneumonia_final.keras
   ```

2. The model should be trained with:
   - Input size: 224x224x3 (RGB images)
   - Output classes (in order): ['Normal', 'Not_Xray', 'Pneumonia']

3. Start the ML service:
   ```bash
   cd ml_service
   python model_service.py
   ```

If the model file is not found, the ML service will fail to start.
