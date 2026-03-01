import os
import io
import cv2
import torch
import numpy as np
import base64
from PIL import Image, ImageOps
from fastapi import FastAPI, UploadFile, File, HTTPException
from contextlib import asynccontextmanager
import torch.nn as nn
from torchvision import transforms, models
from pytorch_grad_cam import GradCAM, GradCAMPlusPlus
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

# Import the new model architecture
from pneumonia_network import build_pneumonia_model, get_cam_target_layer

# --- CORE LOGIC ENGINE ---
class PneumoniaSystem:
    def __init__(self, cls_path="best_pneumonia_model.pt", gate_path="xray_gate_efficientnet_b0.pth"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading models on {self.device}...")
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cls_full_path = cls_path if os.path.isabs(cls_path) else os.path.join(base_dir, cls_path)
        gate_full_path = gate_path if os.path.isabs(gate_path) else os.path.join(base_dir, gate_path)
        
        # =========================================================
        # 1. LOAD GATE MODEL (EfficientNet-B0)
        # =========================================================
        print("Initializing X-ray Gate Model...")
        self.gate_model = models.efficientnet_b0(weights='IMAGENET1K_V1')
        
        # Replace classifier for binary task: [non_xray, xray]
        in_features = self.gate_model.classifier[1].in_features
        self.gate_model.classifier[1] = nn.Linear(in_features, 2)
        
        if os.path.exists(gate_full_path):
            try:
                self.gate_model.load_state_dict(torch.load(gate_full_path, map_location=self.device))
                print(f"Successfully loaded Gate Model from {gate_full_path}")
            except Exception as e:
                print(f"Error loading Gate Model: {e}")
                self.gate_model = None # Disable gate if load fails
        else:
            print(f"Warning: Gate Model weights not found at {gate_full_path}")
            self.gate_model = None
        if self.gate_model:
            self.gate_model.to(self.device).eval()
            
        # Gate Preprocessing: Resize to 224x224 (Standard EfficientNet)
        self.gate_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # =========================================================
        # 2. BUILD PNEUMONIA CLASSIFIER (EfficientNetB0 + CBAM)
        # =========================================================
        print("Building EfficientNetB0 + CBAM Classifier...")
        
        try:
            if os.path.exists(cls_full_path):
                self.cls_model = build_pneumonia_model(device=self.device, weights_path=cls_full_path)
                self.cls_model.eval()
            else:
                print(f"Warning: Classifier weights not found at {cls_full_path}")
                # Build without weights just in case, but it won't predict well
                self.cls_model = build_pneumonia_model(device=self.device, weights_path=None)
        except Exception as e:
            print(f"Error loading Classifier: {e}")
            raise e
        
        # =========================================================
        # TRANSFORMS (Standard ImageNet)
        # =========================================================
        self.cls_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def predict(self, image_bytes):
        # Convert bytes to PIL Image
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            # Fix EXIF rotation (ensures Python sees the same orientation as the browser)
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception:
            return {"error": "Invalid Image Format"}
            
        # =========================================================
        # STEP 1: GATE CHECK (Is this an X-ray?)
        # =========================================================
        xray_confidence = 0.0
        
        if self.gate_model:
            gate_tensor = self.gate_transform(pil_img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                gate_output = self.gate_model(gate_tensor)
                gate_probs = torch.softmax(gate_output, dim=1) # [non_xray_prob, xray_prob]
                
                # Index 1 is "xray" based on user description
                xray_prob = gate_probs[0][1].item()
                
                xray_confidence = xray_prob
                
                # Threshold check
                if xray_prob < 0.9:
                    print(f"Gate Rejection: Not an X-ray (Confidence: {xray_prob:.4f})")
                    return {
                        "is_xray": False,
                        "xray_confidence": round(xray_prob, 4),
                        "message": "This image is not a chest X-ray. Please upload a chest X-ray image."
                    }
                else:
                    print(f"Gate Passed: Is X-ray (Confidence: {xray_prob:.4f})")
                    
        # =========================================================
        # STEP 2: CLASSIFY (EfficientNetB0 - Single Logit)
        # =========================================================
        tensor = self.cls_transform(pil_img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            output = self.cls_model(tensor)
            # Sigmoid for binary output
            pneumonia_prob = torch.sigmoid(output).item()
        
        # Threshold 0.5
        if pneumonia_prob >= 0.5:
            classification = "Pneumonia"
            class_confidence = pneumonia_prob
        else:
            classification = "Normal"
            class_confidence = 1.0 - pneumonia_prob
        
        # =========================================================
        # STEP 3: GRAD-CAM (Heatmap)
        # =========================================================
        heatmap_base64 = None
        try:
            # =========================================================
            # Target Layer
            # =========================================================
            target_layers = [get_cam_target_layer(self.cls_model)]
            
            # For Binary Classifier (Single Output):
            # The output is a single logit. High value = Pneumonia. Low value = Normal.
            # We want to visualize what parts contribute to the output.
            # ClassifierOutputTarget(0) targets the 0-th index (the only one).
            
            if classification == "Pneumonia":
                print("Explaining PNEUMONIA prediction (GradCAM++ in progress...)")
            else:
                print("Explaining NORMAL prediction (GradCAM++ in progress...)")
                
            targets = [ClassifierOutputTarget(0)]
                
            # Robust CAM Generation with Fallback
            tensor.requires_grad = True
            try:
                cam_algo = GradCAMPlusPlus(model=self.cls_model, target_layers=target_layers)
                grayscale_cam = cam_algo(input_tensor=tensor, targets=targets)[0, :]
                print("GradCAM++ Success")
            except Exception as e_plus:
                print(f"GradCAM++ Failed ({e_plus}), falling back to standard GradCAM")
                cam_algo = GradCAM(model=self.cls_model, target_layers=target_layers)
                grayscale_cam = cam_algo(input_tensor=tensor, targets=targets)[0, :]
                print("GradCAM Fallback Success")
                
            # =========================================================
            # POST-CAM PROCESSING
            # =========================================================
            # Base image: float32 [0, 1], RGB (required by show_cam_on_image)
            orig_np = np.array(pil_img).astype(np.float32) / 255.0
            h, w = orig_np.shape[:2]
            if len(orig_np.shape) == 2:
                orig_np = np.stack([orig_np, orig_np, orig_np], axis=-1)
            
            # Resize CAM to image size
            cam_resized = cv2.resize(grayscale_cam, (w, h), interpolation=cv2.INTER_CUBIC)
            
            # Normalize to [0, 1]
            cam_min, cam_max = cam_resized.min(), cam_resized.max()
            if cam_max > cam_min:
                cam_normalized = (cam_resized - cam_min) / (cam_max - cam_min)
            else:
                cam_normalized = np.zeros_like(cam_resized).astype(np.float32)
            
            # Overlay
            overlay_rgb = show_cam_on_image(
                orig_np, cam_normalized,
                use_rgb=True,
                colormap=cv2.COLORMAP_JET,
                image_weight=0.5
            )
            
            overlay_bgr = cv2.cvtColor(overlay_rgb, cv2.COLOR_RGB2BGR)
            success, buffer = cv2.imencode('.png', overlay_bgr)
            if success:
                heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
            
        except Exception as cam_err:
            print(f"Grad-CAM CRASHED: {cam_err}")
            import traceback
            traceback.print_exc()
            
        print(f"Analysis Complete: Class={classification} ({class_confidence:.2%})")
        return {
            "is_xray": True,
            "xray_confidence": round(xray_confidence, 4),
            "classification": classification,
            "class_confidence": round(class_confidence, 4),
            "image_width": pil_img.width,
            "image_height": pil_img.height,
            "heatmap": heatmap_base64
        }

# --- FASTAPI APP ---
ml_system = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ml_system
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to models in the server/ml_model folder
    # NOTE: Changed to .pt extension to match new model file
    cls_path = os.path.join(base_dir, "..", "ml_model", "classifier", "best_pneumonia_model.pt")
    
    # Gate model assumed path
    gate_path = os.path.join(base_dir, "..", "ml_model", "gate", "xray_gate_efficientnet_b0.pth")
    
    ml_system = PneumoniaSystem(
        cls_path=cls_path, 
        gate_path=gate_path
    )
    yield
    ml_system = None

app = FastAPI(title="Pneumonia Detection API", lifespan=lifespan)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not ml_system:
        raise HTTPException(status_code=503, detail="ML System not initialized")
    
    contents = await file.read()
    
    try:
        result = ml_system.predict(contents)
        if "error" in result:
             raise HTTPException(status_code=400, detail=result["error"])
        
        # Check if rejected by gate
        if result.get("is_xray") is False:
             return result
        return result
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "healthy", "models": ["EfficientNet-B0 (Gate)", "EfficientNetB0+CBAM"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)