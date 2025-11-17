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
  LinearProgress
} from '@mui/material'
import {
  Add as AddIcon,
  EventNote as EventNoteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
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
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'
import isBetween from 'dayjs/plugin/isBetween'
import { useTranslation } from 'react-i18next'

dayjs.extend(isBetween)

import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'

const LeaveRequests = () => {
  const { t } = useLanguage()
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
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRequests, setExpandedRequests] = useState(new Set())

  const isAdmin = hasAnyRole(['ADMIN', 'HR'])
  const { i18n } = useTranslation()

  useEffect(() => {
    // Set dayjs locale based on current language
    const currentLang = i18n.language || localStorage.getItem('language') || 'en'
    dayjs.locale(currentLang === 'tr' ? 'tr' : 'en')
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

      if (process.env.NODE_ENV === 'development') {
        console.log('Submitting leave request:', requestData)
      }

      const response = await api.post('/leave-requests', requestData)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Leave request response:', response.data)
      }
      
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
      console.error('Error response:', err.response?.data)
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'error'
      case 'PENDING': return 'warning'
      case 'CANCELLED': return 'default'
      default: return 'default'
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
                      title={`${getEmployeeName(leave)} - ${leave.leaveType} (${leave.startDate.format('MMM D')} - ${leave.endDate.format('MMM D')})`}
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
                        {getEmployeeName(leave)} - {leave.leaveType}
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
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {t('leaveRequests.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('leaveRequests.manageTimeOffRequests')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
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
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {t('leaveRequests.annualLeave')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {annualRemaining}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {t('leaveRequests.ofDaysRemaining', { total: leaveBalances.annual })}
                    </Typography>
                  </Box>
                  <CalendarIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(annualRemaining / leaveBalances.annual) * 100} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'white'
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {t('leaveRequests.sickLeave')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {leaveBalances.sick}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {t('leaveRequests.daysAvailable')}
                    </Typography>
                  </Box>
                  <AccessTimeIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'white'
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {t('leaveRequests.usedThisYear')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {leaveBalances.used}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {t('leaveRequests.daysTaken')}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(leaveBalances.used / (leaveBalances.annual + leaveBalances.used)) * 100} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'white'
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
              <Typography variant="h4" color="warning.dark" sx={{ fontWeight: 600 }}>
                {pendingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('leaveRequests.pendingRequests')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
              <Typography variant="h4" color="success.dark" sx={{ fontWeight: 600 }}>
                {approvedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('leaveRequests.approvedRequests')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
              <Typography variant="h4" color="primary.dark" sx={{ fontWeight: 600 }}>
                {myRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Requests
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column - Calendar */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
            </Paper>
          </Grid>

          {/* Right Column - Requests */}
          <Grid item xs={12} md={7}>
            {/* My Requests List */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('leaveRequests.myLeaveRequests')}
                </Typography>
                <Chip label={myRequests.length} color="primary" />
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
                  >
                    {t('leaveRequests.createFirstRequest')}
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {myRequests.map((request) => {
                    const isExpanded = expandedRequests.has(request.id)
                    return (
                      <Card 
                        key={request.id} 
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
                                label={request.leaveType}
                                color={getLeaveTypeColor(request.leaveType)}
                                size="small"
                              />
                              <Chip
                                icon={getStatusIcon(request.status)}
                                label={request.status}
                                color={getStatusColor(request.status)}
                                size="small"
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
            </Paper>
          </Grid>
        </Grid>

        {/* Create Leave Request Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
                <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
                <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
                <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
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

            {newRequest.startDate && newRequest.endDate && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>{t('leaveRequests.totalDays')}:</strong> {calculateDays()} {t('leaveRequests.day', { count: calculateDays() })}
                </Typography>
              </Alert>
            )}

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
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleCreateRequest}
              variant="contained"
              disabled={!newRequest.startDate || !newRequest.endDate}
            >
              {t('leaveRequests.submitRequest')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  // HR/Admin View - Keep existing functionality but with improvements
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {t('leaveRequests.title')}
        </Typography>
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
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {t('common.filter')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
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
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.totalRequests')}
                    </Typography>
                    <Typography variant="h4">
                      {statistics.total}
                    </Typography>
                  </Box>
                  <EventNoteIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.pending')}
                    </Typography>
                    <Typography variant="h4" color="warning.dark">
                      {statistics.pending}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: 40, color: 'warning.dark', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.approved')}
                    </Typography>
                    <Typography variant="h4" color="success.dark">
                      {statistics.approved}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.dark', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: 'error.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.rejected')}
                    </Typography>
                    <Typography variant="h4" color="error.dark">
                      {statistics.rejected}
                    </Typography>
                  </Box>
                  <CancelIcon sx={{ fontSize: 40, color: 'error.dark', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {t('leaveRequests.totalDaysApproved')}
                    </Typography>
                    <Typography variant="h4">
                      {statistics.totalDays}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters Section */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('common.search')}
                placeholder={t('leaveRequests.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('leaveRequests.status')}</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label={t('leaveRequests.status')}
                >
                  <MenuItem value="ALL">{t('leaveRequests.allStatus')}</MenuItem>
                  <MenuItem value="PENDING">{t('leaveRequests.pending')}</MenuItem>
                  <MenuItem value="APPROVED">{t('leaveRequests.approved')}</MenuItem>
                  <MenuItem value="REJECTED">{t('leaveRequests.rejected')}</MenuItem>
                  <MenuItem value="CANCELLED">{t('leaveRequests.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('leaveRequests.leaveType')}</InputLabel>
                <Select
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  label={t('leaveRequests.leaveType')}
                >
                  <MenuItem value="ALL">{t('leaveRequests.allTypes')}</MenuItem>
                  <MenuItem value="ANNUAL">{t('leaveRequests.annualLeave')}</MenuItem>
                  <MenuItem value="SICK">{t('leaveRequests.sickLeave')}</MenuItem>
                  <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
                  <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
                  <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
                  <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setStatusFilter('ALL')
                  setLeaveTypeFilter('ALL')
                  setSearchTerm('')
                }}
              >
                {t('leaveRequests.clearFilters')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5">
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
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // List View
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {pendingRequests.length > 0 && (
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light', border: '2px solid', borderColor: 'warning.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PendingIcon sx={{ mr: 1, color: 'warning.dark' }} />
                  <Typography variant="h6" color="warning.dark">
                    {t('leaveRequests.pendingApproval', { count: pendingRequests.length })}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {t('leaveRequests.reviewAndApproveOrReject')}
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {pendingRequests.map((request) => (
                    <Card key={request.id} sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                              {getEmployeeName(request)}
                            </Typography>
                            <Chip
                              label={request.leaveType}
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
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleApproveClick(request)}
                            >
                              {t('leaveRequests.approve')}
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleRejectClick(request)}
                            >
                              {t('leaveRequests.reject')}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditClick(request)}
                            >
                              {t('common.edit')}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>
            )}

            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventNoteIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
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
                  {filteredRequests.map((request) => (
                    <Card key={request.id} sx={{ mb: 2, border: '1px solid', borderColor: 'grey.200' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                              {getEmployeeName(request)}
                            </Typography>
                            <Chip
                              label={request.leaveType}
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
                              icon={getStatusIcon(request.status)}
                              label={request.status}
                              color={getStatusColor(request.status)}
                              size="small"
                            />
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleApproveClick(request)}
                                  sx={{ mb: 0.5, width: '100%' }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  onClick={() => handleRejectClick(request)}
                                  sx={{ mb: 0.5, width: '100%' }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleEditClick(request)}
                              sx={{ width: '100%' }}
                            >
                              Edit
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Dialogs - Keep existing implementation */}
      {/* Create Leave Request Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isAdmin ? t('leaveRequests.createLeaveRequest') : t('leaveRequests.requestLeave')}</DialogTitle>
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
              <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
              <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
              <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
              <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
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

          {newRequest.startDate && newRequest.endDate && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('leaveRequests.totalDays')}: {calculateDays()} {t('leaveRequests.day', { count: calculateDays() })}
            </Alert>
          )}

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
            disabled={!newRequest.startDate || !newRequest.endDate || (isAdmin && !newRequest.employeeId)}
          >
            {isAdmin ? t('leaveRequests.createRequest') : t('leaveRequests.submitRequest')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit, Approve, Reject Dialogs - Keep existing */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('leaveRequests.editLeaveRequest')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('leaveRequests.leaveType')}</InputLabel>
            <Select
              value={editRequest.leaveType}
              onChange={(e) => setEditRequest({ ...editRequest, leaveType: e.target.value })}
              label={t('leaveRequests.leaveType')}
            >
              <MenuItem value="ANNUAL">{t('leaveRequests.annualLeave')}</MenuItem>
              <MenuItem value="SICK">{t('leaveRequests.sickLeave')}</MenuItem>
              <MenuItem value="UNPAID">{t('leaveRequests.unpaidLeave')}</MenuItem>
              <MenuItem value="MATERNITY">{t('leaveRequests.maternityLeave')}</MenuItem>
              <MenuItem value="PATERNITY">{t('leaveRequests.paternityLeave')}</MenuItem>
              <MenuItem value="PERSONAL">{t('leaveRequests.personalLeave')}</MenuItem>
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
          />

          <TextField
            fullWidth
            label={t('leaveRequests.reason')}
            value={editRequest.reason}
            onChange={(e) => setEditRequest({ ...editRequest, reason: e.target.value })}
            multiline
            rows={3}
            margin="normal"
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleUpdateRequest}
            variant="contained"
            disabled={!editRequest.startDate || !editRequest.endDate}
          >
            {t('leaveRequests.updateRequest')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('leaveRequests.approveLeaveRequest')}</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('employees.title')}: {getEmployeeName(selectedRequest)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('leaveRequests.leaveType')}: {selectedRequest.leaveType}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
            variant="contained"
            color="success"
          >
            {t('leaveRequests.approve')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('leaveRequests.rejectLeaveRequest')}</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('employees.title')}: {getEmployeeName(selectedRequest)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('leaveRequests.leaveType')}: {selectedRequest.leaveType}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={() => selectedRequest && handleReject(selectedRequest.id)}
            variant="contained"
            color="error"
          >
            {t('leaveRequests.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeaveRequests
