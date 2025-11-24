# TeamSphere Frontend Developer Guide

## Overview

The TeamSphere frontend is a modern React-based web application built with Vite, Material-UI, and React Query. It provides a comprehensive multi-tenant SaaS interface for employee management, time tracking, and HR operations.

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 18.2.0 with Vite 4.1.0
- **UI Library**: Material-UI (MUI) 5.11.10
- **State Management**: React Query 3.39.3
- **Routing**: React Router DOM 6.8.1
- **Internationalization**: React i18next 12.1.5
- **HTTP Client**: Axios 1.3.4
- **Forms**: React Hook Form 7.43.5
- **Charts**: Recharts 2.5.0
- **Date Handling**: Day.js 1.11.7

### Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx      # Main application layout
│   │   ├── ProtectedRoute.jsx # Route protection
│   │   └── CompanySelector.jsx # Multi-tenant company selector
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx # Authentication state
│   │   └── LanguageContext.jsx # Internationalization
│   ├── pages/              # Page components
│   │   ├── Login.jsx       # Authentication page
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   ├── AdminDashboard.jsx # Admin-specific dashboard
│   │   ├── HRDashboard.jsx # HR-specific dashboard
│   │   ├── EmployeeDashboard.jsx # Employee-specific dashboard
│   │   ├── Employees.jsx   # Employee management
│   │   ├── EmployeeDetail.jsx # Individual employee details
│   │   ├── Departments.jsx # Department management
│   │   ├── CompanyDirectory.jsx # Company directory
│   │   ├── TimeLogs.jsx    # Time tracking
│   │   ├── AttendanceManagement.jsx # Attendance management
│   │   ├── MyTimeHistory.jsx # Personal time history
│   │   ├── WorkdayReports.jsx # Workday reporting
│   │   ├── LeaveRequests.jsx # Leave management
│   │   ├── Tickets.jsx     # General tickets
│   │   ├── SupportTickets.jsx # Support ticket system
│   │   ├── AdminTicketManagement.jsx # Admin ticket management
│   │   ├── Notifications.jsx # Notification center
│   │   ├── Announcements.jsx # Company announcements
│   │   ├── AccessControl.jsx # Access control management
│   │   ├── DeviceManagement.jsx # Device management
│   │   ├── ReportsAnalytics.jsx # Reports and analytics
│   │   ├── Accounting.jsx   # Accounting features
│   │   ├── Profile.jsx     # User profile
│   │   ├── Settings.jsx    # Application settings
│   │   ├── AccountDetails.jsx # Account details
│   │   ├── CompanyManagement.jsx # Company management
│   │   ├── CompanySetupWizard.jsx # Company setup wizard
│   │   ├── Monitoring.jsx  # System monitoring
│   │   ├── SystemMonitoring.jsx # Advanced system monitoring
│   │   ├── ExcelImport.jsx  # Excel import functionality
│   │   ├── BulkEmployeeImport.jsx # Bulk employee import
│   │   ├── WikiViewer.jsx  # Wiki/documentation viewer
│   │   ├── BackupExport.jsx # Backup and export
│   │   └── Payment.jsx     # Payment processing
│   ├── services/           # API services
│   │   └── api.js         # HTTP client configuration
│   ├── locales/            # Translation files
│   │   ├── en.json        # English translations
│   │   └── tr.json        # Turkish translations
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   ├── index.css          # Global styles
│   └── i18n.js           # Internationalization setup
├── public/                # Static assets
├── dist/                 # Build output
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── Dockerfile           # Container configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on port 8080

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=TeamSphere
VITE_APP_VERSION=1.0.0
```

### Vite Configuration
The `vite.config.js` file contains:
- React plugin configuration
- Path aliases
- Build optimizations
- Proxy settings for development

## 🎨 UI Components

### Material-UI Theme
The application uses a custom Material-UI theme defined in `App.jsx`:

```javascript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
  }
})
```

### Key Components

#### Layout Component
- Provides consistent navigation and header
- Handles responsive design
- Manages sidebar state
- Integrates with authentication context

#### ProtectedRoute Component
- Wraps protected pages
- Redirects unauthenticated users
- Handles role-based access control

#### CompanySelector Component
- Multi-tenant company switching
- Integrates with backend tenant context
- Maintains user session across companies

## 📄 Page Components

### Authentication & User Management
- **Login.jsx**: User authentication page with email/password form
- **Profile.jsx**: User profile management and personal settings
- **AccountDetails.jsx**: Detailed account information and preferences
- **Settings.jsx**: Application-wide settings and configuration

### Dashboards (Role-Based)
- **Dashboard.jsx**: Main dashboard with overview widgets
- **AdminDashboard.jsx**: Admin-specific dashboard with system metrics
- **HRDashboard.jsx**: HR-focused dashboard with employee insights
- **EmployeeDashboard.jsx**: Employee dashboard with personal data

### Employee Management
- **Employees.jsx**: Employee list and management interface
- **EmployeeDetail.jsx**: Individual employee profile and details
- **Departments.jsx**: Department management and organization
- **CompanyDirectory.jsx**: Company-wide employee directory
- **BulkEmployeeImport.jsx**: Bulk employee import from Excel/CSV
- **ExcelImport.jsx**: General Excel import functionality

### Time & Attendance
- **TimeLogs.jsx**: Time tracking and clock in/out functionality
- **AttendanceManagement.jsx**: Attendance tracking and management
- **MyTimeHistory.jsx**: Personal time history and reports
- **WorkdayReports.jsx**: Workday analysis and reporting
- **LeaveRequests.jsx**: Leave request management and approval

### Support & Communication
- **Tickets.jsx**: General ticket system for internal requests
- **SupportTickets.jsx**: Customer support ticket management
- **AdminTicketManagement.jsx**: Administrative ticket oversight
- **Notifications.jsx**: Notification center and alerts
- **Announcements.jsx**: Company-wide announcements

### System Administration
- **CompanyManagement.jsx**: Multi-tenant company management
- **CompanySetupWizard.jsx**: New company onboarding wizard
- **AccessControl.jsx**: User access and permission management
- **DeviceManagement.jsx**: Device registration and management
- **Monitoring.jsx**: Basic system monitoring and health checks
- **SystemMonitoring.jsx**: Advanced system monitoring and metrics

### Reports & Analytics
- **ReportsAnalytics.jsx**: Comprehensive reporting dashboard
- **Accounting.jsx**: Financial and accounting features
- **BackupExport.jsx**: Data backup and export functionality

### Documentation & Utilities
- **WikiViewer.jsx**: Internal documentation and wiki system
- **Payment.jsx**: Payment processing and billing management

## 🔐 Authentication & Authorization

### AuthContext
The `AuthContext` provides:
- User authentication state
- Login/logout functionality
- Token management
- Role-based permissions

### Protected Routes
Routes are protected using the `ProtectedRoute` component:
```javascript
<Route path="employees" element={
  <ProtectedRoute requiredRole="HR">
    <Employees />
  </ProtectedRoute>
} />
```

### Role-Based Access
The application supports three user roles:
- **ADMIN**: Full system access
- **HR**: Employee and time management
- **EMPLOYEE**: Personal data and time tracking

## 🌐 Internationalization

### Setup
The application uses `react-i18next` for internationalization:
- English (en) - Default
- Turkish (tr) - Secondary language

### Adding Translations
1. Add translations to `src/locales/en.json` and `src/locales/tr.json`
2. Use the `useTranslation` hook in components:
```javascript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('welcome.title')}</h1>
}
```

## 📡 API Integration

### API Service
The `api.js` service provides:
- Axios instance with base configuration
- Request/response interceptors
- Error handling
- Token management

### React Query Integration
The application uses React Query for:
- Server state management
- Caching
- Background updates
- Optimistic updates

Example usage:
```javascript
import { useQuery } from 'react-query'
import { api } from '../services/api'

