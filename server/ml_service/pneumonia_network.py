import torch
import torch.nn as nn
from torchvision import models

# ============================================================
# CBAM modules
# ============================================================
class ChannelAttention(nn.Module):
    def __init__(self, channels: int, reduction: int = 16):
        super().__init__()
        mid = max(1, channels // reduction)
        self.mlp = nn.Sequential(
            nn.Conv2d(channels, mid, kernel_size=1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid, channels, kernel_size=1, bias=False),
        )

    def forward(self, x):
        avg = torch.mean(x, dim=(2,3), keepdim=True)
        mx, _ = torch.max(x, dim=2, keepdim=True)
        mx, _ = torch.max(mx, dim=3, keepdim=True)
        attn = torch.sigmoid(self.mlp(avg) + self.mlp(mx))
        return x * attn

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size: int = 7):
        super().__init__()
        pad = kernel_size // 2
        self.conv = nn.Conv2d(2, 1, kernel_size=kernel_size, padding=pad, bias=False)

    def forward(self, x):
        avg = torch.mean(x, dim=1, keepdim=True)
        mx, _ = torch.max(x, dim=1, keepdim=True)
        attn = torch.sigmoid(self.conv(torch.cat([avg, mx], dim=1)))
        return x * attn

class CBAM(nn.Module):
    def __init__(self, channels: int, reduction: int = 16, spatial_kernel: int = 7):
        super().__init__()
        self.ca = ChannelAttention(channels, reduction=reduction)
        self.sa = SpatialAttention(kernel_size=spatial_kernel)

    def forward(self, x):
        x = self.ca(x)
        x = self.sa(x)
        return x

# ============================================================
# EfficientNet-B0 + CBAM wrapper (single logit)
# ============================================================
class EfficientNetB0WithCBAM(nn.Module):
    def __init__(self, base: nn.Module, cbam: nn.Module):
        super().__init__()
        self.base = base
        # Ensure base.classifier is replaced correctly before or during init
        # We assume base is already modified with the correct classifier head
        self.cbam = cbam

    def forward(self, x):
        x = self.base.features(x)
        x = self.cbam(x)
        x = self.base.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.base.classifier(x)
        return x

def build_pneumonia_model(device="cpu", weights_path=None) -> nn.Module:
    # We do NOT load ImageNet weights here because we will load our own state_dict
    # However, to match architecture, we need the structure.
    # The saved state_dict will contain the weights.
    base = models.efficientnet_b0(weights=None)

    # replace classifier -> single logit (Binary Classification)
    in_features = base.classifier[1].in_features
    base.classifier[1] = nn.Sequential(
        nn.Dropout(0.2), # Default dropout from user config
        nn.Linear(in_features, 1)
    )

    cbam = CBAM(channels=in_features,
                reduction=16,
                spatial_kernel=7)
    
    model = EfficientNetB0WithCBAM(base, cbam)
    model.to(device)

    if weights_path:
        try:
            state_dict = torch.load(weights_path, map_location=device)
            # Handle different checkpoint formats if necessary
            if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
                state_dict = state_dict['model_state_dict']
            
            model.load_state_dict(state_dict, strict=True)
            print(f"Successfully loaded EfficientNetB0+CBAM weights from {weights_path}")
        except Exception as e:
            print(f"Error loading EfficientNetB0+CBAM weights: {e}")
            raise e
            
    return model

def get_cam_target_layer(model: nn.Module) -> nn.Module:
    # If wrapped, the EfficientNet backbone lives in model.base
    if hasattr(model, "base"):
        # The user code said `model.base.features[-1]`.
        # However, due to how GradCAM works, sometimes we need the specific layer instance
        return model.base.features[-1]
    return model.features[-1]
