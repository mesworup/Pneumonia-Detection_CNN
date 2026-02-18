# Pneumonia Detection API Documentation

This document lists all available API endpoints for the Pneumonia Detection System and provides instructions on how to test them using Postman.

## Base URLs
- **Main Server (Node.js)**: `http://localhost:5000`
- **ML Service (FastAPI)**: `http://localhost:8000`

---

## Postman Setup Guide

1.  **Create a New Collection**: Open Postman, click "Collections" > "+", and name it "Pneumonia Detection".
2.  **Set Environment Variables** (Optional but Recommended):
    -   Create a new environment (e.g., "Local Dev").
    -   Add variable `baseUrl` with value `http://localhost:5000`.
    -   Add variable `token` (leave empty for now, you will paste the JWT token here after login).
    -   Use `{{baseUrl}}` in your requests (e.g., `{{baseUrl}}/api/auth/login`).

---

## 1. Authentication APIs (`/api/auth`)

### Register User
*Create a new account (Patient or Doctor).*
-   **Method**: `POST`
-   **URL**: `{{baseUrl}}/api/auth/register`
-   **Body** (JSON):
    ```json
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123"
        // role defaults to "patient". Admin can change it later.
    }
    ```
-   **Response**: Returns user details and `token`. Copy this `token` for subsequent requests.

### Login User
*Login to get a JWT token.*
-   **Method**: `POST`
-   **URL**: `{{baseUrl}}/api/auth/login`
-   **Body** (JSON):
    ```json
    {
        "email": "john@example.com",
        "password": "password123"
    }
    ```
-   **Response**: Returns user details and `token`.

### Get Profile
*Get current user details.*
-   **Method**: `GET`
-   **URL**: `{{baseUrl}}/api/auth/profile`
-   **Headers**: 
    -   `Authorization`: `Bearer <YOUR_TOKEN_HERE>`

### Update Password
-   **Method**: `PUT`
-   **URL**: `{{baseUrl}}/api/auth/password`
-   **Headers**: `Authorization`: `Bearer <YOUR_TOKEN_HERE>`
-   **Body** (JSON):
    ```json
    {
        "oldPassword": "password123",
        "newPassword": "newpassword123"
    }
    ```

---

## 2. Report APIs (`/api/reports`)
**Note**: Most of these require a Doctor account (role=`doctor`).

### Analyze X-Ray (Preview)
*Upload an X-ray image for ML analysis without saving it.*
-   **Method**: `POST`
-   **URL**: `{{baseUrl}}/api/reports/analyze`
-   **Headers**: `Authorization`: `Bearer <DOCTOR_TOKEN>`
-   **Body** (form-data):
    -   Key: `image` | Type: `File` | Value: (Select an X-ray image)

### Create Report
*Finalize analysis and save to database.*
-   **Method**: `POST`
-   **URL**: `{{baseUrl}}/api/reports`
-   **Headers**: `Authorization`: `Bearer <DOCTOR_TOKEN>`
-   **Body** (JSON):
    ```json
    {
        "patientId": "658... (Patient User ID)",
        "prediction": "Pneumonia",
        "confidence": 0.95,
        "boxes": [{"x": 0.1, "y": 0.1, "width": 0.2, "height": 0.2, "confidence": 0.8}],
        "imageUrl": "/uploads/170...jpg",
        "notes": "Patient shows signs of consolidation.",
        "heatmap": "base64_string..."
    }
    ```

### Get My Reports (Patient Dashboard)
*Patient views their own reports.*
-   **Method**: `GET`
-   **URL**: `{{baseUrl}}/api/reports/my-reports`
-   **Headers**: `Authorization`: `Bearer <PATIENT_TOKEN>`

### Get Patients List (Doctor Dashboard)
-   **Method**: `GET`
-   **URL**: `{{baseUrl}}/api/reports/patients`
-   **Headers**: `Authorization`: `Bearer <DOCTOR_TOKEN>`

### Get Specific Patient Reports
-   **Method**: `GET`
-   **URL**: `{{baseUrl}}/api/reports/patient/:id` (Replace `:id` with Patient ID)
-   **Headers**: `Authorization`: `Bearer <DOCTOR_TOKEN>`

---

## 3. Chat APIs (`/api/chat`)

### AI Chat / Analyze Report
*Ask AI questions about a specific report.*
-   **Method**: `POST`
-   **URL**: `{{baseUrl}}/api/chat`
-   **Headers**: `Authorization`: `Bearer <TOKEN>`
-   **Body** (JSON):
    ```json
    {
        "reportId": "658... (Report ID)",
        "message": "What does this result mean?",
        "language": "en" 
    }
    ```
    *Note: `language` can be "en" (English) or "np" (Nepali).*

---

## 4. Admin APIs (`/api/admin`)
**Note**: Requires `admin` role.

### Get All Users
-   **Method**: `GET`
-   **URL**: `{{baseUrl}}/api/admin/users`
-   **Headers**: `Authorization`: `Bearer <ADMIN_TOKEN>`

### Change User Role
-   **Method**: `PUT`
-   **URL**: `{{baseUrl}}/api/admin/users/:id/role`
-   **Headers**: `Authorization`: `Bearer <ADMIN_TOKEN>`
-   **Body** (JSON):
    ```json
    { "role": "doctor" }
    ```

---

## 5. ML Service (`http://localhost:8000`)
*Direct access to the Python ML microservice (usually called internally by the Node server).*

### Health Check
-   **Method**: `GET`
-   **URL**: `http://localhost:8000/health`

### Predict (Direct)
-   **Method**: `POST`
-   **URL**: `http://localhost:8000/predict`
-   **Body** (form-data):
    -   Key: `file` | Type: `File` | Value: (Select image)
