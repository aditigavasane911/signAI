# 🤟 SignAI — Indian Sign Language & Gesture Recognition Platform

A full-stack, real-time AI-powered Indian Sign Language (ISL) and everyday phrase recognition platform built with **React 19 + TypeScript + Vite** on the frontend and **Python (FastAPI) + MediaPipe** on the backend.

---

## 📁 Sorted Architecture & Directory Structure

```plaintext
signAI/
├── 📄 package.json                    # Workspace orchestration scripts
├── 📄 docker-compose.yml              # Multi-container full-stack docker setup
├── 📄 .gitignore                      # Git ignore rules for Python & Node
├── 📄 README.md                       # Complete documentation & developer guide
│
├── 📂 frontend/                       # Client Application (React 19 + Vite)
│   ├── 📄 package.json                # Frontend dependencies & scripts
│   ├── 📄 vite.config.ts              # Vite configuration & /api reverse proxy
│   ├── 📄 tsconfig.json               # TypeScript base configuration
│   ├── 📄 tsconfig.app.json           # React app TypeScript configuration
│   ├── 📄 .env.example                # Frontend environment template
│   ├── 📄 .env                        # Local development variables
│   ├── 📄 index.html                  # HTML entry point
│   ├── 📂 public/                     # Static assets (logos, icons, favicons)
│   └── 📂 src/
│       ├── 📂 assets/                 # SVGs, images, brand graphics
│       ├── 📂 components/             # Reusable UI widgets & CameraStudio
│       │   ├── CameraStudio.tsx       # Live webcam & landmark gesture studio
│       │   ├── Navbar.tsx             # Main navigation bar
│       │   ├── Footer.tsx             # Application footer
│       │   ├── BrandLogo.tsx          # Brand icon & wordmark
│       │   └── ...
│       ├── 📂 context/                # Global React contexts (ThemeContext)
│       ├── 📂 data/                   # Bundled centroid models & gestures data
│       │   ├── gestures.ts            # Everyday & core gesture dictionaries
│       │   ├── islModelData.ts        # Bundled ISL alphabet centroids
│       │   └── phrasesModelData.ts    # Bundled phrase models
│       ├── 📂 pages/                  # Route views
│       │   ├── HomePage.tsx           # Landing page with interactive hero
│       │   ├── StudioPage.tsx         # Real-time gesture studio
│       │   ├── LibraryPage.tsx        # Gesture & phrase dictionary
│       │   ├── DocsPage.tsx           # Developer documentation
│       │   ├── LoginPage.tsx          # User sign-in
│       │   └── RegisterPage.tsx       # User registration
│       ├── 📂 services/               # API clients for FastAPI backend
│       │   └── api.ts                 # Typed REST client with on-device fallback
│       ├── 📂 styles/                 # CSS design system (globals, variables)
│       ├── 📂 types/                  # TypeScript interface definitions
│       ├── 📂 utils/                  # Vision & landmark helper modules
│       │   ├── gestureClassifier.ts   # Centroid distance & fingers calculation
│       │   ├── handMeshRenderer.ts    # Canvas hand mesh & skeleton renderer
│       │   ├── faceMeshRenderer.ts    # Canvas face landmark mesh renderer
│       │   ├── motionGestureTracker.ts# Dynamic gesture motion vector tracker
│       │   └── twoHandGestureTracker.ts# Two-hand relational tracker
│       ├── App.tsx                    # Route definitions & layout wrappers
│       └── main.tsx                   # React DOM root entry point
│
└── 📂 backend/                        # AI/ML Backend Service (Python FastAPI)
    ├── 📄 requirements.txt            # Python dependencies (FastAPI, MediaPipe, etc.)
    ├── 📄 .env.example                # Backend environment template
    ├── 📄 .env                        # Local backend runtime variables
    ├── 📄 Dockerfile                  # Container definition for backend
    ├── 📄 main.py                     # FastAPI entry point, CORS & lifespan
    ├── 📂 app/
    │   ├── 📂 api/                    # API Routing Layer
    │   │   ├── 📂 routes/
    │   │   │   ├── health.py          # GET /api/v1/health (system status)
    │   │   │   ├── gestures.py        # POST /classify-landmarks, POST /classify-image
    │   │   │   ├── phrases.py         # POST /classify-landmarks, GET /classes
    │   │   │   └── models.py          # GET /api/v1/models/info
    │   │   └── router.py              # Consolidated API v1 router
    │   ├── 📂 core/
    │   │   └── config.py              # Pydantic settings & path resolvers
    │   ├── 📂 models/
    │   │   └── schemas.py             # Pydantic request/response validation
    │   ├── 📂 services/
    │   │   ├── gesture_engine.py      # ISL Alphabet & digit centroid inference
    │   │   ├── phrase_engine.py       # Multi-hand phrase classification
    │   │   └── mediapipe_service.py   # Server-side MediaPipe landmark extractor
    │   └── 📂 data/                   # Active model files & vision weights
    │       ├── hand_landmarker.task   # MediaPipe Hand Landmarker task bundle
    │       ├── isl_model.json         # 23 trained ISL alphabet centroids
    │       └── phrases_model.json     # 44 trained phrase centroids
    ├── 📂 datasets/                   # Training and validation datasets
    │   ├── 📂 ISL_Dataset/            # Labeled ISL alphabet image dataset
    │   └── 📂 images_for_phrases/     # Labeled everyday phrase image dataset
    └── 📂 scripts/                    # ML Training Pipelines
        ├── train_isl_model.py         # Trains ISL alphabet model from images
        └── train_phrases_model.py     # Trains phrase model from images
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **Python** (3.10 to 3.14)

---

### 2. Running the Frontend
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```
The frontend will start at **http://localhost:5173**.

