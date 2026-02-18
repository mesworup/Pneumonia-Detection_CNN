# PneumoDetect - AI-Powered Pneumonia Detection System
 A comprehensive web application for detecting pneumonia from chest X-ray images using Deep Learning (CNN), enhanced with an AI Medical Assistant (Google Gemini) for patient interactions <!-- and bilingual support (English/Nepali). -->
## 🚀 Key Features
### 🧠 Advanced AI & ML
*   **Pneumonia Detection**: Custom CNN model trained on 5000+ chest X-rays to classify images as "Pneumonia" or "Normal" with high accuracy.
*   **AI Medical Assistant**: Integrated **Google Gemini AI (gemini-2.5-flash)** chatbot that provides personalized explanations of medical reports, answers health queries, and offers wellness tips.
*   **Context-Aware Analysis**: The chatbot understands the specific context of the user's report (Diagnosis, Confidence, Doctor's Notes).
<!-- ### 🌍 Internationalization (i18n)
*   **Bilingual UI**: Fully localized interface for **English (EN)** and **Nepali (NP)**.
*   **Localized AI Responses**: The AI assistant responds in the selected language (Devanagari script for Nepali) while maintaining professional tone and medical safety guardrails. -->
### 📋 Report Management
*   **Smart PDF Reporting**: Auto-generate comprehensive PDF reports with diagnosis visualization, confidence scores, and doctor's clinical notes.
*   **Role-Based Dashboards**: 
    *   **Doctor**: Upload X-rays, review analysis, add notes, and submit reports.
    *   **Patient**: View history, download PDFs, and chat with AI about results.
    *   **Admin**: Manage users and system settings.
### 🔒 Security
*   **JWT Authentication**: Secure login and session management.
*   **Role-Based Access Control (RBAC)**: Strict route protection for different user types.
---
## 🛠️ Technology Stack
*   **Frontend**: React.js, Vite, Context API (Auth & Language), CSS3
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB (Mongoose)
*   **ML Service**: Python, Flask, TensorFlow/Keras
*   **AI Integration**: Google Generative AI SDK (@google/generative-ai)
---
## ⚙️ Setup Instructions
### 1. Prerequisites
*   Node.js (v16+)
*   Python (3.8+)
*   MongoDB Atlas Account
*   Google Gemini API Key
### 2. Model Setup
Place your trained model files in:
```
server/ml_model/classifier/best_pneumonia_model.pth  (DenseNet121 classifier)
server/ml_model/detector/best.pt                     (YOLOv11m detector)
server/ml_model/gate/xray_gate_efficientnet_b0.pth    (EfficientNet-B0 gate model, optional)
```
### 3. Installation
**Install Python Dependencies (ML Service):**
```bash
cd server/ml_service
pip install -r requirements.txt
```
**Install Node.js Dependencies (Backend & Frontend):**
```bash
# Backend
cd server
npm install
# Frontend
cd ../client
npm install
```
### 4. Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
ADMIN_PASSWORD=your_secure_admin_password_here
```
**Note:** `GEMINI_API_KEY` and `ADMIN_PASSWORD` are required. The application will fail to start if `GEMINI_API_KEY` is missing.
---
## ▶️ Running the Application
### The Easy Way (Concurrent)
We have configured a command to run the Backend and ML Service simultaneously from the server directory:

**Backend**
```bash
cd server
npm run dev:all
```
**Frontend**
```bash
cd client
npm run dev
```

*   **Frontend**: http://localhost:5173
*   **Backend**: http://localhost:5000
*   **ML Service**: http://localhost:8000
### Manual Start (Separate Terminals)
1.  **ML Service**: `cd server/ml_service && python main.py`
2.  **Backend**: `cd server && npm run dev`
3.  **Frontend**: `cd client && npm run dev`
---
## 🧪 Testing the Flow
1.  **Login as Doctor**: Upload a chest X-ray image.
2.  **Analyze**: System uses CNN to predict Pneumonia/Normal.
3.  **Submit**: Save the report with notes.
4.  **Login as Patient**: View the new report.
5.  **Analyize with AI**: Click "Analyze with AI" to chat with the Gemini assistant about the result.
6.  **Switch Language**: Toggle 'NP' in the dashboard to see the interface and AI responses in Nepali.
7.  **Download**: Generate a PDF copy of the report.
---
## ⚠️ Troubleshooting
*   **503 Service Unavailable (Chatbot)**: The Gemini 2.5 Flash model might be overloaded. Wait a few minutes and try again.
*   **ML Service Error**: Ensure TensorFlow matches the version used to train the model. Check `server/ml_service/requirements.txt`.
*   **404 Chat Error**: Ensure the backend is running and `GEMINI_API_KEY` is set correctly in `.env`.
---
## 📚 API Endpoints
### Chat & AI
*   `POST /api/chat` - Interact with AI Assistant (Supports `reportId` context and `language` param)
### Reports
*   `POST /api/reports` - Create report (Doctor only)
*   `GET /api/reports/my-reports` - Get patient's history
*   `GET /api/reports/patient/:id` - Get specific patient history (Doctor only)
### ML Service
*   `POST /predict` - Internal endpoint for image classification