function EmployeesList() {
  const { data: employees, isLoading } = useQuery(
    'employees',
    () => api.get('/employees').then(res => res.data)
  )
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {employees.map(employee => (
        <div key={employee.id}>{employee.name}</div>
      ))}
    </div>
  )
}
```

## 📱 Responsive Design

### Breakpoints
The application uses Material-UI's responsive breakpoints:
- **xs**: 0px and up
- **sm**: 600px and up
- **md**: 900px and up
- **lg**: 1200px and up
- **xl**: 1536px and up

### Mobile-First Approach
- Components are designed mobile-first
- Progressive enhancement for larger screens
- Touch-friendly interfaces
- Optimized for tablet and desktop use

## 🧪 Testing

### Testing Strategy
- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for API calls
- E2E tests for critical user flows

### Running Tests
```bash
npm test
```

## 🚀 Deployment

### Docker Deployment
The application includes a `Dockerfile` for containerized deployment:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 80
CMD ["npm", "run", "preview"]
```

### Build Optimization
- Code splitting for better performance
- Tree shaking to reduce bundle size
- Asset optimization
- CDN integration ready

## 🔧 Development Guidelines

### Code Style
- Use functional components with hooks
- Prefer TypeScript for new components
- Follow Material-UI design patterns
- Use semantic HTML elements

