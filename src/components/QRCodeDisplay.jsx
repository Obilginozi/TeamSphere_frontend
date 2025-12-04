import React, { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress, Alert, Button, Paper } from '@mui/material'
import { Download, Refresh } from '@mui/icons-material'
import { QRCodeSVG } from 'qrcode.react'
import api from '../services/api'

/**
 * QR Code Display Component
 * Displays QR code following ISO/IEC 18004 standard
 * Can generate QR code from backend or display from data
 */
const QRCodeDisplay = ({ employeeId, qrData, size = 300, showDownload = true }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [qrCodeData, setQrCodeData] = useState(qrData || null)
  const [qrCodeImage, setQrCodeImage] = useState(null)

  useEffect(() => {
    if (employeeId && !qrData) {
      loadQRCode()
    } else if (qrData) {
      setQrCodeData(qrData)
    }
  }, [employeeId, qrData])

  const loadQRCode = async () => {
    if (!employeeId) return

    setLoading(true)
    setError(null)

    try {
      const response = await api.get(`/employee/${employeeId}/qr-code?width=${size}&height=${size}`)
      const qrCodeInfo = response.data.data

      // Parse QR data if it's a JSON string
      let parsedData = qrCodeInfo.data
      if (typeof parsedData === 'string' && parsedData.startsWith('{')) {
        try {
          const jsonData = JSON.parse(parsedData)
          parsedData = JSON.stringify(jsonData)
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }

      setQrCodeData(parsedData)
      setQrCodeImage(qrCodeInfo.image)
    } catch (err) {
      console.error('Failed to load QR code:', err)
      setError(err.response?.data?.message || 'Failed to load QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!employeeId) return

    try {
      const response = await api.get(`/access/qr-code/${employeeId}/download`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `qr-code-${employeeId}.png`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download QR code:', err)
      setError('Failed to download QR code')
    }
  }

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Generating QR code...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!qrCodeData) {
    return (
      <Alert severity="info">
        No QR code data available. Please provide employee ID or QR code data.
      </Alert>
    )
  }

  return (
    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="h6" gutterBottom>
        Employee QR Code
      </Typography>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        ISO/IEC 18004 Standard
      </Typography>

      <Box
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <QRCodeSVG
          value={qrCodeData}
          size={size}
          level="H" // High error correction (ISO/IEC 18004)
          includeMargin={true}
          imageSettings={
            qrCodeImage
              ? {
                  src: qrCodeImage,
                  height: size * 0.2,
                  width: size * 0.2,
                  excavate: true,
                }
              : undefined
          }
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadQRCode}
          disabled={!employeeId}
        >
          Refresh
        </Button>
        {showDownload && employeeId && (
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownload}
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
            Download PNG
          </Button>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        Scan this QR code with any standard QR code reader
      </Typography>
    </Paper>
  )
}

export default QRCodeDisplay

