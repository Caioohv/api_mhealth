# API Reference - mHealth

Welcome to the mHealth API documentation. This API provides the backend infrastructure for a comprehensive health monitoring and support network platform.

## 🟢 Base URL
`http://localhost:3000` (Development)

---

## 🔐 Authentication

All private endpoints require a Bearer token in the `Authorization` header.

### Register
`POST /auth/register`
- **Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword",
    "name": "Full Name",
    "phone": "5511999999999"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "user": { "id": "uuid", "email": "...", "name": "..." },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token"
  }
  ```

### Login
`POST /auth/login`
- **Body**: `{ "email": "...", "password": "..." }`

### Google Login/Register
`POST /auth/google`
- **Body**: `{ "idToken": "google_token" }`

---

## 🌐 Support Networks

Networks are the core container for all data. A network is usually centered around one "Assistido" (Patient).

### Create Network
`POST /api/networks`
- **Body**: `{ "name": "Rede Dona Maria", "description": "Cuidados diários" }`

### Get My Permissions
`GET /api/networks/:id/permissions`
- **Description**: Returns the current user's membership details and permission levels for the network.

---

## 👥 Members & Permissions

### Update Member
`PATCH /api/networks/:id/members/:memberId`
- **Body**: 
  ```json
  {
    "role": "RESPONSAVEL",
    "medicationAccess": "EDIT",
    "consultationAccess": "VIEW",
    "networkAccess": "NONE",
    "recordsAccess": "EDIT",
    "alertLevel": "ALL"
  }
  ```
- **Enum Values**:
  - `role`: `RESPONSAVEL`, `ASSISTIDO`
  - `AccessLevels`: `NONE`, `VIEW`, `EDIT`
  - `alertLevel`: `ALL`, `EMERGENCY_ONLY`, `NONE`

---

## 💊 Medication Module

### Record Intake
`POST /api/medications/:id/intakes`
- **Body**: `{ "status", "notes", "takenAt" }`
- **Status**: `TAKEN`, `MISSED`, `LATE`

### Toggle Need Buy
`PATCH /api/medications/:id/toggle-buy`
- **Body**: `{ "needsBuy": true }`

### List Medications to Buy
`GET /api/networks/:id/medications/to-buy`

### Get Medication Alerts
`GET /api/networks/:id/medications/alerts`
- **Description**: Returns automated alerts for late doses or medications that need buying.

---

## 📈 Habits & Records

### Create Habit
`POST /api/networks/:id/habits`
- **Body**: 
  ```json
  {
    "name": "Caminhada",
    "frequency": "DAILY",
    "goal": 30,
    "unit": "minutos"
  }
  ```
- **Frequency**: `DAILY`, `WEEKLY`, `CUSTOM`

---

## 🚨 Emergency (SOS)

### Trigger Alerta
`POST /api/networks/:id/emergency`
- **Body**: `{ "message": "Estou me sentindo mal" }`
- **Response**: 
  ```json
  {
    "alert": { "id": "...", "status": "ACTIVE", ... },
    "notifiedMembers": [ { "id": "...", "name": "...", "phone": "..." } ]
  }
  ```

---

## 📊 Dashboards & Intelligence

### Patient Dashboard
`GET /api/networks/:id/dashboard/patient`
- **Goal**: "What to do now?"
- **Response**: 
  ```json
  {
    "todayMedications": [
      { "id": "uuid", "name": "...", "time": "08:00", "dosage": "...", "taken": true },
      ...
    ],
    "pendingHabits": [...],
    "upcomingConsultations": [...]
  }
  ```

### Unified Agenda
`GET /api/networks/:id/agenda`
- **Query Params**: `days` (default 7), `startDate` (ISO date)
- **Response**: Object keyed by date, containing sorted medications and consultations.
  ```json
  {
    "2024-04-12": [
      { "type": "MEDICATION", "id": "...", "name": "...", "time": "...", "taken": false },
      { "type": "CONSULTATION", "id": "...", "name": "...", "time": "..." }
    ],
    ...
  }
  ```

### Unified Timeline
`GET /api/networks/:id/timeline`
- **Query Params**: `limit` (default 50), `offset` (default 0)
- **Response**: Unified chronological feed of Intakes, Occurrences, Habits, and Alerts.

### Adherence Report
`GET /api/networks/:id/reports/adherence?days=30`
- **Response**: Adherence rate per medication and global stats.
