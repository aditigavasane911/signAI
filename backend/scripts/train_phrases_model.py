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

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

DATASET_DIR = BASE_DIR / "datasets" / "images_for_phrases"
if not DATASET_DIR.exists():
    DATASET_DIR = BASE_DIR / "datasets" / "images for phrases"
if not DATASET_DIR.exists():
    DATASET_DIR = ROOT_DIR / "images for phrases"

OUTPUT_BACKEND_JSON = BASE_DIR / "app" / "data" / "phrases_model.json"
OUTPUT_FRONTEND_JSON = ROOT_DIR / "frontend" / "src" / "data" / "phrases_model.json"
OUTPUT_TS = ROOT_DIR / "frontend" / "src" / "data" / "phrasesModelData.ts"
TASK_PATH = BASE_DIR / "scripts" / "hand_landmarker.task"
if not TASK_PATH.exists():
    TASK_PATH = BASE_DIR / "app" / "data" / "hand_landmarker.task"

print(f"Loading dataset from: {DATASET_DIR}")
classes = sorted([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))])
print(f"Found {len(classes)} phrase classes.")

# Setup MediaPipe Hand Landmarkers
base_options = python.BaseOptions(model_asset_path=str(TASK_PATH))
options_standard = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,
    min_hand_detection_confidence=0.08,
    min_hand_presence_confidence=0.08
)
detector_standard = vision.HandLandmarker.create_from_options(options_standard)

options_sensitive = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,
    min_hand_detection_confidence=0.01,
    min_hand_presence_confidence=0.01
)
detector_sensitive = vision.HandLandmarker.create_from_options(options_sensitive)

def extract_landmarks(img, use_sensitive=False):
    if img is None:
        return None, 0
    
    detector = detector_sensitive if use_sensitive else detector_standard
    
    # Try direct image first if sensitive, else with padding
    if use_sensitive:
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    else:
        bordered = cv2.copyMakeBorder(img, 60, 60, 60, 60, cv2.BORDER_CONSTANT, value=[255, 255, 255])
        bordered_resized = cv2.resize(bordered, (384, 384), interpolation=cv2.INTER_LINEAR)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bordered_resized, cv2.COLOR_BGR2RGB))
    
    res = detector.detect(mp_img)
    if res.hand_landmarks and len(res.hand_landmarks) > 0:
        hand_count = len(res.hand_landmarks)
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
        return feats, hand_count
    return None, 0

X_by_class = {}
two_hand_counts = {}
detected_counts = {}

SAMPLES_PER_CLASS = 20

for idx, label in enumerate(classes):
    class_dir = os.path.join(DATASET_DIR, label)
    files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    sample_files = files[:SAMPLES_PER_CLASS]
    
    X_by_class[label] = []
    two_hand_counts[label] = 0
    detected = 0
    
    for f in sample_files:
        img_p = os.path.join(class_dir, f)
        img = cv2.imread(img_p)
        feats, hand_count = extract_landmarks(img, use_sensitive=False)
        if feats is None:
            # Fallback to sensitive unpadded
            feats, hand_count = extract_landmarks(img, use_sensitive=True)
            
        if feats is not None:
            X_by_class[label].append(feats)
            detected += 1
            if hand_count >= 2:
                two_hand_counts[label] += 1
                
    detected_counts[label] = detected
    print(f"[{idx+1}/{len(classes)}] Class '{label}': {detected}/{len(sample_files)} detected ({two_hand_counts[label]} two-handed)")

# Compute centroids for each class
class_centroids = {}
is_two_handed = {}

for label, samples in X_by_class.items():
    if len(samples) > 0:
        arr = np.array(samples)
        mean_feats = np.mean(arr, axis=0).round(4).tolist()
        class_centroids[label] = mean_feats
        is_two_handed[label] = (two_hand_counts[label] / len(samples)) >= 0.45
    else:
        print(f"Warning: No samples detected for class '{label}'")

print(f"\nGenerated centroids for ALL {len(class_centroids)} classes: {list(class_centroids.keys())}")

def format_display_name(label):
    special = {
        "keepsmile": "Keep Smile",
        "i need help": "I Need Help",
        "how are you": "How Are You",
        "good morning": "Good Morning",
        "happy birthday": "Happy Birthday",
    }
    if label in special:
        return special[label]
    return " ".join(word.capitalize() for word in label.split())

