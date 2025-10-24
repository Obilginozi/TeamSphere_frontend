import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  TablePagination
} from '@mui/material'
import {
  AccessTime,
  CalendarToday,
  TrendingUp,
  Download
} from '@mui/icons-material'
import api from '../services/api'

const MyTimeHistory = () => {
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState({
    totalHours: 0,
    daysWorked: 0,
    averageHours: 0,
    overtime: 0
  })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchTimeHistory()
    fetchStats()
  }, [page, rowsPerPage, startDate, endDate])

  const fetchTimeHistory = async () => {
    try {
      const params = {
        page,
        size: rowsPerPage,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }
      const response = await api.get('/api/time-logs/my-history', { params })
      setRecords(response.data.data.content || [])
      setTotalElements(response.data.data.totalElements || 0)
    } catch (error) {
      console.error('Error fetching time history:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/time-logs/my-stats', {
        params: { startDate, endDate }
      })
      setStats(response.data.data || stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const formatTime = (dateTime) => {
    if (!dateTime) return '-'
    return new Date(dateTime).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'
    const diff = new Date(checkOut) - new Date(checkIn)
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/api/time-logs/export/my-history', {
        responseType: 'blob',
        params: { startDate, endDate }
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `my_time_history_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Time History
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Total Hours
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.totalHours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Days Worked
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.daysWorked}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Average Hours/Day
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.averageHours}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="body2">
                  Overtime
                </Typography>
              </Box>
              <Typography variant="h4">
                {stats.overtime}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Export to Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Time Records Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Break Time</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{formatTime(record.checkInTime)}</TableCell>
                  <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                  <TableCell>{record.breakDuration || '0'} min</TableCell>
                  <TableCell>{calculateDuration(record.checkInTime, record.checkOutTime)}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.checkOutTime ? 'COMPLETED' : 'IN_PROGRESS'}
                      color={record.checkOutTime ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  )
}

export default MyTimeHistory

