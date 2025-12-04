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
  Alert,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  Add as AddIcon,
  EventNote as EventNoteIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Cake as CakeIcon
} from '@mui/icons-material'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'
import isBetween from 'dayjs/plugin/isBetween'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { getErrorMessage } from '../utils/errorHandler'
import { useTranslation } from 'react-i18next'

dayjs.extend(isBetween)

const CompanyCalendar = () => {
  const { t, i18n } = useTranslation()
  const { user, hasAnyRole } = useAuth()
  const [calendarEvents, setCalendarEvents] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [departments, setDepartments] = useState([])
  const [userDepartment, setUserDepartment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: dayjs().format('YYYY-MM-DD'),
    endDate: '',
    startTime: '',
    endTime: '',
    eventType: 'EVENT',
    isAllDay: false,
    departmentId: null
  })

  const canEdit = hasAnyRole(['HR', 'DEPARTMENT_MANAGER', 'ADMIN'])

  useEffect(() => {
    dayjs.locale(i18n.language === 'tr' ? 'tr' : 'en')
  }, [i18n.language])

  useEffect(() => {
    loadData()
    if (canEdit) {
      fetchDepartments()
      fetchUserProfile()
    }
  }, [selectedDate, canEdit])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const monthStart = selectedDate.startOf('month')
      const monthEnd = selectedDate.endOf('month')
      
      // Load calendar events
      const eventsRes = await api.get('/calendar-events', {
        params: {
          startDate: monthStart.format('YYYY-MM-DD'),
          endDate: monthEnd.format('YYYY-MM-DD')
        }
      })
      const events = eventsRes.data.data || []
      setCalendarEvents(events)

      // Load birthdays for the month
      const birthdaysRes = await api.get('/employee/upcoming-birthdays', {
        params: { daysAhead: 365 }
      })
      const allBirthdays = birthdaysRes.data.data || []
      
      // Filter birthdays for the current month
      const monthBirthdays = allBirthdays.filter(emp => {
        if (!emp.birthDate) return false
        const birthDate = dayjs(emp.birthDate)
        return birthDate.month() === selectedDate.month()
      })
      setBirthdays(monthBirthdays)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/department')
      setDepartments(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch departments:', err)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data?.data?.department) {
        setUserDepartment(response.data.data.department)
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  }

  // Get available departments for the current user
  const getAvailableDepartments = () => {
    if (user?.role === 'HR' || user?.role === 'ADMIN') {
      // HR and ADMIN can select any department or company-wide
      return [
        { id: null, name: t('calendar.companyWide') || 'Company-wide (All Departments)' },
        ...departments
      ]
    } else if (user?.role === 'DEPARTMENT_MANAGER') {
      // Department Manager can only select their own department or company-wide
      return [
        { id: null, name: t('calendar.companyWide') || 'Company-wide (All Departments)' },
        ...(userDepartment ? [userDepartment] : [])
      ]
    }
    return []
  }

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        ...newEvent,
        eventDate: newEvent.eventDate,
        endDate: newEvent.endDate || null,
        startTime: newEvent.isAllDay ? null : newEvent.startTime || null,
        endTime: newEvent.isAllDay ? null : newEvent.endTime || null,
        department: newEvent.departmentId ? { id: newEvent.departmentId } : null
      }
      
      await api.post('/calendar-events', eventData)
      setSuccess('Event created successfully')
      setOpenDialog(false)
      setNewEvent({
        title: '',
        description: '',
        eventDate: dayjs().format('YYYY-MM-DD'),
        endDate: '',
        startTime: '',
        endTime: '',
        eventType: 'EVENT',
        isAllDay: false,
        departmentId: null
      })
      loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleUpdateEvent = async () => {
    try {
      const eventData = {
        ...selectedEvent,
        eventDate: selectedEvent.eventDate,
        endDate: selectedEvent.endDate || null,
        startTime: selectedEvent.isAllDay ? null : selectedEvent.startTime || null,
        endTime: selectedEvent.isAllDay ? null : selectedEvent.endTime || null,
        department: selectedEvent.departmentId ? { id: selectedEvent.departmentId } : null
      }
      
      await api.put(`/calendar-events/${selectedEvent.id}`, eventData)
      setSuccess('Event updated successfully')
      setOpenEditDialog(false)
      setSelectedEvent(null)
      loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm(t('calendar.confirmDelete') || 'Are you sure you want to delete this event?')) {
      return
    }
    try {
      await api.delete(`/calendar-events/${id}`)
      setSuccess('Event deleted successfully')
      loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

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

  const getEventsForDate = (date) => {
    return calendarEvents.filter(event => {
      const eventDate = dayjs(event.eventDate)
      const endDate = event.endDate ? dayjs(event.endDate) : eventDate
      // Event is on this date if date is between eventDate and endDate (inclusive)
      return (date.isSame(eventDate, 'day') || date.isAfter(eventDate, 'day')) &&
             (date.isSame(endDate, 'day') || date.isBefore(endDate, 'day'))
    })
  }

  // Check if event is multi-day
  const isMultiDayEvent = (event) => {
    if (!event.endDate) {
      return false
    }
    try {
      const start = dayjs(event.eventDate)
      const end = dayjs(event.endDate)
      const isMulti = !start.isSame(end, 'day')
      return isMulti
    } catch (e) {
      console.error('Error checking multi-day event:', e, event)
      return false
    }
  }

  const getBirthdaysForDate = (date) => {
    return birthdays.filter(emp => {
      if (!emp.birthDate) return false
      const birthDate = dayjs(emp.birthDate)
      return birthDate.date() === date.date() && birthDate.month() === date.month()
    })
  }

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'TRAINING':
        return 'info.main'
      case 'MEETING':
        return 'primary.main'
      case 'HOLIDAY':
        return 'warning.main'
      case 'BIRTHDAY':
        return 'secondary.main'
      default:
        return 'success.main'
    }
  }

  const weeks = []
  const days = getDaysInMonth(selectedDate)
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const renderCalendar = () => {
    return (
      <Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {[t('leaveRequests.sun') || 'Sun', t('leaveRequests.mon') || 'Mon', t('leaveRequests.tue') || 'Tue', 
            t('leaveRequests.wed') || 'Wed', t('leaveRequests.thu') || 'Thu', t('leaveRequests.fri') || 'Fri', 
            t('leaveRequests.sat') || 'Sat'].map(day => (
            <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', fontWeight: 'bold', p: 1 }}>
              {day}
            </Typography>
          ))}
        </Box>
        {weeks.map((week, weekIndex) => {
          // Separate single-day and multi-day events
          const monthStart = selectedDate.startOf('month')
          const monthEnd = selectedDate.endOf('month')
          
          // Filter and map multi-day events
          const multiDayEvents = calendarEvents
            .filter(event => {
              const isMulti = isMultiDayEvent(event)
              return isMulti
            })
            .map(event => {
              const startDate = dayjs(event.eventDate)
              const endDate = dayjs(event.endDate)
              return {
                ...event,
                displayStart: startDate.isBefore(monthStart) ? monthStart : startDate,
                displayEnd: endDate.isAfter(monthEnd) ? monthEnd : endDate
              }
            })
          
          const weekMultiDayEvents = multiDayEvents.filter(event => {
            const weekStart = week[0]
            const weekEnd = week[6]
            return (event.displayStart.isBefore(weekEnd) || event.displayStart.isSame(weekEnd, 'day')) &&
                   (event.displayEnd.isAfter(weekStart) || event.displayEnd.isSame(weekStart, 'day'))
          })

          const calculateStackLevels = (events) => {
            if (events.length === 0) return new Map()
            
            const weekStart = week[0]
            const weekEnd = week[6]
            
            const sorted = [...events].sort((a, b) => {
              const aStart = a.displayStart.isBefore(weekStart) ? weekStart : a.displayStart
              const bStart = b.displayStart.isBefore(weekStart) ? weekStart : b.displayStart
              return aStart.diff(bStart, 'day')
            })
            
            const levels = new Map()
            sorted.forEach(event => {
              const displayStart = event.displayStart.isBefore(weekStart) ? weekStart : event.displayStart
              const displayEnd = event.displayEnd.isAfter(weekEnd) ? weekEnd : event.displayEnd
              
              let level = 0
              while (true) {
                const hasOverlap = Array.from(levels.entries()).some(([otherId, otherLevel]) => {
                  if (otherLevel !== level) return false
                  const otherEvent = events.find(e => e.id === otherId)
                  if (!otherEvent) return false
                  const otherStart = otherEvent.displayStart.isBefore(weekStart) ? weekStart : otherEvent.displayStart
                  const otherEnd = otherEvent.displayEnd.isAfter(weekEnd) ? weekEnd : otherEvent.displayEnd
                  return (displayStart.isBefore(otherEnd) || displayStart.isSame(otherEnd, 'day')) &&
                         (displayEnd.isAfter(otherStart) || displayEnd.isSame(otherStart, 'day'))
                })
                if (!hasOverlap) break
                level++
              }
              levels.set(event.id, level)
            })
            
            return levels
          }
          
          const levelMap = calculateStackLevels(weekMultiDayEvents)
          const maxStacks = weekMultiDayEvents.length > 0 
            ? Math.max(...Array.from(levelMap.values()), 0) + 1 
            : 1
          const rowHeight = maxStacks * 28 + 8
          
          return (
            <Box key={weekIndex} sx={{ mb: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 0.5, position: 'relative' }}>
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.month() === selectedDate.month()
                  const isToday = day.isSame(dayjs(), 'day')
                  // Only show single-day events in the day boxes
                  const dayEvents = getEventsForDate(day).filter(event => !isMultiDayEvent(event))
                  const dayBirthdays = getBirthdaysForDate(day)
                  
                  return (
                    <Box
                      key={dayIndex}
                      sx={{
                        minHeight: 100,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        bgcolor: isCurrentMonth ? 'background.paper' : 'grey.50',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        width: '100%',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      onClick={() => {
                        if (canEdit) {
                          setNewEvent(prev => ({ ...prev, eventDate: day.format('YYYY-MM-DD') }))
                          setOpenDialog(true)
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isToday ? 'bold' : 'normal',
                          color: isToday ? 'primary.main' : 'text.primary',
                          mb: 0.5,
                          flexShrink: 0
                        }}
                      >
                        {day.format('D')}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 0.5, 
                        flex: 1,
                        overflow: 'visible',
                        width: '100%'
                      }}>
                        {dayBirthdays.map((birthday, idx) => (
                          <Chip
                            key={`birthday-${idx}`}
                            icon={<CakeIcon sx={{ fontSize: '0.8rem !important' }} />}
                            label={`${birthday.user?.firstName || ''} ${birthday.user?.lastName || ''}`.trim() || 'Birthday'}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.65rem',
                              bgcolor: 'secondary.light',
                              color: 'secondary.contrastText',
                              '& .MuiChip-icon': {
                                fontSize: '0.7rem'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          />
                        ))}
                        {dayEvents.map((event, idx) => (
                          <Chip
                            key={`event-${event.id}-${idx}`}
                            label={event.title}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.65rem',
                              bgcolor: getEventColor(event.eventType),
                              color: 'white',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent({
                                ...event,
                                departmentId: event.department?.id || null
                              })
                              setOpenEditDialog(true)
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )
                })}
              </Box>
              
              {/* Multi-day event bars */}
              {weekMultiDayEvents.length > 0 && (
                <Box sx={{ 
                  position: 'relative', 
                  minHeight: rowHeight, 
                  mb: 1, 
                  mt: 0.5, 
                  width: '100%',
                  backgroundColor: 'transparent'
                }}>
                  {weekMultiDayEvents.map((event) => {
                    const weekStart = week[0]
                    const weekEnd = week[6]
                    const displayStart = event.displayStart.isBefore(weekStart) ? weekStart : event.displayStart
                    const displayEnd = event.displayEnd.isAfter(weekEnd) ? weekEnd : event.displayEnd
                    
                    const startCol = displayStart.diff(weekStart, 'day')
                    const span = displayEnd.diff(displayStart, 'day') + 1
                    
                    const stackLevel = levelMap.get(event.id) || 0
                    const isStartOfEvent = event.displayStart.isSame(displayStart, 'day')
                    const isEndOfEvent = event.displayEnd.isSame(displayEnd, 'day')
                    
                    return (
                      <Box
                        key={`${event.id}-${weekIndex}`}
                        sx={{
                          position: 'absolute',
                          left: `calc(${startCol * (100 / 7)}% + ${startCol * 4}px)`,
                          width: `calc(${span * (100 / 7)}% - ${(span - 1) * 4}px)`,
                          height: 26,
                          bgcolor: getEventColor(event.eventType),
                          borderRadius: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 0.5,
                          top: stackLevel * 28,
                          zIndex: 1,
                          border: '1px solid',
                          borderColor: getEventColor(event.eventType),
                          borderTopLeftRadius: isStartOfEvent ? '4px' : '0px',
                          borderBottomLeftRadius: isStartOfEvent ? '4px' : '0px',
                          borderTopRightRadius: isEndOfEvent ? '4px' : '0px',
                          borderBottomRightRadius: isEndOfEvent ? '4px' : '0px',
                          borderLeftWidth: isStartOfEvent ? '1px' : '0px',
                          borderRightWidth: isEndOfEvent ? '1px' : '0px',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        onClick={() => {
                          setSelectedEvent({
                            ...event,
                            departmentId: event.department?.id || null
                          })
                          setOpenEditDialog(true)
                        }}
                        title={`${event.title} (${dayjs(event.eventDate).format('MMM D')} - ${dayjs(event.endDate).format('MMM D')})`}
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
                          {event.title}
                        </Typography>
                        {canEdit && (
                          <IconButton
                            size="small"
                            sx={{ ml: 'auto', color: 'white', p: 0.5 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEvent(event.id)
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        )}
                      </Box>
                    )
                  })}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              <CalendarIcon sx={{ fontSize: 28, color: 'white' }} />
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
            {t('pageTitles.companyCalendar')}
          </Typography>
            </Box>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setNewEvent({
                title: '',
                description: '',
                eventDate: dayjs().format('YYYY-MM-DD'),
                endDate: '',
                startTime: '',
                endTime: '',
                eventType: 'EVENT',
                isAllDay: false,
                departmentId: null
              })
              setOpenDialog(true)
            }}
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
            {t('calendar.addEvent') || 'Add Event'}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Calendar Navigation */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            overflow: 'visible',
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, 'month'))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {selectedDate.locale(i18n.language === 'tr' ? 'tr' : 'en').format('MMMM YYYY')}
          </Typography>
          <IconButton onClick={() => setSelectedDate(dayjs(selectedDate).add(1, 'month'))}>
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Calendar View */}
        <Box sx={{ width: '100%', overflow: 'visible' }}>
          {renderCalendar()}
        </Box>
      </Paper>

      {/* Legend */}
        <Paper 
          sx={{ 
            p: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('calendar.legend') || 'Legend'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 24, height: 16, bgcolor: 'success.main', borderRadius: 0.5 }} />
            <Typography variant="body2">{t('calendar.event') || 'Event'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 24, height: 16, bgcolor: 'info.main', borderRadius: 0.5 }} />
            <Typography variant="body2">{t('calendar.training') || 'Training'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 24, height: 16, bgcolor: 'primary.main', borderRadius: 0.5 }} />
            <Typography variant="body2">{t('calendar.meeting') || 'Meeting'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 24, height: 16, bgcolor: 'warning.main', borderRadius: 0.5 }} />
            <Typography variant="body2">{t('calendar.holiday') || 'Holiday'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CakeIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
            <Typography variant="body2">{t('calendar.birthday') || 'Birthday'}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Create Event Dialog */}
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
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)'
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
          {t('calendar.addEvent') || 'Add Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('calendar.title') || 'Title'}
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('calendar.description') || 'Description'}
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label={t('calendar.eventDate') || 'Start Date'}
              type="date"
              value={newEvent.eventDate}
              onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
            <TextField
              label={t('calendar.endDate') || 'End Date (Optional - for multi-day events)'}
              type="date"
              value={newEvent.endDate}
              onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText={t('calendar.endDateHelper') || 'Leave empty for single-day events'}
            />
            <FormControl fullWidth>
              <InputLabel>{t('calendar.eventType') || 'Event Type'}</InputLabel>
              <Select
                value={newEvent.eventType}
                onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                label={t('calendar.eventType') || 'Event Type'}
              >
                <MenuItem value="EVENT">{t('calendar.event') || 'Event'}</MenuItem>
                <MenuItem value="TRAINING">{t('calendar.training') || 'Training'}</MenuItem>
                <MenuItem value="MEETING">{t('calendar.meeting') || 'Meeting'}</MenuItem>
                <MenuItem value="HOLIDAY">{t('calendar.holiday') || 'Holiday'}</MenuItem>
                <MenuItem value="OTHER">{t('calendar.other') || 'Other'}</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                checked={newEvent.isAllDay}
                onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
              />
              <Typography variant="body2">{t('calendar.allDay') || 'All Day'}</Typography>
            </Box>
            {!newEvent.isAllDay && (
              <>
                <TextField
                  label={t('calendar.startTime') || 'Start Time'}
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={t('calendar.endTime') || 'End Time'}
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </>
            )}
            {(user?.role === 'HR' || user?.role === 'DEPARTMENT_MANAGER' || user?.role === 'ADMIN') && (
              <FormControl fullWidth>
                <InputLabel>{t('calendar.department') || 'Department'}</InputLabel>
                <Select
                  value={newEvent.departmentId || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, departmentId: e.target.value || null })}
                  label={t('calendar.department') || 'Department'}
                >
                  {getAvailableDepartments().map((dept) => (
                    <MenuItem key={dept.id || 'company-wide'} value={dept.id || null}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleCreateEvent} 
            variant="contained" 
            disabled={!newEvent.title || !newEvent.eventDate}
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
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View/Edit Event Dialog */}
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
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)'
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
          {canEdit ? (t('calendar.editEvent') || 'Edit Event') : (t('calendar.eventDetails') || 'Event Details')}
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label={t('calendar.title') || 'Title'}
                value={selectedEvent.title || ''}
                onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, title: e.target.value }) : undefined}
                required
                fullWidth
                disabled={!canEdit}
                InputProps={{
                  readOnly: !canEdit
                }}
              />
              <TextField
                label={t('calendar.description') || 'Description'}
                value={selectedEvent.description || ''}
                onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, description: e.target.value }) : undefined}
                multiline
                rows={3}
                fullWidth
                disabled={!canEdit}
                InputProps={{
                  readOnly: !canEdit
                }}
              />
              <TextField
                label={t('calendar.eventDate') || 'Start Date'}
                type="date"
                value={selectedEvent.eventDate ? dayjs(selectedEvent.eventDate).format('YYYY-MM-DD') : ''}
                onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, eventDate: e.target.value }) : undefined}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                disabled={!canEdit}
                InputProps={{
                  readOnly: !canEdit
                }}
              />
              <TextField
                label={t('calendar.endDate') || 'End Date (Optional - for multi-day events)'}
                type="date"
                value={selectedEvent.endDate ? dayjs(selectedEvent.endDate).format('YYYY-MM-DD') : ''}
                onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, endDate: e.target.value || null }) : undefined}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText={t('calendar.endDateHelper') || 'Leave empty for single-day events'}
                disabled={!canEdit}
                InputProps={{
                  readOnly: !canEdit
                }}
              />
              <FormControl fullWidth disabled={!canEdit}>
                <InputLabel>{t('calendar.eventType') || 'Event Type'}</InputLabel>
                <Select
                  value={selectedEvent.eventType || 'EVENT'}
                  onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, eventType: e.target.value }) : undefined}
                  label={t('calendar.eventType') || 'Event Type'}
                  readOnly={!canEdit}
                >
                  <MenuItem value="EVENT">{t('calendar.event') || 'Event'}</MenuItem>
                  <MenuItem value="TRAINING">{t('calendar.training') || 'Training'}</MenuItem>
                  <MenuItem value="MEETING">{t('calendar.meeting') || 'Meeting'}</MenuItem>
                  <MenuItem value="HOLIDAY">{t('calendar.holiday') || 'Holiday'}</MenuItem>
                  <MenuItem value="OTHER">{t('calendar.other') || 'Other'}</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="checkbox"
                  checked={selectedEvent.isAllDay || false}
                  onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, isAllDay: e.target.checked }) : undefined}
                  disabled={!canEdit}
                />
                <Typography variant="body2">{t('calendar.allDay') || 'All Day'}</Typography>
              </Box>
              {!selectedEvent.isAllDay && (
                <>
                  <TextField
                    label={t('calendar.startTime') || 'Start Time'}
                    type="time"
                    value={selectedEvent.startTime || ''}
                    onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, startTime: e.target.value }) : undefined}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    disabled={!canEdit}
                    InputProps={{
                      readOnly: !canEdit
                    }}
                  />
                  <TextField
                    label={t('calendar.endTime') || 'End Time'}
                    type="time"
                    value={selectedEvent.endTime || ''}
                    onChange={canEdit ? (e) => setSelectedEvent({ ...selectedEvent, endTime: e.target.value }) : undefined}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    disabled={!canEdit}
                    InputProps={{
                      readOnly: !canEdit
                    }}
                  />
                </>
              )}
              {canEdit && (user?.role === 'HR' || user?.role === 'DEPARTMENT_MANAGER' || user?.role === 'ADMIN') && (
                <FormControl fullWidth>
                  <InputLabel>{t('calendar.department') || 'Department'}</InputLabel>
                  <Select
                    value={selectedEvent.departmentId !== undefined ? (selectedEvent.departmentId || '') : (selectedEvent.department?.id || '')}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, departmentId: e.target.value || null })}
                    label={t('calendar.department') || 'Department'}
                  >
                    {getAvailableDepartments().map((dept) => (
                      <MenuItem key={dept.id || 'company-wide'} value={dept.id || null}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {!canEdit && (
                <TextField
                  label={t('calendar.department') || 'Department'}
                  value={selectedEvent.department?.name || (t('calendar.companyWide') || 'Company-wide (All Departments)')}
                  fullWidth
                  disabled
                  InputProps={{
                    readOnly: true
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {canEdit ? t('common.cancel') : t('common.close')}
          </Button>
          {canEdit && (
            <>
              <Button 
                onClick={() => handleDeleteEvent(selectedEvent?.id)} 
                variant="outlined" 
                color="error"
                sx={{ borderRadius: 2 }}
              >
                {t('common.delete')}
              </Button>
              <Button 
                onClick={handleUpdateEvent} 
                variant="contained" 
                disabled={!selectedEvent?.title || !selectedEvent?.eventDate}
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
                {t('common.save')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  )
}

export default CompanyCalendar