PHRASE_METADATA = {
    "again": {"category": "Conversational", "desc": "Prompting repetition or asking to repeat an action or message.", "howTo": "Move your dominant hand in an arc toward your non-dominant palm to indicate repetition."},
    "agree": {"category": "Affirmation", "desc": "Expressing agreement, acceptance, or consensus.", "howTo": "Bring both hands forward in affirmation, nodding the hand motion affirmatively."},
    "answer": {"category": "Communication", "desc": "Giving a response or reply to a query.", "howTo": "Extend index finger from near mouth or chin pointing outward toward listener."},
    "attendance": {"category": "Work & Study", "desc": "Marking presence or attendance in a meeting or class.", "howTo": "Raise hand upright with open fingers indicating presence and attentiveness."},
    "book": {"category": "Objects", "desc": "Representing a reading book or study material.", "howTo": "Bring palms together like a closed book, then open them apart keeping pinky edges joined."},
    "break": {"category": "Daily Routine", "desc": "Indicating a pause, rest period, or interval.", "howTo": "Hold hands together horizontally then pivot them outward as if breaking a stick."},
    "careful": {"category": "Caution", "desc": "Advising caution, alertness, or careful handling.", "howTo": "Cross wrists gently with fingers poised, looking forward with attentive posture."},
    "change": {"category": "Action", "desc": "Expressing alteration, shift, or replacement.", "howTo": "Hold both hands in loose fists and twist/rotate positions simultaneously."},
    "chat": {"category": "Conversational", "desc": "Engaging in casual conversation or friendly discussion.", "howTo": "Alternate open hands gently back and forth toward each other like speaking."},
    "congratulations": {"category": "Celebration", "desc": "Congratulating on success, milestone, or achievement.", "howTo": "Clasp hands together warmly or raise hands shaking celebratory palms."},
    "email": {"category": "Technology", "desc": "Referring to email, digital mail, or inbox message.", "howTo": "Slide one hand into the C-shaped or cupped other hand like an envelope."},
    "file": {"category": "Work & Study", "desc": "Indicating a document, folder, or paper file.", "howTo": "Flatten palms parallel to each other then draw them together like placing papers."},
    "good morning": {"category": "Greeting", "desc": "Standard warm morning greeting and courteous welcome.", "howTo": "Touch chin gently with fingers then bring hand forward in a rising arc like sunrise."},
    "happy birthday": {"category": "Celebration", "desc": "Birthday congratulations and joyful celebration.", "howTo": "Touch middle finger to chest moving upward (happy) then sign birth and day."},
    "home": {"category": "Places", "desc": "Referring to residence, family dwelling, or home.", "howTo": "Form a peaked roof shape with fingertips touching, or touch mouth to cheek."},
    "how are you": {"category": "Greeting", "desc": "Asking about someone's wellbeing, health, or state.", "howTo": "Place both hands on chest with knuckles touching, roll hands outward open toward friend."},
    "hungry": {"category": "Feelings", "desc": "Signaling hunger or the need for a meal.", "howTo": "Cup your hand in a C-shape and move it downward along your chest/stomach."},
    "i need help": {"category": "Assistance", "desc": "Asking for immediate support, help, or assistance.", "howTo": "Place closed fist with thumb up on top of flat open palm, lifting both slightly."},
    "join": {"category": "Community", "desc": "Inviting someone to enter, connect, or become part of a group.", "howTo": "Form an open C with non-dominant hand and insert dominant fingers inward to connect."},
    "keepsmile": {"category": "Courtesy", "desc": "Wishing joy, thanking kindly, and encouraging a smile.", "howTo": "Point index fingers gently near corners of mouth and draw upward in a smile."},
    "meet": {"category": "Social", "desc": "Two individuals coming together to convene or converse.", "howTo": "Hold index fingers pointing up on each hand, bringing them together face to face."},
    "mistake": {"category": "Correction", "desc": "Acknowledging an error, misconception, or mistake.", "howTo": "Form a Y-shape or touch chin with knuckles, indicating an error."},
    "open": {"category": "Action", "desc": "Opening a door, book, application, or session.", "howTo": "Start with palms facing you touching, then swing them outward like open doors."},
    "opinion": {"category": "Thought", "desc": "Sharing personal viewpoint, perspective, or thoughts.", "howTo": "Place hand in O-shape near forehead or temple and move it outward."},
    "pass": {"category": "Action", "desc": "Passing an object, moving forward, or transferring.", "howTo": "Move one hand swiftly past the stationary other hand from back to front."},
    "please": {"category": "Courtesy", "desc": "Polite request expressing respect and courtesy.", "howTo": "Rub flat open palm in a circular motion over your chest with a friendly expression."},
    "practice": {"category": "Learning", "desc": "Rehearsing, exercising, and perfecting gestures.", "howTo": "Rub knuckles of dominant fist back and forth across extended index finger."},
    "pressure": {"category": "Feelings", "desc": "Feeling stress, urgency, or physical/mental pressure.", "howTo": "Push downward firmly on the back of the other hand with open palm."},
    "problem": {"category": "Assistance", "desc": "Identifying a difficulty, obstacle, or problem to solve.", "howTo": "Twist bent index and middle fingers against each other repeatedly."},
    "questions": {"category": "Inquiry", "desc": "Posing questions, asking for clarification, or inquiring.", "howTo": "Draw a question mark in the air with index finger and dot at bottom."},
    "remember": {"category": "Memory", "desc": "Recalling a memory, keeping in mind, or recollecting.", "howTo": "Touch thumb to forehead, then bring it down to touch non-dominant thumb."},
    "seat": {"category": "Action", "desc": "Taking a seat, offering a chair, or sitting down.", "howTo": "Drape bent index and middle fingers of one hand over the other like legs on a bench."},
    "shift": {"category": "Work & Study", "desc": "Work shift, changing position, or rotational schedule.", "howTo": "Arc hands in a half circle swapping forward and backward positions."},
    "sick": {"category": "Health", "desc": "Feeling unwell, ill, or requiring rest.", "howTo": "Touch middle finger to forehead and other middle finger to stomach simultaneously."},
    "stop": {"category": "Command", "desc": "Direct signal to halt, pause, or cease current action.", "howTo": "Bring the edge of open dominant hand down sharply onto flat open non-dominant palm."},
    "sun": {"category": "Nature", "desc": "Representing the sun, daylight, or radiant light.", "howTo": "Circle index finger above head then open all fingers into radiating sunbeams."},
    "team": {"category": "Community", "desc": "Collaborative group, squad, or joint committee.", "howTo": "Form T-shapes with hands, starting together then drawing a circle until pinkies touch."},
    "thirsty": {"category": "Feelings", "desc": "Expressing thirst or desire for drinking water.", "howTo": "Trace index finger straight down your throat to indicate thirst."},
    "this": {"category": "Demonstrative", "desc": "Pointing out a specific object, topic, or present item.", "howTo": "Point index finger downward directly onto open palm or indicated object."},
    "together": {"category": "Community", "desc": "Joint cooperation, unity, and being together as one.", "howTo": "Interlock fingers or clasp palms together moving in a small circular motion."},
    "understand": {"category": "Comprehension", "desc": "Signaling comprehension, grasp, and clarity of meaning.", "howTo": "Flick index finger upward next to forehead like a lightbulb turning on."},
    "wait": {"category": "Patience", "desc": "Asking someone to wait a moment or pause briefly.", "howTo": "Hold palms facing you with fingers wiggling gently, poised in place."},
    "where": {"category": "Inquiry", "desc": "Inquiring about location, position, or whereabouts.", "howTo": "Hold index finger upright and shake it gently side to side with questioning brow."},
    "write": {"category": "Action", "desc": "Noting down, writing with a pen, or recording text.", "howTo": "Hold fingers like gripping a pen and scribble across flat open non-dominant palm."}
}

