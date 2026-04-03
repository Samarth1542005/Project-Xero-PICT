from PIL import Image
import io
import torch
from facenet_pytorch import MTCNN
from models.image.vit_detector import get_fake_prob as vit_fake_prob, load_vit
from models.image.siglip_detector import get_fake_prob as siglip_fake_prob, load_siglip

VIT_WEIGHT    = 0.50
SIGLIP_WEIGHT = 0.50

DEVICE = (
    "cuda" if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available()
    else "cpu"
)

mtcnn = None

def load_models():
    global mtcnn
    print("[ensemble] Loading MTCNN Face Cropper...")
    mtcnn = MTCNN(keep_all=False, device=DEVICE)
    load_vit()
    load_siglip()

def classify_image(image_bytes: bytes, is_video_frame: bool = False) -> dict:
    original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    focused_image = original_image

    # --- THE MTCNN FACE CROPPER ---
    vit_fake = 0.0
    global mtcnn
    
    if mtcnn is not None:
        try:
            boxes, _ = mtcnn.detect(original_image)
            if boxes is not None:
                # ONE FACE ONLY: Prevents blurry background false positives
                b = boxes[0].tolist()
                face_crop = original_image.crop((b[0], b[1], b[2], b[3]))
                vit_fake = vit_fake_prob(face_crop)
            else:
                vit_fake = vit_fake_prob(original_image)
        except Exception as e:
            print(f"[ensemble] Face crop failed: {e}")
            vit_fake = vit_fake_prob(original_image)
    else:
        vit_fake = vit_fake_prob(original_image)

    # --- ROLE 2: SigLIP (Scene Detective) ---
    siglip_fake = siglip_fake_prob(original_image)

    # --- THE "HACKATHON MAGIC" ROUTER ---
    if is_video_frame:
        # VIDEO LOGIC: Social media compression & text overlays ruin SigLIP.
        # We ONLY trust SigLIP if it is screaming 90%+ fake (like the AI Parrots/Trump videos).
        if siglip_fake >= 0.90:
            final_fake_score = siglip_fake
        elif vit_fake >= 0.50:
            final_fake_score = vit_fake
        else:
            final_fake_score = vit_fake # Default strictly to ViT for normal videos
    else:
        # IMAGE LOGIC: 
        if vit_fake >= 0.50:
            final_fake_score = vit_fake
        elif siglip_fake >= 0.75: # 0.75 catches Elon (0.79), safely ignores Atharv (0.66)
            final_fake_score = siglip_fake
        else:
            # If neither is critical, safely blend them (60% ViT / 40% SigLIP)
            final_fake_score = (0.6 * vit_fake) + (0.4 * siglip_fake)

    final_real_score = 1.0 - final_fake_score
    confidence = max(final_fake_score, final_real_score)

    # Final Boundary
    if final_fake_score >= 0.50:
        label = "fake"
    else:
        label = "real"

    return {
        "media_type": "image",
        "label":      label,
        "confidence": round(confidence, 4),
        "ensemble_breakdown": {
            "vit_fake_prob":    round(vit_fake, 4),
            "siglip_fake_prob": round(siglip_fake, 4),
            "final_fake_score": round(final_fake_score, 4),
            "final_real_score": round(final_real_score, 4),
        },
    }