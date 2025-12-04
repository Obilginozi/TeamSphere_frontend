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
- ✅ **Role-based Access Control** - Admin, HR, Department Manager, Employee roles with granular permissions
- ✅ **QR Code Generation** - ISO/IEC 18004 compliant QR codes with company logo embedding and auto-refresh
- ✅ **Device Management** - HR interface for matching employee devices with UUID validation
- ✅ **Access Control** - QR code generator and device matching interface
- ✅ **Time Tracking** - Clock in/out with various methods (NFC, QR Code, Manual)
- ✅ **Leave Management** - Request, approve, track leaves with comprehensive reason tracking
- ✅ **Employee Management** - CRUD operations for employees with bulk import
- ✅ **Support Tickets** - Internal ticketing system with SLA management and trend analysis
- ✅ **Reports & Analytics** - Export to PDF/Excel with customizable dashboards
- ✅ **Department Management** - Department-based announcements, employee management, and ticket routing
- ✅ **Profile Approval System** - HR approval workflow for employee and department manager profile changes
- ✅ **Company Feature Flags** - Dynamic feature toggling per company with XML-based configuration
- ✅ **Shift Management** - 24-hour operations support with shift scheduling and rotation
- ✅ **Company Calendar** - Event management, meetings, training, and holidays
- ✅ **Accounting Integration** - Employee accounting and payment management
- ✅ **Notifications** - Real-time notifications for tickets, leaves, and announcements
- ✅ **System Monitoring** - Health checks, metrics, and performance monitoring

### Advanced Features

- ✅ **Fraud Detection** - Comprehensive fraud detection with geofencing, velocity checks, and device fingerprinting
- ✅ **Trend Analysis** - Ticket trend analysis with predictive analytics (7/30/90 day comparisons)
- ✅ **Bulk Operations** - Excel import/export for employees with validation and error handling
- ✅ **Multi-language Support** - i18n ready with English and Turkish support
- ✅ **Responsive Design** - Mobile-first responsive design with PWA capabilities
- ✅ **Dynamic Clock-In Methods** - Company-configurable clock-in methods with automatic selection
- ✅ **Department-Based Features** - Department managers can manage their department, send announcements, and handle tickets

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
│   │   ├── ProfileApprovals.jsx    # HR profile approval interface
│   │   ├── CompanyFeatureFlags.jsx # Company feature flag management
│   │   ├── ShiftManagement.jsx     # Shift scheduling and management
│   │   ├── CompanyCalendar.jsx     # Company calendar and events
│   │   ├── Tickets.jsx              # Support ticket management
│   │   ├── LeaveRequests.jsx       # Leave request management
│   │   ├── ReportsAnalytics.jsx    # Reports and analytics dashboard
│   │   └── ...
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.jsx         # Authentication context
│   │   ├── LanguageContext.jsx     # i18n context
│   │   └── FeatureFlagContext.jsx  # Company feature flags context
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

### ProfileApprovals Page

HR interface for managing employee and department manager profile change requests:

**Features:**
- View all pending profile change requests
- See detailed changes (current vs. requested values)
- Approve or reject requests with optional review notes
- View complete history of all profile change requests
- Automatic application of approved changes

**Usage:**
```jsx
// Navigate to /profile-approvals
// Available for HR and ADMIN roles only
```

### CompanyFeatureFlags Page

Admin interface for managing company-specific feature flags:

**Features:**
- Enable/disable features per company
- XML-based feature flag storage
- Dynamic route protection based on flags
- Sidebar menu filtering
- Real-time feature flag updates

**Usage:**
```jsx
// Navigate to /company-feature-flags
// Available for ADMIN role only
```

### Department Manager Features

Department Managers have unique capabilities combining employee and management roles:

**Employee Capabilities:**
- Clock in/out using NFC, QR Code, or Manual methods
- View personal time logs and leave requests
- Access personal profile and device management

**Management Capabilities:**
- **Department Announcements**: Send announcements to department employees
- **Employee Management**: View and manage employees in assigned department
- **Hiring**: Create new employees (automatically assigned to their department)
- **Ticket Management**: Receive and respond to tickets from department employees
- **Department Isolation**: All interactions restricted to their department only
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

- **[Frontend Developer Guide](FRONTEND_DEVELOPER_GUIDE.md)** - Complete React development guide
- **[Backend API Documentation](../backend/POSTMAN_API_TESTING_GUIDE.md)** - API testing guide
- **[Validation Guide](VALIDATION_GUIDE.md)** - Form validation patterns
- **[Main Project README](../README.md)** - Complete project documentation

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
**Version**: 3.1.0

### Recent Updates (v3.1.0)

#### ✨ New Features
- ✨ **Department Manager Role**: New role for department-level management
  - Department managers can send announcements to their department employees
  - Manage employees within their assigned department
  - Handle tickets from department employees
  - Create tickets to HR (not to Admin)
  - Perform hiring operations for their department
- ✨ **Profile Approval System**: HR review and approval workflow for employee profile changes
  - Employees and Department Managers submit profile change requests
  - HR reviews and approves/rejects changes through dedicated interface
  - Complete change history tracking with review notes
- ✨ **Company Feature Flags**: Dynamic feature toggling per company
  - XML-based feature flag storage
  - Dynamic route protection based on flags
  - Sidebar menu filtering
- ✨ **Shift Management**: 24-hour operations support with shift scheduling
- ✨ **Company Calendar**: Event management, meetings, training, and holidays
- ✨ **Trend Analysis**: Ticket trend analysis with predictive analytics
- ✨ **Fraud Detection**: Comprehensive fraud detection interface

#### 🔧 Improvements
- 🔧 **QR Code Display Component**: Reusable component with download and refresh
- 🔧 **Access Control Page**: QR generator and device matching interface
- 🔧 **Device Matching**: HR can match employee devices with UUID validation
- 🔧 **API Path Fixes**: Resolved double `/api/api` path issues
- 📝 **Enhanced Error Handling**: Better user feedback and error messages
- 📝 **Console Log Cleanup**: Removed unnecessary console.log statements for production

### Previous Updates (v2.1.0)

- ✨ **QR Code Display Component**: Reusable component with download and refresh
- ✨ **Access Control Page**: QR generator and device matching interface
- ✨ **Device Matching**: HR can match employee devices with UUID validation
- 🔧 **API Path Fixes**: Resolved double `/api/api` path issues
- 📝 **Enhanced Error Handling**: Better user feedback and error messages