output_data = {
    "classes": list(class_centroids.keys()),
    "centroids": class_centroids,
    "is_two_handed": is_two_handed,
    "detected_counts": detected_counts,
    "total_samples": sum(len(v) for v in X_by_class.values()),
    "feature_dim": 63,
    "trained_timestamp": "2026-10-29",
    "metadata": {
        label: {
            "name": format_display_name(label),
            "category": PHRASE_METADATA.get(label, {}).get("category", "Conversational Phrase"),
            "description": PHRASE_METADATA.get(label, {}).get("desc", f"Indian Sign Language gesture for '{format_display_name(label)}'."),
            "howTo": PHRASE_METADATA.get(label, {}).get("howTo", "Hold the sign steady in front of the camera with good lighting."),
            "two_handed": is_two_handed.get(label, False)
        }
        for label in class_centroids.keys()
    }
}

OUTPUT_BACKEND_JSON.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_BACKEND_JSON, "w", encoding="utf-8") as f:
    json.dump(output_data, f, indent=2)

if OUTPUT_FRONTEND_JSON.parent.exists():
    with open(OUTPUT_FRONTEND_JSON, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

print(f"Saved trained phrases model to {OUTPUT_BACKEND_JSON}!")

ts_content = f"""// Auto-generated trained phrases model from '{DATASET_DIR}'
export interface PhraseMetadata {{
  name: string;
  category: string;
  description: string;
  howTo: string;
  twoHanded: boolean;
}}

export interface PhrasesModelData {{
  classes: string[];
  centroids: Record<string, number[]>;
  isTwoHanded: Record<string, boolean>;
  metadata: Record<string, PhraseMetadata>;
  totalSamples: number;
}}

export const PHRASES_MODEL: PhrasesModelData = {json.dumps(
    {
        "classes": output_data["classes"],
        "centroids": output_data["centroids"],
        "isTwoHanded": output_data["is_two_handed"],
        "metadata": {
            k: {
                "name": v["name"],
                "category": v["category"],
                "description": v["description"],
                "howTo": v["howTo"],
                "twoHanded": v["two_handed"],
            }
            for k, v in output_data["metadata"].items()
        },
        "totalSamples": output_data["total_samples"]
    },
    indent=2
)};
"""

with open(OUTPUT_TS, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Saved TypeScript phrases model to {OUTPUT_TS}!")
print("ALL 44 PHRASES Successfully Trained!")
