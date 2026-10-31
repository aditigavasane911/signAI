import os
import sys
import json
import cv2
import numpy as np

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

DATASET_DIR = "ISL_Dataset"
OUTPUT_JSON = "src/data/isl_model.json"

print(f"Loading dataset from: {DATASET_DIR}")
classes = sorted([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))])
print(f"Classes ({len(classes)}): {classes}")

# Setup MediaPipe Hand Landmarker
base_options = python.BaseOptions(model_asset_path="hand_landmarker.task")
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,
    min_hand_detection_confidence=0.08,
    min_hand_presence_confidence=0.08
)
detector = vision.HandLandmarker.create_from_options(options)

def extract_landmarks(img):
    if img is None:
        return None
    # Add border padding and resize to 384x384 for fast CPU inference
    bordered = cv2.copyMakeBorder(img, 60, 60, 60, 60, cv2.BORDER_CONSTANT, value=[255, 255, 255])
    bordered_resized = cv2.resize(bordered, (384, 384), interpolation=cv2.INTER_LINEAR)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bordered_resized, cv2.COLOR_BGR2RGB))
    
    res = detector.detect(mp_img)
    if res.hand_landmarks and len(res.hand_landmarks) > 0:
        landmarks = res.hand_landmarks[0]
        wrist = landmarks[0]
        scale = np.sqrt(
            (landmarks[9].x - wrist.x) ** 2 + 
            (landmarks[9].y - wrist.y) ** 2 + 
            (landmarks[9].z - wrist.z) ** 2
        )
        if scale == 0:
            scale = 1.0

        feats = []
        for p in landmarks:
            feats.extend([
                round(float((p.x - wrist.x) / scale), 4),
                round(float((p.y - wrist.y) / scale), 4),
                round(float((p.z - wrist.z) / scale), 4)
            ])
        return feats
    return None

X = []
y = []
detected_counts = {}

for label in classes:
    class_dir = os.path.join(DATASET_DIR, label)
    files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    detected_counts[label] = 0
    # Process up to 12 diverse images per class for fast and representative training
    sampled_files = files[:12]
    
    for f in sampled_files:
        img_p = os.path.join(class_dir, f)
        img = cv2.imread(img_p)
        feats = extract_landmarks(img)
        if feats is not None:
            X.append(feats)
            y.append(label)
            detected_counts[label] += 1
            
    print(f"Class '{label}': {detected_counts[label]}/{len(sampled_files)} detected")

print(f"\nTotal extracted samples: {len(X)}")

# Compute centroids for classes with detected samples
class_centroids = {}
for label in classes:
    matching = [X[i] for i in range(len(X)) if y[i] == label]
    if len(matching) > 0:
        arr = np.array(matching)
        mean_feats = np.mean(arr, axis=0).round(4).tolist()
        class_centroids[label] = mean_feats

print(f"Generated centroids for {len(class_centroids)} classes: {list(class_centroids.keys())}")

# Export trained model data
output_data = {
    "classes": classes,
    "centroids": class_centroids,
    "detected_counts": detected_counts,
    "total_samples": len(X),
    "feature_dim": 63,
    "trained_timestamp": "2026-10-28"
}

os.makedirs("src/data", exist_ok=True)
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(output_data, f, indent=2)

print(f"Successfully trained and saved model data to {OUTPUT_JSON}!")
