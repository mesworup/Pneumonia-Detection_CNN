<div align="center">

# PneumoDetect

### Chest X-Ray Based Pneumonia Detection Using CNN Models

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)

A full-stack web application that uses a custom **EfficientNet-B0 + CBAM** deep learning model to detect pneumonia from chest X-ray images, featuring **Grad-CAM visualizations**, an **AI medical assistant** powered by Google Gemini, and **role-based dashboards** for doctors, patients, and administrators.

</div>

---

## Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Model Architecture](#-model-architecture)
- [Technology Stack](#-technology-stack)
- [Setup Instructions](#-setup-instructions)
- [Running the Application](#-running-the-application)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [API Endpoints](#-api-endpoints)
- [Team Members](#-team-members)
- [Acknowledgement](#-acknowledgement)
- [License](#-license)

---

## 🚀 Key Features

### Deep Learning Pipeline

- **Pneumonia Classification** — Custom EfficientNet-B0 + CBAM (Convolutional Block Attention Module) model trained on 5,000+ chest X-rays for binary classification (Normal / Pneumonia)
- **X-Ray Gate Filter** — EfficientNet-B0 gate model that rejects non-X-ray images before classification, preventing misuse
- **Grad-CAM Heatmaps** — Visual explanations highlighting the lung regions the model focused on for its prediction, aiding clinical interpretability

### AI Medical Assistant

- **Google Gemini Integration** — `gemini-2.5-flash` powered chatbot that explains diagnoses in patient-friendly language
- **Context-Aware Conversations** — Chatbot understands the patient's specific report (diagnosis, confidence score, doctor's notes) and provides personalized responses
- **Medical Safety Guardrails** — Built-in prompts ensure the AI always recommends consulting a healthcare professional

### Clinical Report System

- **PDF Report Generation** — Auto-generates comprehensive reports with diagnosis, confidence scores, Grad-CAM visualizations, and doctor's clinical notes
- **Role-Based Dashboards**:
  | Role | Capabilities |
  |------|-------------|
  | **Doctor** | Upload X-rays, review AI analysis, add clinical notes, submit reports |
  | **Patient** | View report history, download PDFs, chat with AI assistant |
  | **Admin** | Manage users, reset passwords, oversee system |

### Security

- **JWT Authentication** with secure session management
- **Role-Based Access Control (RBAC)** with protected routes per user type
- **Environment variable validation** — Server refuses to start if critical secrets are missing

---

## 🏗 System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Frontend   │────▶│   Backend API    │────▶│   ML Service (FastAPI)│
│  React + Vite│◀────│  Express + Node  │◀────│  PyTorch + Grad-CAM  │
│  :5173       │     │  :5000           │     │  :8000               │
└─────────────┘     └───────┬──────────┘     └─────────────────────┘
                            │
                    ┌───────┴──────────┐
                    │   MongoDB Atlas   │
                    │   + Google Gemini │
                    └──────────────────┘
```

---

## 🧠 Model Architecture

### Classifier: EfficientNet-B0 + CBAM

```
Input Image (224×224×3)
        │
        ▼
┌─────────────────────┐
│  EfficientNet-B0     │   Pretrained feature extractor
│  (Feature Extraction)│
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  CBAM Attention      │   Channel Attention → Spatial Attention
│  (1280 channels)     │   Helps model focus on relevant lung regions
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│  Global Avg Pooling  │
│  Dropout (0.2)       │
│  Dense (1, sigmoid)  │   Binary output: Normal vs Pneumonia
└─────────────────────┘
```

- **Training Loss**: Focal Loss (γ=2.0, α=0.84) — handles class imbalance in medical datasets
- **Attention Mechanism**: CBAM (Convolutional Block Attention Module) with channel reduction ratio 16 and 7×7 spatial kernel
- **Interpretability**: Grad-CAM++ heatmaps generated from the last convolutional layer

### Gate Model: EfficientNet-B0

A secondary EfficientNet-B0 model that classifies images as **X-ray vs Non-X-ray**, preventing the classifier from processing irrelevant images.

---

## 🛠 Technology Stack

| Layer                  | Technologies                                                   |
| ---------------------- | -------------------------------------------------------------- |
| **Frontend**           | React 19, Vite, React Router, Context API, Lucide Icons, jsPDF |
| **Backend**            | Node.js, Express.js, Mongoose, JWT, Multer                     |
| **Database**           | MongoDB Atlas                                                  |
| **ML Service**         | Python, FastAPI, PyTorch, torchvision, Grad-CAM                |
| **AI Assistant**       | Google Generative AI SDK (Gemini 2.5 Flash)                    |
| **Model Architecture** | EfficientNet-B0, CBAM, Focal Loss                              |

---

## ⚙ Setup Instructions

### Prerequisites

- **Node.js** v16 or higher
- **Python** 3.8 or higher
- **MongoDB Atlas** account ([create free cluster](https://www.mongodb.com/atlas))
- **Google Gemini API Key** ([get one here](https://aistudio.google.com/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/Roshan-ch/Pneumonia-Detection-CNN.git
cd Pneumonia-Detection-CNN
```

### 2. Model Setup

Place your trained model files in the following locations:

```
server/ml_model/classifier/best_pneumonia_model.pt     # EfficientNet-B0 + CBAM classifier
server/ml_model/gate/xray_gate_efficientnet_b0.pth     # X-ray gate model (optional)
```

### 3. Install Dependencies

```bash
# Python ML Service
cd server/ml_service
pip install -r requirements.txt

# Backend
cd ../
npm install

# Frontend
cd ../client
npm install
```

### 4. Environment Variables

Copy the example and fill in your credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
ADMIN_PASSWORD=your_secure_admin_password
ML_SERVICE_URL=http://localhost:8000/predict
```

> **Note:** The server will not start if `MONGODB_URI`, `JWT_SECRET`, or `GEMINI_API_KEY` are missing.

---

## ▶ Running the Application

### Quick Start (Recommended)

**Terminal 1 — Backend + ML Service:**

```bash
cd server
npm run dev:all
```

**Terminal 2 — Frontend:**

```bash
cd client
npm run dev
```

### Manual Start (Separate Terminals)

```bash
# Terminal 1: ML Service
cd server/ml_service && python main.py

# Terminal 2: Backend
cd server && npm run dev

# Terminal 3: Frontend
cd client && npm run dev
```

### Access Points

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| ML Service  | http://localhost:8000 |

---

## 🧪 Usage Guide

1. **Register / Login** — Create a doctor or patient account (an admin account is auto-seeded on first run)
2. **Upload X-Ray** _(Doctor)_ — Upload a chest X-ray image from the Doctor Dashboard
3. **AI Analysis** — The system runs the image through the gate filter and classifier, returning:
   - Diagnosis (Normal / Pneumonia)
   - Confidence score
   - Grad-CAM heatmap showing regions of interest
4. **Add Notes & Submit** _(Doctor)_ — Review the results, add clinical notes, and save the report
5. **View Report** _(Patient)_ — Patients see their reports with diagnosis details
6. **Chat with AI** _(Patient)_ — Click "Analyze with AI" to get a plain-language explanation from the Gemini chatbot
7. **Download PDF** — Generate a complete PDF report with all findings

---

## 📁 Project Structure

```
Pneumonia-Detection-CNN/
├── client/                          # React Frontend
│   ├── .env                         # Client environment variables
│   ├── index.html                   # HTML entry point
│   ├── vite.config.js               # Vite configuration
│   ├── eslint.config.js             # ESLint configuration
│   ├── package.json
│   ├── public/                      # Static assets
│   │   ├── ai-lung-scan.png
│   │   └── cnn-lung-visualization.png
│   └── src/
│       ├── App.jsx                  # Root React component
│       ├── App.css                  # Global styles
│       ├── main.jsx                 # React entry point
│       ├── index.css
│       ├── components/              # Reusable UI components
│       │   ├── AuthModal.jsx        # Login/Register modal
│       │   ├── Chatbot.jsx          # Gemini AI chat interface
│       │   ├── Hero.jsx             # Landing page hero section
│       │   ├── Navbar.jsx           # Navigation bar
│       │   ├── NeuralNetwork.jsx    # Neural network visualization
│       │   ├── NotificationBell.jsx # Real-time notifications
│       │   ├── ProtectedRoute.jsx   # Auth route guard
│       │   ├── Services.jsx         # Services section
│       │   └── StatsTicker.jsx      # Statistics ticker
│       ├── pages/                   # Route pages
│       │   ├── AdminDashboard.jsx   # Admin panel
│       │   ├── DoctorDashboard.jsx  # Doctor workspace
│       │   ├── PatientDashboard.jsx # Patient reports view
│       │   ├── Profile.jsx          # User profile & password
│       │   ├── Login.jsx            # Login page
│       │   └── Register.jsx         # Registration page
│       ├── context/                 # React Context providers
│       │   ├── AuthContext.jsx      # Authentication state
│       │   └── LanguageContext.jsx   # Language/i18n state
│       └── config/
│           └── api.js               # API URL configuration
│
├── server/                          # Node.js Backend
│   ├── .env                         # Server environment variables
│   ├── .env.example                 # Environment variable template
│   ├── index.js                     # Express server entry point
│   ├── package.json
│   ├── controllers/                 # Route handlers
│   │   ├── authController.js        # Authentication & JWT logic
│   │   ├── chatController.js        # Gemini AI integration
│   │   ├── notificationController.js # Notification logic
│   │   └── reportController.js      # X-ray analysis & reports
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification & RBAC
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # User model (bcrypt hashing)
│   │   ├── Report.js                # Medical report model
│   │   └── Notification.js          # Notification model
│   ├── routes/                      # API route definitions
│   │   ├── adminRoutes.js           # Admin endpoints
│   │   ├── authRoutes.js            # Auth endpoints
│   │   ├── chatRoutes.js            # Chat endpoints
│   │   ├── notificationRoutes.js    # Notification endpoints
│   │   └── reportRoutes.js          # Report endpoints
│   ├── ml_model/                    # Trained model weights
│   │   ├── classifier/
│   │   │   └── best_pneumonia_model.pt  # EfficientNet-B0 + CBAM
│   │   └── gate/
│   │       └── xray_gate_efficientnet_b0.pth  # X-ray gate model
│   ├── ml_service/                  # Python ML microservice
│   │   ├── main.py                  # FastAPI server with Grad-CAM
│   │   ├── pneumonia_network.py     # PyTorch model definition
│   │   ├── custom_model.py          # TensorFlow model (training)
│   │   ├── model_service.py         # Legacy Flask service
│   │   └── requirements.txt         # Python dependencies
│   └── uploads/                     # Uploaded X-ray images
│
├── .gitignore
└── README.md
```

---

## ⚠ Troubleshooting

| Issue                  | Solution                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Server won't start** | Ensure all required env vars are set in `server/.env`                                    |
| **503 from Chatbot**   | Gemini 2.5 Flash may be rate-limited. Wait a few minutes and retry.                      |
| **ML Service errors**  | Verify model files exist in `server/ml_model/` and Python dependencies are installed     |
| **CUDA not available** | The ML service falls back to CPU automatically. GPU is optional.                         |
| **Image rejected**     | The gate model may have classified the image as non-X-ray. Use a valid chest X-ray.      |
| **ML Service Error**   | Ensure PyTorch version matches the one used to train the model. Check `requirements.txt` |
| **404 Chat Error**     | Ensure the backend is running and `GEMINI_API_KEY` is set correctly in `.env`            |

---

## 📚 API Endpoints

### Chat & AI

- `POST /api/chat` — Interact with AI Assistant (supports `reportId` context and `language` param)

### Reports

- `POST /api/reports` — Create report (Doctor only)
- `GET /api/reports/my-reports` — Get patient's history
- `GET /api/reports/patient/:id` — Get specific patient history (Doctor only)

### ML Service

- `POST /predict` — Internal endpoint for image classification

---

## 👥 Team Members

| Name               | Roll No. |
| ------------------ | -------- |
| Nadish Acharya     | `211725` |
| Roshan Chaudhary   | `211731` |
| Sworup Raj Ghatani | `211743` |

---

## 🎓 Acknowledgement

This project was developed as a **Major Project (8th Semester)** in partial fulfillment of the requirements for the degree of **Bachelor in Software Engineering** at:

<div align="center">

**Nepal College of Information Technology (NCIT)**\
Lalitpur, Nepal\
Affiliated with **Pokhara University**

</div>

We extend our gratitude to our project supervisors and faculty members at NCIT for their guidance and support throughout the development of this project.

---

## 📄 License

This project is developed for academic purposes. All rights reserved.

Unauthorized commercial use, redistribution, or modification of the trained model weights is prohibited without explicit permission from the authors.

For academic or research inquiries, please contact any of the team members listed above.

---

<div align="center">

**Nepal College of Information Technology** · Pokhara University\
**BE Software Engineering — 8th Semester Major Project (2025–2026)**

</div>
