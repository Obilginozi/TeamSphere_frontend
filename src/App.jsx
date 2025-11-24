import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from 'react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { FeatureFlagProvider } from './contexts/FeatureFlagContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import TimeLogs from './pages/TimeLogs'
import LeaveRequests from './pages/LeaveRequests'
import Tickets from './pages/Tickets'
import GeneralTickets from './pages/GeneralTickets'
import AccessControl from './pages/AccessControl'
import Accounting from './pages/Accounting'
import Profile from './pages/Profile'
import CompanyManagement from './pages/CompanyManagement'
import Monitoring from './pages/Monitoring'
import AccountDetails from './pages/AccountDetails'
import WorkdayReports from './pages/WorkdayReports'
import CompanySelector from './components/CompanySelector'
import ProtectedRoute from './components/ProtectedRoute'
import SystemMonitoring from './pages/SystemMonitoring'
import AdminDashboard from './pages/AdminDashboard'
import ExcelImport from './pages/ExcelImport'
import WikiViewer from './pages/WikiViewer'
import BackupExport from './pages/BackupExport'
import AdminTicketManagement from './pages/AdminTicketManagement'
import HRDashboard from './pages/HRDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployeeDetail from './pages/EmployeeDetail'
import DeviceManagement from './pages/DeviceManagement'
import Departments from './pages/Departments'
import Notifications from './pages/Notifications'
import ReportsAnalytics from './pages/ReportsAnalytics'
import Announcements from './pages/Announcements'
import Settings from './pages/Settings'
import AttendanceManagement from './pages/AttendanceManagement'
import MyTimeHistory from './pages/MyTimeHistory'
import CompanySetupWizard from './pages/CompanySetupWizard'
import BulkEmployeeImport from './pages/BulkEmployeeImport'
import Payment from './pages/Payment'
import CompanyDirectory from './pages/CompanyDirectory'
import CompanyEdit from './pages/CompanyEdit'
import CompanyFeatureFlags from './pages/CompanyFeatureFlags'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const currentLanguage = localStorage.getItem('language') || 'en'
  // Set dayjs locale globally
  dayjs.locale(currentLanguage === 'tr' ? 'tr' : 'en')
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={currentLanguage === 'tr' ? 'tr' : 'en'}>
          <LanguageProvider>
            <Router>
              <AuthProvider>
                <FeatureFlagProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Role-specific Dashboards */}
                  <Route path="hr-dashboard" element={<HRDashboard />} />
                  <Route path="employee-dashboard" element={<EmployeeDashboard />} />
                  <Route path="admin-dashboard" element={<AdminDashboard />} />
                  <Route path="system-monitoring" element={<SystemMonitoring />} />
                  
                  {/* Employee Management */}
                  <Route path="employees" element={<Employees />} />
                  <Route path="employees/:id" element={<EmployeeDetail />} />
                  <Route path="departments" element={<Departments />} />
                  <Route path="company-directory" element={<CompanyDirectory />} />
                  
                  {/* Time & Attendance */}
                  <Route path="time-logs" element={<TimeLogs />} />
                  <Route path="attendance" element={<AttendanceManagement />} />
                  <Route path="my-time-history" element={<MyTimeHistory />} />
                  <Route path="workday-reports" element={<WorkdayReports />} />
                  
                  {/* Leave Management */}
                  <Route path="leave-requests" element={<LeaveRequests />} />
                  
                  {/* Support & Communication */}
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="general-tickets" element={<GeneralTickets />} />
                  <Route path="admin-tickets" element={<AdminTicketManagement />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="announcements" element={<Announcements />} />
                  
                  {/* Access & Security */}
                  <Route path="access-control" element={<AccessControl />} />
                  <Route path="devices" element={<DeviceManagement />} />
                  
                  {/* Reports & Analytics */}
                  <Route path="reports" element={<ReportsAnalytics />} />
                  <Route path="accounting" element={<Accounting />} />
                  
                  {/* Settings & Profile */}
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="account" element={<AccountDetails />} />
                  <Route path="company-edit" element={<CompanyEdit />} />
                  
                  {/* Admin & System */}
                  <Route path="companies" element={<CompanyManagement />} />
                  <Route path="company-feature-flags" element={<CompanyFeatureFlags />} />
                  <Route path="monitoring" element={<Monitoring />} />
                  <Route path="excel-import" element={<ExcelImport />} />
                  <Route path="company-selector" element={<CompanySelector />} />
                  <Route path="wiki" element={<ProtectedRoute requiredRoles={['ADMIN']}><WikiViewer /></ProtectedRoute>} />
                  <Route path="company-setup" element={<CompanySetupWizard />} />
                  <Route path="bulk-import" element={<BulkEmployeeImport />} />
                </Route>
              </Routes>
                </FeatureFlagProvider>
              </AuthProvider>
            </Router>
          </LanguageProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
