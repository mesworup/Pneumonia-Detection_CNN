# Pneumonia Detection ML Service

This service provides a two-stage pneumonia detection pipeline using **EfficientNetV2-S** for classification and **YOLOv11m** for lesion localization.

## Setup

1.  **System Requirements**:
    *   Python 3.10+
    *   CUDA-compatible GPU (optional, for faster inference)

2.  **Installation**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Model Files**:
    Ensure the following files are present in the `server/ml_model` directory:
    *   `classifier/best_pneumonia_model.pth` (EfficientNetV2-S weights)
    *   `detector/best.pt` (YOLOv11m weights)

4.  **Running the Service**:
    ```bash
    python main.py
    ```
    The service will start on `http://localhost:8000`.

## API Endpoints

### POST `/predict`
Analyzes a chest X-ray image.

*   **Request**: `multipart/form-data` with a `file` field containing the image.
*   **Response**:
    ```json
    {
      "classification": "Pneumonia",
      "class_confidence": 0.9234,
      "boxes": [
        {
          "x1": 120.5,
          "y1": 89.2,
          "x2": 245.7,
          "y2": 210.3,
          "confidence": 0.876
        }
      ]
    }
    ```

### GET `/health`
Checks the service status and loaded models.
