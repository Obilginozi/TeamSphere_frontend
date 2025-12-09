import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  Badge,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  LinearProgress,
  Avatar,
  Grow
} from '@mui/material'
import {
  Add as AddIcon,
  EventNote as EventNoteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Print as PrintIcon,
  DateRange as DateRangeIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'
import isBetween from 'dayjs/plugin/isBetween'
import { useTranslation } from 'react-i18next'

dayjs.extend(isBetween)

import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'

const LeaveRequests = () => {
  const { t, i18n } = useTranslation()
  const { user, hasAnyRole } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [allLeaveRequests, setAllLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openApproveDialog, setOpenApproveDialog] = useState(false)
  const [openRejectDialog, setOpenRejectDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [viewMode, setViewMode] = useState('list')
  const [leaveBalances, setLeaveBalances] = useState({
    annual: 20,
    sick: 10,
    used: 0
  })
  
  const [newRequest, setNewRequest] = useState({
    employeeId: null,
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
    totalDays: 0
  })
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const [editRequest, setEditRequest] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    adminNotes: ''
  })

  const [approveRejectNotes, setApproveRejectNotes] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRequests, setExpandedRequests] = useState(new Set())

  const isAdmin = hasAnyRole(['ADMIN', 'HR'])

  // StatCard component matching dashboard style (smaller for leave-requests page)
  const StatCard = ({ title, value, icon, color, subtitle, index = 0 }) => (
    <Grow in timeout={600 + (index * 100)}>
      <Card 
        sx={{ 
          height: '100%',
          cursor: 'default',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: color,
            opacity: 0.8
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            '&::before': {
              opacity: 1
            }
          }
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box flex={1}>
              <Typography 
                color="textSecondary" 
                gutterBottom 
                variant="body2"
                sx={{ fontWeight: 500, mb: 0.5, fontSize: '0.875rem' }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h4" 
                component="div"
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.75rem',
                  background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ fontWeight: 500, fontSize: '0.7rem', mt: 0.5, display: 'block' }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: color, 
                width: 48, 
                height: 48,
                boxShadow: `0 4px 20px ${color}40`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)'
                }
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  )

  // Force re-render when language changes
  const [languageKey, setLanguageKey] = useState(i18n.language)
  
  // Ensure component re-renders when language changes
  useEffect(() => {
    const currentLang = i18n.language || localStorage.getItem('language') || 'en'
    dayjs.locale(currentLang === 'tr' ? 'tr' : 'en')
    setLanguageKey(currentLang)
  }, [i18n.language])

  useEffect(() => {
    fetchLeaveRequests()
    fetchLeaveBalances()
    if (isAdmin) {
      fetchEmployees()
    }
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const endpoint = isAdmin ? '/leave-requests' : '/leave-requests/my'
      const response = await api.get(endpoint)
      setLeaveRequests(response.data.data || [])
      
      try {
        if (isAdmin) {
          const allRequestsResponse = await api.get('/leave-requests')
          const allRequestsData = allRequestsResponse.data.data || []
          setAllLeaveRequests(allRequestsData)
        } else {
          const approvedResponse = await api.get('/leave-requests/approved')
          const approvedData = approvedResponse.data.data || []
          const myRequests = response.data.data || []
          const allData = [...approvedData, ...myRequests]
          const uniqueData = allData.filter((leave, index, self) => 
            index === self.findIndex(l => l.id === leave.id)
          )
          setAllLeaveRequests(uniqueData)
        }
      } catch (err) {
        console.error('Failed to fetch all leave requests:', err)
        setAllLeaveRequests([])
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, t('leaveRequests.failedToLoad'))
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveBalances = async () => {
    try {
      setLeaveBalances({
        annual: 20,
        sick: 10,
        used: 5
      })
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const response = await api.get('/employee', {
        params: { page: 0, size: 1000 }
      })
      if (response.data.data?.content) {
        setEmployees(response.data.data.content)
      } else if (Array.isArray(response.data.data)) {
        setEmployees(response.data.data)
      } else {
        setEmployees([])
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleCreateRequest = async () => {
    try {
      setError(null)
      
      // Validate required fields
      if (!newRequest.startDate) {
        setError(t('leaveRequests.pleaseSelectStartDate'))
        return
      }
      
      if (!newRequest.endDate) {
        setError(t('leaveRequests.pleaseSelectEndDate'))
        return
      }
      
      if (new Date(newRequest.startDate) > new Date(newRequest.endDate)) {
        setError(t('leaveRequests.endDateMustBeAfterStartDate'))
        return
      }
      
      if (isAdmin && !newRequest.employeeId) {
        setError(t('leaveRequests.pleaseSelectEmployee'))
        return
      }
      
      const requestData = {
        leaveType: newRequest.leaveType,
        startDate: newRequest.startDate,
        endDate: newRequest.endDate,
        reason: newRequest.reason || null
      }

      if (isAdmin && newRequest.employeeId) {
        requestData.employeeId = newRequest.employeeId
      }

      const response = await api.post('/leave-requests', requestData)
      
      setSuccess(t('leaveRequests.submittedSuccessfully'))
      setOpenDialog(false)
      setNewRequest({
        employeeId: null,
        leaveType: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '',
        totalDays: 0
      })
      fetchLeaveRequests()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error creating leave request:', err)
      const errorMessage = getErrorMessage(err, t('leaveRequests.failedToCreate'))
      setError(errorMessage)
    }
  }

  const handleApprove = async (id) => {
    try {
      const payload = approveRejectNotes ? { adminNotes: approveRejectNotes } : {}
      await api.put(`/leave-requests/${id}/approve`, payload)
      setSuccess(t('leaveRequests.approvedSuccessfully'))
      setOpenApproveDialog(false)
      setApproveRejectNotes('')
      fetchLeaveRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = getErrorMessage(err, t('leaveRequests.failedToApprove'))
      setError(errorMessage)
    }
  }

  const handleReject = async (id) => {
    try {
      const payload = approveRejectNotes ? { adminNotes: approveRejectNotes } : {}
      await api.put(`/leave-requests/${id}/reject`, payload)
      setSuccess(t('leaveRequests.rejectedSuccessfully'))
      setOpenRejectDialog(false)
      setApproveRejectNotes('')
      fetchLeaveRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = getErrorMessage(err, t('leaveRequests.failedToReject'))
      setError(errorMessage)
    }
  }

  const handleEditClick = (request) => {
    setSelectedRequest(request)
    setEditRequest({
      leaveType: request.leaveType || '',
      startDate: request.startDate || '',
      endDate: request.endDate || '',
      reason: request.reason || '',
      adminNotes: request.adminNotes || ''
    })
    setOpenEditDialog(true)
  }

  const handleUpdateRequest = async () => {
    try {
      if (!selectedRequest) return
      
      await api.put(`/leave-requests/${selectedRequest.id}`, editRequest)
      setSuccess(t('leaveRequests.updatedSuccessfully'))
      setOpenEditDialog(false)
      setSelectedRequest(null)
      fetchLeaveRequests()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errorMessage = getErrorMessage(err, t('leaveRequests.failedToUpdate'))
      setError(errorMessage)
    }
  }

  const handleApproveClick = (request) => {
    setSelectedRequest(request)
    setApproveRejectNotes('')
    setOpenApproveDialog(true)
  }

  const handleRejectClick = (request) => {
    setSelectedRequest(request)
    setApproveRejectNotes('')
    setOpenRejectDialog(true)
  }

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: t('common.status.pending'),
      APPROVED: t('common.status.approved'),
      REJECTED: t('common.status.rejected'),
      CANCELLED: t('common.status.cancelled')
    }
    return labels[status] || status
  }

  const getLeaveTypeLabel = (leaveType) => {
    const labels = {
      ANNUAL: t('leaveRequests.annualLeave'),
      SICK: t('leaveRequests.sickLeave'),
      EMERGENCY: t('leaveRequests.emergencyLeave'),
      PERSONAL: t('leaveRequests.personalLeave'),
      MATERNITY: t('leaveRequests.maternityLeave'),
      PATERNITY: t('leaveRequests.paternityLeave'),
      UNPAID: t('leaveRequests.unpaidLeave'),
      BEREAVEMENT: t('leaveRequests.bereavementLeave')
    }
    return labels[leaveType] || leaveType
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'error'
      case 'PENDING': return 'warning'
      case 'CANCELLED': return 'default'
      default: return 'default'
    }
  }

  const getStatusChipStyles = (status) => {
    const baseStyles = {
      borderRadius: 2,
      fontWeight: 600,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-1px)'
      }
    }
    
    switch (status) {
      case 'APPROVED':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)' }
        }
      case 'REJECTED':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(244, 67, 54, 0.4)' }
        }
      case 'PENDING':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)' }
        }
      case 'CANCELLED':
        return {
          ...baseStyles,
          background: 'rgba(158, 158, 158, 0.2)',
          color: '#424242',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
        }
      default:
        return {
          ...baseStyles,
          background: 'rgba(158, 158, 158, 0.2)',
          color: '#424242',
          fontWeight: 500,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': { ...baseStyles['&:hover'], boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
        }
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircleIcon />
      case 'REJECTED': return <CancelIcon />
      case 'PENDING': return <PendingIcon />
      default: return <EventNoteIcon />
    }
  }

  const calculateDays = () => {
    if (newRequest.startDate && newRequest.endDate) {
      const start = new Date(newRequest.startDate)
      const end = new Date(newRequest.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 0
  }

  const getLeaveTypeColor = (leaveType) => {
    switch (leaveType) {
      case 'ANNUAL': return 'primary'
      case 'SICK': return 'secondary'
      case 'PERSONAL': return 'info'
      case 'EMERGENCY': return 'error'
      default: return 'default'
    }
  }

  const getLeavesForDate = (date) => {
    return allLeaveRequests.filter(leave => {
      if (!leave.startDate || !leave.endDate) return false
      const startDate = dayjs(leave.startDate)
      const endDate = dayjs(leave.endDate)
      const checkDate = dayjs(date)
      // Check if checkDate is between startDate and endDate (inclusive)
      return checkDate.isBetween(startDate, endDate, 'day', '[]')
    })
  }

  const getEmployeeName = (request) => {
    if (request.employee) {
      if (request.employee.user) {
        return `${request.employee.user.firstName || ''} ${request.employee.user.lastName || ''}`.trim()
      }
      return request.employee.employeeId || 'Unknown'
    }
    return request.employeeName || 'Unknown'
  }

  const pendingRequests = isAdmin ? leaveRequests.filter(r => r.status === 'PENDING') : []
  
  const statistics = isAdmin ? {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'PENDING').length,
    approved: leaveRequests.filter(r => r.status === 'APPROVED').length,
    rejected: leaveRequests.filter(r => r.status === 'REJECTED').length,
    cancelled: leaveRequests.filter(r => r.status === 'CANCELLED').length,
    totalDays: leaveRequests
      .filter(r => r.status === 'APPROVED')
      .reduce((sum, r) => sum + (r.totalDays || 0), 0)
  } : null

  const filteredRequests = isAdmin ? leaveRequests.filter(request => {
    if (statusFilter !== 'ALL' && request.status !== statusFilter) return false
    if (leaveTypeFilter !== 'ALL' && request.leaveType !== leaveTypeFilter) return false
    if (searchTerm) {
      const employeeName = getEmployeeName(request).toLowerCase()
      const searchLower = searchTerm.toLowerCase()
      if (!employeeName.includes(searchLower) && 
          !request.leaveType?.toLowerCase().includes(searchLower) &&
          !request.reason?.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    return true
  }).sort((a, b) => {
    // Sort by creation date (most recent first), then by start date
    if (a.createdAt && b.createdAt) {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA // Most recent first
    }
    // Fallback to startDate if createdAt is not available
    const dateA = new Date(a.startDate).getTime()
    const dateB = new Date(b.startDate).getTime()
    return dateB - dateA // Most recent first
  }) : leaveRequests

  const getDaysInMonth = (date) => {
    const start = date.startOf('month').startOf('week')
    const end = date.endOf('month').endOf('week')
    const days = []
    let current = start
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      days.push(current)
      current = current.add(1, 'day')
    }
    return days
  }

  const getLeavesForDateRange = (startDate, endDate) => {
    return allLeaveRequests.filter(leave => {
      const leaveStart = dayjs(leave.startDate)
      const leaveEnd = dayjs(leave.endDate)
      return (leaveStart.isBefore(endDate) || leaveStart.isSame(endDate, 'day')) &&
             (leaveEnd.isAfter(startDate) || leaveEnd.isSame(startDate, 'day'))
    })
  }

  const renderCalendarDay = (day) => {
    const leaves = getLeavesForDate(day)
    return (
      <Badge
        badgeContent={leaves.length}
        color="primary"
        sx={{ width: '100%', height: '100%' }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          {day.format('D')}
        </Box>
      </Badge>
    )
  }

  const renderCustomCalendar = () => {
    const days = getDaysInMonth(selectedDate)
    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    const leaveBars = []
    allLeaveRequests.forEach(leave => {
      if (!leave.startDate || !leave.endDate) return
      
      const startDate = dayjs(leave.startDate)
      const endDate = dayjs(leave.endDate)
      const monthStart = selectedDate.startOf('month')
      const monthEnd = selectedDate.endOf('month')
      
      if (endDate.isAfter(monthStart.subtract(1, 'day')) && startDate.isBefore(monthEnd.add(1, 'day'))) {
        leaveBars.push({
          ...leave,
          startDate: startDate,
          endDate: endDate,
          displayStart: startDate.isBefore(monthStart) ? monthStart : startDate,
          displayEnd: endDate.isAfter(monthEnd) ? monthEnd : endDate
        })
      }
    })

    return (
      <Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {[t('leaveRequests.sun'), t('leaveRequests.mon'), t('leaveRequests.tue'), t('leaveRequests.wed'), t('leaveRequests.thu'), t('leaveRequests.fri'), t('leaveRequests.sat')].map(day => (
            <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', fontWeight: 'bold', p: 1 }}>
              {day}
            </Typography>
          ))}
        </Box>
        {weeks.map((week, weekIndex) => {
          const weekLeaves = leaveBars.filter(leave => {
            const weekStart = week[0]
            const weekEnd = week[6]
            return (leave.displayStart.isBefore(weekEnd) || leave.displayStart.isSame(weekEnd, 'day')) &&
                   (leave.displayEnd.isAfter(weekStart) || leave.displayEnd.isSame(weekStart, 'day'))
          })

          const calculateStackLevels = (leaves) => {
            if (leaves.length === 0) return new Map()
            
            const weekStart = week[0]
            const weekEnd = week[6]
            
            const sorted = [...leaves].sort((a, b) => {
              const aStart = a.displayStart.isBefore(weekStart) ? weekStart : a.displayStart
              const bStart = b.displayStart.isBefore(weekStart) ? weekStart : b.displayStart
              return aStart.diff(bStart, 'day')
            })
            
            const levels = new Map()
            sorted.forEach(leave => {
              const displayStart = leave.displayStart.isBefore(weekStart) ? weekStart : leave.displayStart
              const displayEnd = leave.displayEnd.isAfter(weekEnd) ? weekEnd : leave.displayEnd
              
              let level = 0
              while (true) {
                const hasOverlap = Array.from(levels.entries()).some(([otherId, otherLevel]) => {
                  if (otherLevel !== level) return false
                  const otherLeave = leaves.find(l => l.id === otherId)
                  if (!otherLeave) return false
                  const otherStart = otherLeave.displayStart.isBefore(weekStart) ? weekStart : otherLeave.displayStart
                  const otherEnd = otherLeave.displayEnd.isAfter(weekEnd) ? weekEnd : otherLeave.displayEnd
                  return (displayStart.isBefore(otherEnd) || displayStart.isSame(otherEnd, 'day')) &&
                         (displayEnd.isAfter(otherStart) || displayEnd.isSame(otherStart, 'day'))
                })
                if (!hasOverlap) break
                level++
              }
              levels.set(leave.id, level)
            })
            
            return levels
          }
          
          const levelMap = calculateStackLevels(weekLeaves)
          const maxStacks = weekLeaves.length > 0 
            ? Math.max(...Array.from(levelMap.values()), 0) + 1 
            : 1
          const rowHeight = maxStacks * 28 + 8
          
          return (
            <Box key={weekIndex} sx={{ mb: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 0.5 }}>
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.month() === selectedDate.month()
                  return (
                    <Box
                      key={dayIndex}
                      sx={{
                        minHeight: 40,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        bgcolor: isCurrentMonth ? 'background.paper' : 'grey.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: day.isSame(dayjs(), 'day') ? 'bold' : 'normal',
                          color: day.isSame(dayjs(), 'day') ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {day.format('D')}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
              
              <Box sx={{ position: 'relative', minHeight: rowHeight, mb: 1 }}>
                {weekLeaves.map((leave) => {
                  const weekStart = week[0]
                  const weekEnd = week[6]
                  const displayStart = leave.displayStart.isBefore(weekStart) ? weekStart : leave.displayStart
                  const displayEnd = leave.displayEnd.isAfter(weekEnd) ? weekEnd : leave.displayEnd
                  
                  const startCol = displayStart.diff(weekStart, 'day')
                  const span = displayEnd.diff(displayStart, 'day') + 1
                  
                  const stackLevel = levelMap.get(leave.id) || 0
                  const isStartOfLeave = leave.displayStart.isSame(displayStart, 'day')
                  const isEndOfLeave = leave.displayEnd.isSame(displayEnd, 'day')
                  
                  return (
                    <Box
                      key={`${leave.id}-${weekIndex}`}
                      sx={{
                        position: 'absolute',
                        left: `calc(${startCol * (100 / 7)}% + ${startCol * 4}px)`,
                        width: `calc(${span * (100 / 7)}% - ${(span - 1) * 4}px)`,
                        height: 26,
                        bgcolor: leave.status === 'APPROVED' 
                          ? 'success.main' 
                          : leave.status === 'PENDING' 
                          ? 'warning.main' 
                          : leave.status === 'REJECTED'
                          ? 'error.main'
                          : 'primary.main',
                        borderRadius: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 0.5,
                        top: stackLevel * 28,
                        zIndex: 1,
                        border: '1px solid',
                        borderColor: leave.status === 'APPROVED' 
                          ? 'success.dark' 
                          : leave.status === 'PENDING' 
                          ? 'warning.dark' 
                          : leave.status === 'REJECTED'
                          ? 'error.dark'
                          : 'primary.dark',
                        borderTopLeftRadius: isStartOfLeave ? '4px' : '0px',
                        borderBottomLeftRadius: isStartOfLeave ? '4px' : '0px',
                        borderTopRightRadius: isEndOfLeave ? '4px' : '0px',
                        borderBottomRightRadius: isEndOfLeave ? '4px' : '0px',
                        borderLeftWidth: isStartOfLeave ? '1px' : '0px',
                        borderRightWidth: isEndOfLeave ? '1px' : '0px'
                      }}
                      title={`${getEmployeeName(leave)} - ${getLeaveTypeLabel(leave.leaveType)} (${leave.startDate.format('MMM D')} - ${leave.endDate.format('MMM D')})`}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: '100%',
                          textAlign: 'center',
                          px: 0.5
                        }}
                      >
                        {getEmployeeName(leave)} - {getLeaveTypeLabel(leave.leaveType)}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  }

  // Employee View - Redesigned
  if (!isAdmin) {
    // Sort requests by creation date (most recent first), then by start date
    const myRequests = [...leaveRequests].sort((a, b) => {
      // First, try to sort by createdAt if available
      if (a.createdAt && b.createdAt) {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA // Most recent first
      }
      // Fallback to startDate if createdAt is not available
      const dateA = new Date(a.startDate).getTime()
      const dateB = new Date(b.startDate).getTime()
      return dateB - dateA // Most recent first
    })
    const pendingCount = myRequests.filter(r => r.status === 'PENDING').length
    const approvedCount = myRequests.filter(r => r.status === 'APPROVED').length
    const annualRemaining = leaveBalances.annual - leaveBalances.used

    return (
      <Box 
        key={`leave-requests-employee-${languageKey}`}
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: 'calc(100vh - 64px)',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          margin: -3,
          padding: 3,
          boxSizing: 'border-box',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  <EventNoteIcon sx={{ fontSize: 28, color: 'white' }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
              {t('pageTitles.leaveRequests')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('leaveRequests.manageTimeOffRequests')}
            </Typography>
                </Box>
              </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
          >
            {t('leaveRequests.requestLeave')}
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Leave Balance Cards - Redesigned */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              title={t('leaveRequests.annualLeave')}
              value={annualRemaining}
              icon={<CalendarIcon />}
              color="#1976d2"
              subtitle={t('leaveRequests.ofDaysRemaining', { total: leaveBalances.annual })}
              index={0}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatCard
              title={t('leaveRequests.sickLeave')}
              value={leaveBalances.sick}
              icon={<AccessTimeIcon />}
              color="#4caf50"
              subtitle={t('leaveRequests.daysAvailable')}
              index={1}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatCard
              title={t('leaveRequests.usedThisYear')}
              value={leaveBalances.used}
              icon={<TrendingUpIcon />}
              color="#ff9800"
              subtitle={t('leaveRequests.daysTaken')}
              index={2}
            />
          </Grid>
        </Grid>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title={t('leaveRequests.pendingRequests')}
              value={pendingCount}
              icon={<PendingIcon />}
              color="#ff9800"
              index={3}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title={t('leaveRequests.approvedRequests')}
              value={approvedCount}
              icon={<CheckCircleIcon />}
              color="#4caf50"
              index={4}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Total Requests"
              value={myRequests.length}
              icon={<EventNoteIcon />}
              color="#9c27b0"
              index={5}
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3} sx={{ width: '100%' }}>
          {/* Left Column - Calendar */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                position: 'sticky',
                p: 3,
                height: 'fit-content',
                top: 20
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ mr: 1, color: '#667eea' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {t('leaveRequests.teamCalendar')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('leaveRequests.seeColleaguesOnLeave')}
              </Typography>
              
              {/* Simple Calendar View */}
              <Box>
                {/* Calendar Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'month'))}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedDate.locale(i18n.language === 'tr' ? 'tr' : 'en').format('MMMM YYYY')}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => setSelectedDate(dayjs(selectedDate).add(1, 'month'))}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                {/* Calendar Grid */}
                <Box>
                  {/* Day Headers */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                    {[t('leaveRequests.sun'), t('leaveRequests.mon'), t('leaveRequests.tue'), t('leaveRequests.wed'), t('leaveRequests.thu'), t('leaveRequests.fri'), t('leaveRequests.sat')].map((day) => (
                      <Typography 
                        key={day} 
                        variant="caption" 
                        sx={{ textAlign: 'center', fontWeight: 'bold', py: 1 }}
                      >
                        {day}
                      </Typography>
                    ))}
                  </Box>

                  {/* Calendar Days */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                    {getDaysInMonth(selectedDate).map((day, index) => {
                      const isCurrentMonth = day.month() === selectedDate.month()
                      const isToday = day.isSame(dayjs(), 'day')
                      const isSelected = day.isSame(selectedDate, 'day')
                      const leaves = getLeavesForDate(day)
                      
                      return (
                        <Box
                          key={index}
                          onClick={() => setSelectedDate(day)}
                          sx={{
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: 1,
                            bgcolor: isSelected 
                              ? 'primary.main' 
                              : isToday 
                              ? 'primary.light' 
                              : isCurrentMonth 
                              ? 'background.paper' 
                              : 'grey.50',
                            color: isSelected 
                              ? 'white' 
                              : isToday 
                              ? 'primary.dark' 
                              : 'text.primary',
                            border: isToday && !isSelected ? '2px solid' : '1px solid',
                            borderColor: isToday && !isSelected ? 'primary.main' : 'divider',
                            '&:hover': {
                              bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                            },
                            position: 'relative'
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: isSelected || isToday ? 'bold' : 'normal',
                              mb: leaves.length > 0 ? 0.5 : 0
                            }}
                          >
                            {day.format('D')}
                          </Typography>
                          {leaves.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap', justifyContent: 'center' }}>
                              {leaves.slice(0, 2).map((leave, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    bgcolor: leave.status === 'APPROVED' 
                                      ? isSelected ? 'white' : 'success.main'
                                      : leave.status === 'PENDING'
                                      ? isSelected ? 'white' : 'warning.main'
                                      : isSelected ? 'white' : 'error.main'
                                  }}
                                />
                              ))}
                              {leaves.length > 2 && (
                                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                                  +{leaves.length - 2}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  {selectedDate.format('MMMM DD, YYYY')}
                </Typography>
                {getLeavesForDate(selectedDate).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('leaveRequests.noApprovedLeavesOnDate')}
                  </Typography>
                ) : (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {getLeavesForDate(selectedDate).map((leave) => (
                      <Box key={leave.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={leave.employeeName || getEmployeeName(leave)}
                          color={getLeaveTypeColor(leave.leaveType)}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {leave.leaveType}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Right Column - Requests */}
          <Grid item xs={12} md={7}>
            {/* My Requests List */}
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                p: 3
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {t('leaveRequests.myLeaveRequests')}
                </Typography>
                <Chip label={myRequests.length} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }} />
              </Box>

              {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">{t('common.loading')}</Typography>
                </Box>
              ) : myRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <EventNoteIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('leaveRequests.noLeaveRequests')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('leaveRequests.noRequestsYet')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {t('leaveRequests.createFirstRequest')}
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myRequests.map((request) => {
                    const isExpanded = expandedRequests.has(request.id)
                    const statusLabel = getStatusLabel(request.status)
                    const leaveTypeLabel = getLeaveTypeLabel(request.leaveType)
                    return (
                      <Card 
                        key={`employee-card-${languageKey}-${request.id}`} 
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            boxShadow: 4,
                            borderColor: 'primary.main'
                          },
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const newExpanded = new Set(expandedRequests)
                          if (isExpanded) {
                            newExpanded.delete(request.id)
                          } else {
                            newExpanded.add(request.id)
                          }
                          setExpandedRequests(newExpanded)
                        }}
                      >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Line 1: Chips and Date */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                key={`leave-type-employee-${languageKey}-${request.id}-${leaveTypeLabel}`}
                                label={leaveTypeLabel}
                                color={getLeaveTypeColor(request.leaveType)}
                                size="small"
                              />
                              <Chip
                                key={`status-list-${languageKey}-${request.id}-${statusLabel}`}
                                icon={getStatusIcon(request.status)}
                                label={statusLabel}
                                size="small"
                                sx={getStatusChipStyles(request.status)}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                {dayjs(request.startDate).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM')} - {dayjs(request.endDate).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM YYYY')}
                              </Typography>
                            </Box>
                            {/* Line 2: Days and Reason preview */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <DateRangeIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {request.totalDays} {t('leaveRequests.day', { count: request.totalDays })}
                                </Typography>
                              </Box>
                              {!isExpanded && request.reason && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: 'text.secondary', 
                                    fontStyle: 'italic',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    minWidth: 0
                                  }}
                                >
                                  "{request.reason}"
                                </Typography>
                              )}
                            </Box>
                            {/* Expanded content */}
                            {isExpanded && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                {request.reason && (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                                      {t('leaveRequests.reason')}:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                      "{request.reason}"
                                    </Typography>
                                  </Box>
                                )}
                                {request.adminNotes && (
                                  <Alert severity="info" sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                      <strong>{t('leaveRequests.adminNote')}:</strong> {request.adminNotes}
                                    </Typography>
                                  </Alert>
                                )}
                                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      {t('leaveRequests.submitted')}
                                    </Typography>
                                    <Typography variant="body2">
                                      {request.createdAt ? dayjs(request.createdAt).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM YYYY, HH:mm') : t('common.notAvailable')}
                                    </Typography>
                                  </Box>
                                  {request.approvedAt && (
                                    <Box>
                                      <Typography variant="caption" color="text.secondary">
                                        {request.status === 'APPROVED' ? t('leaveRequests.approved') : t('leaveRequests.processed')}
                                      </Typography>
                                      <Typography variant="body2">
                                        {dayjs(request.approvedAt).locale(i18n.language === 'tr' ? 'tr' : 'en').format('D MMM YYYY, HH:mm')}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newExpanded = new Set(expandedRequests)
                              if (isExpanded) {
                                newExpanded.delete(request.id)
                              } else {
                                newExpanded.add(request.id)
                              }
                              setExpandedRequests(newExpanded)
                            }}
                            sx={{ flexShrink: 0 }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </CardContent>
                      </Card>
                    )
                  })}
                </Stack>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Create Leave Request Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                opacity: 0.8
              }
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t('leaveRequests.requestLeave')}
              </Typography>
              <IconButton onClick={() => setOpenDialog(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('leaveRequests.leaveType')}</InputLabel>
              <Select
                value={newRequest.leaveType}
                onChange={(e) => setNewRequest({ ...newRequest, leaveType: e.target.value })}
                label={t('leaveRequests.leaveType')}
              >
                <MenuItem value="ANNUAL">{t('leaveRequests.annualLeave')}</MenuItem>
                <MenuItem value="SICK">{t('leaveRequests.sickLeave')}</MenuItem>
                <MenuItem value="EMERGENCY">{t('leaveRequests.emergencyLeave')}</MenuItem>
                <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
                <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
                <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
                <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
                <MenuItem value="BEREAVEMENT">{t('leaveRequests.bereavementLeave')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={t('leaveRequests.startDate')}
              type="date"
              value={newRequest.startDate}
              onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              margin="normal"
            />

            <TextField
              fullWidth
              label={t('leaveRequests.endDate')}
              type="date"
              value={newRequest.endDate}
              onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              margin="normal"
              inputProps={{ min: newRequest.startDate }}
            />

            {newRequest.startDate && newRequest.endDate && (() => {
              const totalDays = calculateDays()
              return (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{t('leaveRequests.totalDays')}:</strong> {totalDays} {t('leaveRequests.day', { count: totalDays })}
                  </Typography>
                </Alert>
              )
            })()}

            <TextField
              fullWidth
              label={t('leaveRequests.reason')}
              value={newRequest.reason}
              onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
              multiline
              rows={3}
              margin="normal"
              placeholder={t('leaveRequests.reasonPlaceholder')}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{ borderRadius: 2 }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateRequest}
              variant="contained"
              disabled={!newRequest.startDate || !newRequest.endDate || (newRequest.startDate && newRequest.endDate && new Date(newRequest.endDate) < new Date(newRequest.startDate))}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)'
                }
              }}
            >
              {t('leaveRequests.submitRequest')}
            </Button>
          </DialogActions>
        </Dialog>
        </Box>
      </Box>
    )
  }

  // HR/Admin View - Keep existing functionality but with improvements
  return (
    <Box
      key={`leave-requests-${languageKey}`}
      sx={{
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        position: 'relative',
        margin: -3,
        padding: 3,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                }}
              >
                <EventNoteIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
          {t('pageTitles.leaveRequests')}
        </Typography>
              </Box>
            </Box>
          </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
            startIcon={<CalendarIcon />}
            onClick={() => setViewMode('calendar')}
          >
            {t('leaveRequests.calendarView')}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<EventNoteIcon />}
            onClick={() => setViewMode('list')}
          >
            {t('leaveRequests.listView')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {t('leaveRequests.createLeaveRequest')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards for HR */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: '#667eea',
                  opacity: 0.8
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.totalRequests')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {statistics.total}
                    </Typography>
                  </Box>
                  <EventNoteIcon sx={{ fontSize: 40, color: '#667eea', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: '#ff9800',
                  opacity: 0.8
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.pending')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      {statistics.pending}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: 40, color: '#ff9800', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: '#4caf50',
                  opacity: 0.8
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.approved')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      {statistics.approved}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: '#f44336',
                  opacity: 0.8
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.rejected')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                      {statistics.rejected}
                    </Typography>
                  </Box>
                  <CancelIcon sx={{ fontSize: 40, color: '#f44336', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: '#667eea',
                  opacity: 0.8
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.totalDaysApproved')}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {statistics.totalDays}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#667eea', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters Section */}
        <Card
          sx={{ 
            p: 2, 
            mb: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t('common.search')}
              placeholder={t('leaveRequests.searchPlaceholder') || t('common.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                  }
                }
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: '#667eea' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl 
              fullWidth 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                  }
                }
              }}
            >
              <InputLabel>{t('leaveRequests.status')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('leaveRequests.status')}
                renderValue={(value) => {
                  if (value === 'ALL') return t('leaveRequests.allStatus')
                  if (value === 'PENDING') return t('leaveRequests.pending')
                  if (value === 'APPROVED') return t('leaveRequests.approved')
                  if (value === 'REJECTED') return t('leaveRequests.rejected')
                  if (value === 'CANCELLED') return t('leaveRequests.cancelled')
                  return value
                }}
              >
                <MenuItem value="ALL">{t('leaveRequests.allStatus')}</MenuItem>
                <MenuItem value="PENDING">{t('leaveRequests.pending')}</MenuItem>
                <MenuItem value="APPROVED">{t('leaveRequests.approved')}</MenuItem>
                <MenuItem value="REJECTED">{t('leaveRequests.rejected')}</MenuItem>
                <MenuItem value="CANCELLED">{t('leaveRequests.cancelled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl 
              fullWidth 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                  }
                }
              }}
            >
              <InputLabel>{t('leaveRequests.leaveType')}</InputLabel>
              <Select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                label={t('leaveRequests.leaveType')}
                renderValue={(value) => {
                  if (value === 'ALL') return t('leaveRequests.allTypes')
                  if (value === 'ANNUAL') return t('leaveRequests.annualLeave')
                  if (value === 'SICK') return t('leaveRequests.sickLeave')
                  if (value === 'EMERGENCY') return t('leaveRequests.emergencyLeave')
                  if (value === 'PERSONAL') return t('leaveRequests.personalLeave')
                  if (value === 'MATERNITY') return t('leaveRequests.maternityLeave')
                  if (value === 'PATERNITY') return t('leaveRequests.paternityLeave')
                  if (value === 'UNPAID') return t('leaveRequests.unpaidLeave')
                  if (value === 'BEREAVEMENT') return t('leaveRequests.bereavementLeave')
                  return value
                }}
              >
                <MenuItem value="ALL">{t('leaveRequests.allTypes')}</MenuItem>
                <MenuItem value="ANNUAL">{t('leaveRequests.annualLeave')}</MenuItem>
                <MenuItem value="SICK">{t('leaveRequests.sickLeave')}</MenuItem>
                <MenuItem value="EMERGENCY">{t('leaveRequests.emergencyLeave')}</MenuItem>
                <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
                <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
                <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
                <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
                <MenuItem value="BEREAVEMENT">{t('leaveRequests.bereavementLeave')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setStatusFilter('ALL')
                setLeaveTypeFilter('ALL')
                setSearchTerm('')
              }}
              sx={{ 
                borderRadius: 2,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#764ba2',
                  background: 'rgba(102, 126, 234, 0.08)',
                }
              }}
            >
              {t('common.reset')}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                p: 3
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon sx={{ mr: 1, color: '#667eea' }} />
                    <Typography 
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {t('leaveRequests.leaveCalendarMonthlySummary')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('leaveRequests.viewAllLeaveRequestsForMonth')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                  >
                    {t('common.print')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedDate(selectedDate.subtract(1, 'month'))}
                  >
                    {t('leaveRequests.previousMonth')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedDate(dayjs())}
                  >
                    {t('leaveRequests.today')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedDate(selectedDate.add(1, 'month'))}
                  >
                    {t('leaveRequests.nextMonth')}
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 24, height: 16, bgcolor: 'warning.main', borderRadius: 0.5 }} />
                  <Typography variant="body2">{t('leaveRequests.pendingRequested')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 24, height: 16, bgcolor: 'success.main', borderRadius: 0.5 }} />
                  <Typography variant="body2">{t('leaveRequests.approved')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 24, height: 16, bgcolor: 'error.main', borderRadius: 0.5 }} />
                  <Typography variant="body2">{t('leaveRequests.rejected')}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ overflowX: 'auto' }} id="calendar-print-content">
                <Box sx={{ minWidth: 800 }}>
                  {renderCustomCalendar()}
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // List View
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {pendingRequests.length > 0 && (
              <Card
                sx={{
                  p: 3,
                  mb: 3,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PendingIcon sx={{ mr: 1, color: '#ff9800' }} />
                  <Typography 
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {t('leaveRequests.pendingApproval', { count: pendingRequests.length })}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {t('leaveRequests.reviewAndApproveOrReject')}
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {pendingRequests.map((request) => (
                    <Card key={`pending-card-${languageKey}-${request.id}`} sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                              {getEmployeeName(request)}
                            </Typography>
                            <Chip
                              key={`leave-type-pending-${languageKey}-${request.id}-${getLeaveTypeLabel(request.leaveType)}`}
                              label={getLeaveTypeLabel(request.leaveType)}
                              color={getLeaveTypeColor(request.leaveType)}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              {request.totalDays} {t('leaveRequests.day', { count: request.totalDays })}
                            </Typography>
                            {request.reason && (
                              <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                                "{request.reason}"
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                              key={`approve-pending-${languageKey}-${request.id}`}
                              size="small"
                              variant="contained"
                              onClick={() => handleApproveClick(request)}
                              sx={{
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                                boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                                fontWeight: 600,
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                                  transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {t('leaveRequests.approve')}
                            </Button>
                            <Button
                              key={`reject-pending-${languageKey}-${request.id}`}
                              size="small"
                              variant="contained"
                              onClick={() => handleRejectClick(request)}
                              sx={{
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                boxShadow: '0 4px 16px rgba(244, 67, 54, 0.3)',
                                fontWeight: 600,
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                                  boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
                                  transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {t('leaveRequests.reject')}
                            </Button>
                            <Button
                              key={`edit-pending-${languageKey}-${request.id}`}
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditClick(request)}
                              sx={{
                                borderRadius: 2,
                                borderColor: '#667eea',
                                color: '#667eea',
                                fontWeight: 500,
                                '&:hover': {
                                  borderColor: '#764ba2',
                                  background: 'rgba(102, 126, 234, 0.08)',
                                  transform: 'translateY(-1px)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {t('common.edit')}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Card>
            )}

            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                p: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventNoteIcon sx={{ mr: 1, color: '#667eea' }} />
                <Typography 
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {t('leaveRequests.allLeaveRequests')}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {t('leaveRequests.manageAllEmployeeLeaveRequests')}
              </Typography>
              
              {filteredRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EventNoteIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography color="textSecondary">
                    {t('leaveRequests.noLeaveRequestsFoundMatchingFilters')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {filteredRequests.map((request) => {
                    const statusLabel = getStatusLabel(request.status)
                    const leaveTypeLabel = getLeaveTypeLabel(request.leaveType)
                    return (
                    <Card key={`request-card-${languageKey}-${request.id}`} sx={{ mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                              {getEmployeeName(request)}
                            </Typography>
                            <Chip
                              key={`leave-type-list-${languageKey}-${request.id}-${leaveTypeLabel}`}
                              label={leaveTypeLabel}
                              color={getLeaveTypeColor(request.leaveType)}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              {request.totalDays} {t('leaveRequests.day', { count: request.totalDays })}
                            </Typography>
                            {request.reason && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                "{request.reason}"
                              </Typography>
                            )}
                            {request.adminNotes && (
                              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                                {t('leaveRequests.notes')}: {request.adminNotes}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Chip
                              key={`status-${languageKey}-${request.id}-${statusLabel}`}
                              icon={getStatusIcon(request.status)}
                              label={statusLabel}
                              size="small"
                              sx={getStatusChipStyles(request.status)}
                            />
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  key={`approve-${languageKey}-${request.id}`}
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleApproveClick(request)}
                                  sx={{
                                    mb: 0.5,
                                    width: '100%',
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                                    boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                                    fontWeight: 600,
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                                      transform: 'translateY(-2px)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {t('leaveRequests.approve')}
                                </Button>
                                <Button
                                  key={`reject-${languageKey}-${request.id}`}
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleRejectClick(request)}
                                  sx={{
                                    mb: 0.5,
                                    width: '100%',
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                    boxShadow: '0 4px 16px rgba(244, 67, 54, 0.3)',
                                    fontWeight: 600,
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                                      boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
                                      transform: 'translateY(-2px)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {t('leaveRequests.reject')}
                                </Button>
                              </>
                            )}
                            <Button
                              key={`edit-${languageKey}-${request.id}`}
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditClick(request)}
                              sx={{
                                width: '100%',
                                borderRadius: 2,
                                borderColor: '#667eea',
                                color: '#667eea',
                                fontWeight: 500,
                                '&:hover': {
                                  borderColor: '#764ba2',
                                  background: 'rgba(102, 126, 234, 0.08)',
                                  transform: 'translateY(-1px)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {t('common.edit')}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                    )
                  })}
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Dialogs - Keep existing implementation */}
      {/* Create Leave Request Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {isAdmin ? t('leaveRequests.createLeaveRequest') : t('leaveRequests.requestLeave')}
        </DialogTitle>
        <DialogContent>
          {isAdmin && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('employees.title')}</InputLabel>
              <Select
                value={newRequest.employeeId || ''}
                onChange={(e) => setNewRequest({ ...newRequest, employeeId: e.target.value })}
                label={t('employees.title')}
                disabled={loadingEmployees}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.user ? `${employee.user.firstName} ${employee.user.lastName}` : employee.employeeId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('leaveRequests.leaveType')}</InputLabel>
            <Select
              value={newRequest.leaveType}
              onChange={(e) => setNewRequest({ ...newRequest, leaveType: e.target.value })}
              label={t('leaveRequests.leaveType')}
            >
              <MenuItem value="ANNUAL">{t('leaveRequests.annualLeave')}</MenuItem>
              <MenuItem value="SICK">{t('leaveRequests.sickLeave')}</MenuItem>
              <MenuItem value="EMERGENCY">{t('leaveRequests.emergencyLeave')}</MenuItem>
              <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
              <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
              <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
              <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
              <MenuItem value="BEREAVEMENT">{t('leaveRequests.bereavementLeave')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('leaveRequests.startDate')}
            type="date"
            value={newRequest.startDate}
            onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <TextField
            fullWidth
            label={t('leaveRequests.endDate')}
            type="date"
            value={newRequest.endDate}
            onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            inputProps={{ min: newRequest.startDate }}
            error={!!(newRequest.startDate && newRequest.endDate && new Date(newRequest.endDate) < new Date(newRequest.startDate))}
            helperText={newRequest.startDate && newRequest.endDate && new Date(newRequest.endDate) < new Date(newRequest.startDate) ? t('leaveRequests.endDateMustBeAfterStartDate') : ''}
          />

          {newRequest.startDate && newRequest.endDate && (() => {
            const totalDays = calculateDays()
            const isEndBeforeStart = new Date(newRequest.endDate) < new Date(newRequest.startDate)
            return (
              <>
                {isEndBeforeStart && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {t('leaveRequests.endDateMustBeAfterStartDate')}
                  </Alert>
                )}
                {!isEndBeforeStart && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t('leaveRequests.totalDays')}: {totalDays} {t('leaveRequests.day', { count: totalDays })}
                  </Alert>
                )}
              </>
            )
          })()}

          <TextField
            fullWidth
            label={t('leaveRequests.reason')}
            value={newRequest.reason}
            onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
            multiline
            rows={3}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreateRequest}
            variant="contained"
            disabled={!newRequest.startDate || !newRequest.endDate || (isAdmin && !newRequest.employeeId) || (newRequest.startDate && newRequest.endDate && new Date(newRequest.endDate) < new Date(newRequest.startDate))}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            {isAdmin ? t('leaveRequests.createRequest') : t('leaveRequests.submitRequest')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit, Approve, Reject Dialogs - Keep existing */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('leaveRequests.editLeaveRequest')}
        </DialogTitle>
        <DialogContent>
          <FormControl 
            fullWidth 
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                }
              }
            }}
          >
            <InputLabel>{t('leaveRequests.leaveType')}</InputLabel>
            <Select
              value={editRequest.leaveType}
              onChange={(e) => setEditRequest({ ...editRequest, leaveType: e.target.value })}
              label={t('leaveRequests.leaveType')}
            >
              <MenuItem value="ANNUAL">{t('leaveRequests.annualLeave')}</MenuItem>
              <MenuItem value="SICK">{t('leaveRequests.sickLeave')}</MenuItem>
              <MenuItem value="EMERGENCY">{t('leaveRequests.emergencyLeave')}</MenuItem>
              <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
              <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
              <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
              <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
              <MenuItem value="BEREAVEMENT">{t('leaveRequests.bereavementLeave')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('leaveRequests.startDate')}
            type="date"
            value={editRequest.startDate}
            onChange={(e) => setEditRequest({ ...editRequest, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                }
              }
            }}
          />

          <TextField
            fullWidth
            label={t('leaveRequests.endDate')}
            type="date"
            value={editRequest.endDate}
            onChange={(e) => setEditRequest({ ...editRequest, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
            inputProps={{ min: editRequest.startDate }}
            error={!!(editRequest.startDate && editRequest.endDate && new Date(editRequest.endDate) < new Date(editRequest.startDate))}
            helperText={editRequest.startDate && editRequest.endDate && new Date(editRequest.endDate) < new Date(editRequest.startDate) ? t('leaveRequests.endDateMustBeAfterStartDate') : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                }
              }
            }}
          />

          <TextField
            fullWidth
            label={t('leaveRequests.reason')}
            value={editRequest.reason}
            onChange={(e) => setEditRequest({ ...editRequest, reason: e.target.value })}
            multiline
            rows={3}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                }
              }
            }}
          />

          <TextField
            fullWidth
            label={t('leaveRequests.adminNotes')}
            value={editRequest.adminNotes}
            onChange={(e) => setEditRequest({ ...editRequest, adminNotes: e.target.value })}
            multiline
            rows={2}
            margin="normal"
            helperText={t('leaveRequests.internalNotesVisibleOnlyToHRAdmin')}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUpdateRequest}
            variant="contained"
            disabled={!editRequest.startDate || !editRequest.endDate || (editRequest.startDate && editRequest.endDate && new Date(editRequest.endDate) < new Date(editRequest.startDate))}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {t('leaveRequests.updateRequest')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openApproveDialog} 
        onClose={() => setOpenApproveDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4caf50 0%, #388e3c 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('leaveRequests.approveLeaveRequest')}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('employees.title')}: {getEmployeeName(selectedRequest)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('leaveRequests.leaveType')}: {getLeaveTypeLabel(selectedRequest.leaveType)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('leaveRequests.dates')}: {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('leaveRequests.days')}: {selectedRequest.totalDays}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label={t('leaveRequests.adminNotesOptional')}
            value={approveRejectNotes}
            onChange={(e) => setApproveRejectNotes(e.target.value)}
            multiline
            rows={3}
            margin="normal"
            helperText={t('leaveRequests.addAnyNotesAboutThisApproval')}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setOpenApproveDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
            variant="contained"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {t('leaveRequests.approve')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openRejectDialog} 
        onClose={() => setOpenRejectDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #f44336 0%, #d32f2f 100%)',
              opacity: 0.8
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            color: '#f44336',
            fontWeight: 700,
            fontSize: '1.5rem',
            pb: 2
          }}
        >
          {t('leaveRequests.rejectLeaveRequest')}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('employees.title')}: {getEmployeeName(selectedRequest)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('leaveRequests.leaveType')}: {getLeaveTypeLabel(selectedRequest.leaveType)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('leaveRequests.dates')}: {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('leaveRequests.days')}: {selectedRequest.totalDays}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label={t('leaveRequests.rejectionReasonOptional')}
            value={approveRejectNotes}
            onChange={(e) => setApproveRejectNotes(e.target.value)}
            multiline
            rows={3}
            margin="normal"
            helperText={t('leaveRequests.addReasonForRejection')}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 2px rgba(244, 67, 54, 0.2)',
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setOpenRejectDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => selectedRequest && handleReject(selectedRequest.id)}
            variant="contained"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              boxShadow: '0 4px 16px rgba(244, 67, 54, 0.3)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {t('leaveRequests.reject')}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  )
}

export default LeaveRequests