### Component Structure
```javascript
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'

const MyComponent = ({ prop1, prop2 }) => {
  const { t } = useTranslation()
  
  return (
    <Box>
      <Typography variant="h1">
        {t('myComponent.title')}
      </Typography>
    </Box>
  )
}

export default MyComponent
```

### State Management
- Use React Query for server state
- Use React Context for global client state
- Use local state for component-specific state
- Avoid prop drilling

### Error Handling
- Implement error boundaries
- Use try-catch for async operations
- Provide user-friendly error messages
- Log errors for debugging

## 📊 Performance Optimization

### Best Practices
- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images and assets
- Use React Query's caching effectively

### Bundle Analysis
```bash
npm run build -- --analyze
```

## 🔍 Debugging

### Development Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Console logging for development

### Common Issues
1. **CORS Issues**: Ensure backend CORS is configured
2. **Authentication**: Check token expiration and refresh
3. **Routing**: Verify route protection and redirects
4. **API Calls**: Check network requests and responses

## 🆕 Recent Features (v2.1.0+)

### Company-Based Feature Flags

The frontend implements a comprehensive feature flag system that dynamically shows/hides pages based on company configuration.

#### FeatureFlagContext

The `FeatureFlagContext` provides global access to feature flags:

```javascript
import { useFeatureFlags } from '../contexts/FeatureFlagContext'

const MyComponent = () => {
  const { isPageEnabled, featureFlags, loading } = useFeatureFlags()
  
  // Check if a page is enabled
  if (!isPageEnabled('/accounting')) {
    return <Navigate to="/dashboard" />
  }
  
  return <div>Content</div>
}
```

**Features:**
- Automatic loading based on user's company
- Admin can view flags for selected company
- Route protection based on flags
- Sidebar menu filtering
- Default to enabled if flags not loaded

#### ProtectedRoute Integration

The `ProtectedRoute` component checks feature flags:

```javascript
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isPageEnabled } = useFeatureFlags()
  const location = useLocation()
  
  // Check feature flag
  if (!isPageEnabled(location.pathname)) {
    return <Navigate to="/dashboard" />
  }
  
  return children
}
```

#### Layout Sidebar Filtering

The sidebar automatically filters menu items based on feature flags:

```javascript
const filteredMenuItems = menuItems.filter(item => {
  // Check role-based access
  if (item.roles && !item.roles.includes(user?.role)) {
    return false
  }
  // Check feature flag access
  if (item.path && !isPageEnabled(item.path)) {
    return false
  }
  return true
})
```

### Wiki Page

The wiki page (`/wiki`) provides comprehensive documentation access for admins.

#### WikiViewer Component

The `WikiViewer` component displays all project documentation:

```javascript
const WikiViewer = () => {
  const [activeTab, setActiveTab] = useState('documentation')
  const [docFiles, setDocFiles] = useState([])
  const [wikiDocuments, setWikiDocuments] = useState([])
  
  // Fetches from:
  // - /api/documentation (documentation files)
  // - /admin/wiki (wiki articles)
}
```

**Features:**
- **Tabs**: Switch between "Documentation Files" and "Wiki Articles"
- **Search**: Real-time search across all documentation
- **Markdown Rendering**: Full markdown support with wiki styling
- **PDF Support**: Download buttons for PDF files
- **Swagger Link**: Direct link to Swagger API documentation
- **Categories**: Files organized by type (README, guides, PDFs, etc.)

**Access Control:**
- Admin-only access
- Protected route with `requiredRoles={['ADMIN']}`
- Component-level redirect for non-admins

#### Company Feature Flags Management

The `CompanyFeatureFlags` page allows admins to manage feature flags:

```javascript
const CompanyFeatureFlags = () => {
  // Company selector for admins
  // Toggle switches for each page
  // Save/refresh functionality
}
```

**Features:**
- Company selection (for admins viewing other companies)
- Toggle switches for all pages
- Real-time updates
- Visual feedback on changes

### Documentation Service

The frontend integrates with the backend documentation service:

```javascript
// services/featureFlags.js
export const getMyCompanyFeatureFlags = async () => {
  const response = await api.get('/company-features/my-company')
  return response.data.data
}

// services/documentation.js (if exists)
export const getDocumentationFiles = async () => {
  const response = await api.get('/documentation')
  return response.data.data
}
```

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Vite Documentation](https://vitejs.dev/)

### Useful Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

### Pull Request Process
1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Run linting and tests
5. Submit a pull request

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Components are properly tested
- [ ] API integration is correct
- [ ] UI is responsive and accessible
- [ ] Translations are added for new text
- [ ] Performance impact is considered

---

For more information, contact the development team or refer to the main project documentation.
