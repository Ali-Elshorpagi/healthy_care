# BelShefaa ISA - Healthcare Management System

A comprehensive healthcare management platform connecting patients, doctors, and administrators for rehabilitation and physiotherapy services.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

BelShefaa ISA is a modern healthcare management system designed to streamline the booking and management of rehabilitation services. The platform facilitates seamless interactions between patients, doctors, and administrators, making healthcare more accessible and efficient.

### Key Highlights
- **10,000+** Patients Recovered
- **500+** Verified Doctors
- **120+** Partner Clinics

## ✨ Features

### For Patients
- 👤 User registration and profile management
- 🔍 Browse and search for doctors and clinics
- 📅 Book appointments with available doctors
- 📊 View medical records
- ⭐ Rate and review doctors
- 📱 Responsive dashboard

### For Doctors
- 📋 Manage patient appointments
- 🗓️ Set weekly availability schedules
- 📝 Create and update medical records
- 👥 View patient history
- 📊 Track appointments and schedules
- 🔔 Real-time appointment notifications

### For Administrators
- 🛠️ Manage users (patients, doctors)
- 📈 View system statistics
- 📊 Monitor appointments
- 🔐 Access control and permissions
- 📉 Generate reports

## 🛠️ Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- JSON Server (Mock REST API)
- Multiple database files for different entities

### Authentication
- SHA-256 password hashing
- Session storage
- Cookie-based "Remember Me"

## 📁 Project Structure

```
healthy_care/
├── index.html                 # Landing page
├── Src/
│   ├── components/
│   │   ├── auth/             # Login & Registration
│   │   ├── patient/          # Patient features
│   │   ├── doctor/           # Doctor features
│   │   ├── admin/            # Admin dashboard
│   │   ├── Contact/          # Contact page
│   │   ├── About_us/         # About page
│   │   └── FAQs/             # FAQ section
│   ├── database/             # JSON database files
│   │   ├── users.json
│   │   ├── appointments.json
│   │   ├── medical_records.json
│   │   ├── schedules.json
│   │   ├── ratings.json
│   │   └── faqs.json
│   ├── shared/               # Shared components
│   ├── utilities/            # Utility functions
│   └── models/               # Data models
├── scripts/                  # Server startup scripts
└── Styles/                   # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v12 or higher)
- npm or yarn
- JSON Server

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/healthy_care.git
   cd healthy_care
   ```

2. **Install JSON Server globally** (if not already installed)
   ```bash
   npm install -g json-server
   ```

3. **Start the database servers**
   
   **Windows:**
   ```bash
   start-json-servers.bat
   ```
   
   **Or manually start each server:**
   ```bash
   json-server --watch Src/database/users.json --port 8877
   json-server --watch Src/database/appointments.json --port 8876
   json-server --watch Src/database/ratings.json --port 8874
   json-server --watch Src/database/medical_records.json --port 8875
   json-server --watch Src/database/schedules.json --port 8873
   json-server --watch Src/database/faqs.json --port 8872
   ```

4. **Open the application**
   - Open `index.html` in your browser
   - Or use a local server (e.g., Live Server in VS Code)

### Default Credentials

**Admin:**
- Email: `admin@belshefaa.com`
- Password: `123`

**Test Patient:**
- Email: `ali@gmail.com`
- Password: `123`

## 👥 User Roles

### Patient
- Register and manage profile
- Book appointments with doctors
- View appointment history
- Access medical records
- Rate doctors

### Doctor
- Manage appointment requests
- Set weekly availability
- Create medical records
- View patient information
- Update profile

### Administrator
- Full system access
- User management
- System monitoring
- Data analytics

## 🔌 API Endpoints

### Users API (Port 8877)
```
GET    /users              # Get all users
GET    /users/:id          # Get user by ID
POST   /users              # Create new user
PUT    /users/:id          # Update user
DELETE /users/:id          # Delete user
```

### Appointments API (Port 8876)
```
GET    /appointments       # Get all appointments
GET    /appointments/:id   # Get appointment by ID
POST   /appointments       # Create appointment
PUT    /appointments/:id   # Update appointment
DELETE /appointments/:id   # Delete appointment
```

### Medical Records API (Port 8875)
```
GET    /medicalRecords     # Get all records
POST   /medicalRecords     # Create record
PUT    /medicalRecords/:id # Update record
```

### Schedules API (Port 8873)
```
GET    /schedules          # Get all schedules
POST   /schedules          # Create schedule
PUT    /schedules/:id      # Update schedule
```

### Ratings API (Port 8874)
```
GET    /ratings            # Get all ratings
POST   /ratings            # Create rating
```

### FAQs API (Port 8872)
```
GET    /faqs               # Get all FAQs
POST   /faqs               # Create FAQ
PUT    /faqs/:id           # Update FAQ
```

## 🔐 Security Features

- Password hashing using SHA-256
- Session-based authentication
- Cookie encryption for "Remember Me"
- Role-based access control
- Input validation and sanitization

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- 💻 Desktop (1920px and above)
- 💻 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (320px - 768px)

## 🎨 UI/UX Features

- Modern, clean interface
- Intuitive navigation
- Real-time updates
- Loading states
- Error handling
- Success notifications

## 🧪 Testing

### Manual Testing
1. Start all JSON servers
2. Open the application
3. Test each user role:
   - Register as a patient
   - Login as a doctor
   - Login as an admin

### Test Scenarios
- User registration and login
- Appointment booking flow
- Doctor schedule management
- Medical record creation
- Profile updates

## 🔄 Database Schema

### Users
```json
{
  "id": "string",
  "role": "patient|doctor|admin",
  "fullName": "string",
  "email": "string",
  "password": "string (hashed)",
  "appointments": ["array of appointment IDs"],
  "medicalRecords": ["array of record IDs"],
  "createdAt": "timestamp"
}
```

### Appointments
```json
{
  "id": "string",
  "patientId": "string",
  "doctorId": "string",
  "date": "string",
  "time": "string",
  "status": "pending|confirmed|completed|cancelled",
  "reason": "string",
  "createdAt": "timestamp"
}
```

## 🛣️ Roadmap

- [ ] Real-time chat between patients and doctors
- [ ] Email notifications
- [ ] Payment integration
- [ ] Mobile app (React Native)
- [ ] Telemedicine video calls
- [ ] Prescription management
- [ ] Insurance integration

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Development Team

- **Project Name:** BelShefaa ISA Healthcare System
- **Version:** 1.0.0
- **Last Updated:** January 2026

---

**Note:** This is a learning project using JSON Server as a mock backend. For production use, implement a proper backend with a real database and enhanced security features.