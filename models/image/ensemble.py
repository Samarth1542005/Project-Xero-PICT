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

    # --- THE MTCNN FACE CROPPER & HIGH-CONFIDENCE MULTI-FACE DETECTION ---
    vit_fake = 0.0
    global mtcnn
    
    if mtcnn is not None:
        try:
            boxes, probs = mtcnn.detect(original_image)
            if boxes is not None and probs is not None:
                face_probs = []
                # Extreme false positives happen when MTCNN crops a random background pattern. 
                # We strictly filter by detection probability > 0.90 to ensure it's a real human head!
                for box, prob in zip(boxes, probs):
                    if prob is not None and prob > 0.90:
                        b = box.tolist()
                        face_crop = original_image.crop((b[0], b[1], b[2], b[3]))
                        face_probs.append(vit_fake_prob(face_crop))
                    if len(face_probs) >= 3:
                        break
                
                # Take the highest fake probability of CONFIRMED faces
                vit_fake = max(face_probs) if face_probs else 0.50
            else:
                vit_fake = 0.50 # Neutral: don't randomly run face models on empty scenes!
        except Exception as e:
            print(f"[ensemble] Face crop failed: {e}")
            vit_fake = 0.50
    else:
        vit_fake = 0.50

    # --- ROLE 2: SigLIP (Scene Detective) ---
    siglip_fake = siglip_fake_prob(original_image)

   # --- REDESIGNED MASTER ROUTER ---
    if is_video_frame:
        final_fake_score = vit_fake
    else:
        # Tightened override boundaries: require stronger signals before overriding the 70/30 balance.
        if vit_fake >= 0.65: 
            final_fake_score = vit_fake
        elif siglip_fake >= 0.85: 
            final_fake_score = siglip_fake
        else:
            final_fake_score = (0.7 * vit_fake) + (0.3 * siglip_fake)

    final_real_score = 1.0 - final_fake_score
    confidence = max(final_fake_score, final_real_score)

    # Safe Boundaries (Relaxed to avoid false positives on standard lighting)
    if final_fake_score >= 0.60:
        label = "fake"
    elif final_fake_score <= 0.40:
        label = "real"
    else:
        label = "uncertain"
        
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
