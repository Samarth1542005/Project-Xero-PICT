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

    # --- THE MTCNN FACE CROPPER & MULTI-FACE DETECTION ---
    vit_fake = 0.0
    global mtcnn
    
    if mtcnn is not None:
        try:
            boxes, _ = mtcnn.detect(original_image)
            if boxes is not None:
                face_probs = []
                # Evaluate up to 3 faces to prevent multi-person deepfakes from hiding
                for box in boxes[:3]:
                    b = box.tolist()
                    face_crop = original_image.crop((b[0], b[1], b[2], b[3]))
                    face_probs.append(vit_fake_prob(face_crop))
                # Take the highest fake probability found among the faces
                vit_fake = max(face_probs) if face_probs else vit_fake_prob(original_image)
            else:
                vit_fake = vit_fake_prob(original_image)
        except Exception as e:
            print(f"[ensemble] Face crop failed: {e}")
            vit_fake = vit_fake_prob(original_image)
    else:
        vit_fake = vit_fake_prob(original_image)

    # --- ROLE 2: SigLIP (Scene Detective) ---
    siglip_fake = siglip_fake_prob(original_image)

    # --- VIDEO VS IMAGE ROUTING LOGIC ---
    if is_video_frame:
        # Video compression ruins SigLIP out-of-the-box, and video fakes are mostly Face-Swaps.
        # We rely 100% on the Face Detective without the aggressive 1.5x static image booster.
        final_fake_score = vit_fake
    else:
        # --- SMART OVERRIDE LOGIC ---
        if vit_fake >= 0.50:
            final_fake_score = vit_fake
        elif siglip_fake >= 0.80:
            final_fake_score = siglip_fake
        else:
            final_fake_score = (VIT_WEIGHT * vit_fake) + (SIGLIP_WEIGHT * siglip_fake)

    final_real_score = 1.0 - final_fake_score
    confidence = max(final_fake_score, final_real_score)

    if final_fake_score >= 0.55:
        label = "fake"
    elif final_fake_score <= 0.45:
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