---

### 3. Running the Backend (FastAPI)
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
- API Base URL: **http://127.0.0.1:8000**
- Interactive Swagger UI: **http://127.0.0.1:8000/docs**
- ReDoc Documentation: **http://127.0.0.1:8000/redoc**

---

### 4. Convenient Workspace Scripts (From Root)
You can run any part of the project directly from the root workspace directory:

| Command | Action |
| :--- | :--- |
| `npm run dev:frontend` | Runs the React/Vite development server |
| `npm run build:frontend` | Type-checks and creates a production build |
| `npm run lint:frontend` | Runs Oxlint linter on frontend code |
| `npm run dev:backend` | Runs the FastAPI backend server on port 8000 |
| `npm run train:isl` | Retrains ISL alphabet models from datasets |
| `npm run train:phrases` | Retrains phrase models from datasets |

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API Welcome message & service metadata |
| `GET` | `/api/v1/health` | Health status and loaded model counts |
| `GET` | `/api/v1/gestures/classes` | List of 23 supported ISL alphabet classes |
| `POST` | `/api/v1/gestures/classify-landmarks` | 21 normalized 3D landmarks classification |
| `POST` | `/api/v1/gestures/classify-image` | Server-side image landmark detection & classification |
| `GET` | `/api/v1/phrases/classes` | List of 44 supported everyday phrase signs |
| `POST` | `/api/v1/phrases/classify-landmarks` | Multi-hand landmark phrase classification |
| `GET` | `/api/v1/models/info` | Trained classes, feature dimensions, timestamps |

---

## 🧠 Hybrid Edge + Cloud Architecture

SignAI supports a flexible **hybrid architecture**:
1. **On-Device Edge Inference (Zero Latency)**: Runs in-browser via WebAssembly MediaPipe and TypeScript centroid engines when offline or conserving bandwidth.
2. **FastAPI Cloud Inference**: High-accuracy server-side inference for low-powered devices, batch verification, and multi-user services via the `/api/v1/gestures` and `/api/v1/phrases` REST endpoints.
