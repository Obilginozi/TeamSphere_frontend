# TeamSphere Frontend

React 18 frontend application for the TeamSphere HR & time tracking platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

**Access Point:**
- 🌐 **Web App**: http://localhost:5173

## 📋 Features

### Core Features
- ✅ **Multi-tenant Architecture** - Support multiple companies with data isolation
- ✅ **Role-based Access Control** - Admin, HR, Employee roles with granular permissions
- ✅ **QR Code Generation** - ISO/IEC 18004 compliant QR codes with company logo embedding
- ✅ **Device Management** - HR interface for matching employee devices with UUID validation
- ✅ **Access Control** - QR code generator and device matching interface
- ✅ **Time Tracking** - Clock in/out with various methods
- ✅ **Leave Management** - Request, approve, track leaves
- ✅ **Employee Management** - CRUD operations for employees
- ✅ **Support Tickets** - Internal ticketing system
- ✅ **Reports & Analytics** - Export to PDF/Excel

### New Features (v2.1.0)

- ✨ **QR Code Display Component**: Reusable component for displaying QR codes with download and refresh
- ✨ **Access Control Page**: 
  - QR Code Generator tab for generating employee QR codes
  - Device Matching tab for HR to match employee devices
  - Warning system for employees without registered devices
  - UUID validation for device IDs
- ✨ **API Path Fixes**: Resolved double `/api/api` path issues
- ✨ **Enhanced Error Handling**: Improved error messages and user feedback

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Context API + React Query
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Internationalization**: i18next (English & Turkish)
- **QR Code**: `qrcode.react` library

### Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── QRCodeDisplay.jsx      # QR code display with download
│   │   ├── Layout.jsx              # Main layout wrapper
│   │   ├── ProtectedRoute.jsx     # Route protection
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── AccessControl.jsx       # QR generator & device matching
│   │   ├── Employees.jsx           # Employee management
│   │   ├── DeviceManagement.jsx    # Device management
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx         # Authentication context
│   │   └── LanguageContext.jsx     # i18n context
│   ├── services/           # API services
│   │   └── api.js                 # Axios instance & API calls
│   ├── utils/              # Utility functions
│   ├── locales/            # Translation files
│   │   ├── en.json
│   │   └── tr.json
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── public/                 # Static assets
└── package.json           # Dependencies
```

## 🔌 API Integration

### Base Configuration
```javascript
// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### Key API Endpoints Used

#### QR Code Endpoints
```javascript
// Get QR code image (Base64)
GET /api/access/qr-code/{employeeId}/image?width=300&height=300

// Download QR code as PNG
GET /api/access/qr-code/{employeeId}/download?width=300&height=300

// Get employee QR code
GET /api/employee/{id}/qr-code?width=300&height=300
```

#### Device Management Endpoints
```javascript
// Get employees with device status (HR/Admin)
GET /api/devices/employees/status

// Get employees without devices (HR/Admin)
GET /api/devices/employees/without-devices

// Match employee with device (HR/Admin)
POST /api/devices/match-employee
{
  "employeeId": 12,
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Samsung Galaxy S23",
  "deviceType": "MOBILE"
}
```

**Note**: All API paths use `/api` prefix. The backend context path is configured to avoid double `/api/api` issues.

## 🧩 Key Components

### QRCodeDisplay Component

A reusable component for displaying QR codes with download and refresh functionality:

```jsx
import QRCodeDisplay from '../components/QRCodeDisplay'

<QRCodeDisplay 
  employeeId={11} 
  size={300} 
  showDownload={true} 
/>
```

**Features:**
- Fetches QR code from backend (includes company logo)
- Auto-refresh support
- Download as PNG
- Error handling
- Loading states

**Props:**
- `employeeId` (number, required) - Employee ID
- `size` (number, optional, default: 300) - QR code size in pixels
- `showDownload` (boolean, optional, default: false) - Show download button

### AccessControl Page

Main page for QR code generation and device matching (HR/Admin only):

**Features:**
- **QR Code Generator Tab:**
  - Employee selection dropdown
  - QR code display with download
  - ISO/IEC 18004 standard compliance info

- **Device Matching Tab:**
  - Table showing all employees with device status
  - Warning banner for employees without devices
  - "Match Device" dialog with UUID validation
  - Device registration form

**Usage:**
```jsx
// Navigate to /access-control
// Available for HR and ADMIN roles only
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:8080/api
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false

# Internationalization
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,tr
```

### API Base URL

The API base URL is configured in `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  // ...
})
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 📦 Dependencies

### Key Dependencies
- `react` (^18.2.0) - React library
- `react-dom` (^18.2.0) - React DOM renderer
- `react-router-dom` (^6.x) - Routing
- `@mui/material` (^5.x) - Material-UI components
- `@mui/icons-material` (^5.x) - Material-UI icons
- `axios` (^1.x) - HTTP client
- `i18next` (^23.x) - Internationalization
- `qrcode.react` (^1.0.0) - QR code generation (client-side fallback)

## 🚨 Troubleshooting

### API Connection Issues
```bash
# Check if backend is running
curl http://localhost:8080/api/health

# Check API base URL in .env
cat .env | grep VITE_API_URL
```

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Port Conflicts
```bash
# Check if port 5173 is in use
lsof -i :5173

# Kill process using port
kill -9 $(lsof -t -i:5173)
```

## 📚 Documentation

- **[Frontend Developer Guide](../infrastructure/docs/FRONTEND_DEVELOPER_GUIDE.md)** - Complete React development guide
- **[Backend API Documentation](../backend/POSTMAN_API_TESTING_GUIDE.md)** - API testing guide
- **[Validation Guide](VALIDATION_GUIDE.md)** - Form validation patterns

## 🔐 Security

### Authentication
- JWT tokens stored in localStorage
- Automatic token refresh
- Protected routes with role-based access

### API Security
- All API calls include JWT token in Authorization header
- CORS configured on backend
- Input validation on both frontend and backend

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Last Updated**: January 2025  
**Version**: 2.1.0

### Recent Updates (v2.1.0)

- ✨ **QR Code Display Component**: Reusable component with download and refresh
- ✨ **Access Control Page**: QR generator and device matching interface
- ✨ **Device Matching**: HR can match employee devices with UUID validation
- 🔧 **API Path Fixes**: Resolved double `/api/api` path issues
- 📝 **Enhanced Error Handling**: Better user feedback and error messages
