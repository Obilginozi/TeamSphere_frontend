import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material'
import {
  Description as DescriptionIcon,
  Home as HomeIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

// Simple markdown-to-HTML converter (basic implementation)
const renderMarkdown = (markdown) => {
  if (!markdown) return ''
  
  let html = markdown
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
  
  // Code blocks
  html = html.replace(/```(.*?)```/gims, '<pre><code>$1</code></pre>')
  
  // Inline code
  html = html.replace(/`(.*?)`/gim, '<code>$1</code>')
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  
  return html
}

const WikiViewer = () => {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/wiki')
      setDocuments(response.data.data)
      if (response.data.data.length > 0) {
        setSelectedDocument(response.data.data[0])
      }
    } catch (error) {
      console.error('Failed to fetch wiki documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = []
    }
    acc[doc.category].push(doc)
    return acc
  }, {})

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Documentation Wiki
      </Typography>

      <Grid container spacing={3}>
        {/* Sidebar Navigation */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Categories
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {Object.keys(groupedDocs).map((category) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    {category.replace(/_/g, ' ')}
                  </Typography>
                  <List dense>
                    {groupedDocs[category].map((doc) => (
                      <ListItem key={doc.id} disablePadding>
                        <ListItemButton
                          selected={selectedDocument?.id === doc.id}
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <DescriptionIcon sx={{ mr: 1, fontSize: 18 }} />
                          <ListItemText 
                            primary={doc.title}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              {selectedDocument ? (
                <>
                  <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                      underline="hover"
                      sx={{ display: 'flex', alignItems: 'center' }}
                      color="inherit"
                      href="#"
                    >
                      <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                      Wiki
                    </Link>
                    <Typography color="text.primary">
                      {selectedDocument.category.replace(/_/g, ' ')}
                    </Typography>
                    <Typography color="text.primary">
                      {selectedDocument.title}
                    </Typography>
                  </Breadcrumbs>

                  <Typography variant="h4" gutterBottom>
                    {selectedDocument.title}
                  </Typography>

                  {selectedDocument.description && (
                    <Typography variant="body1" color="textSecondary" paragraph>
                      {selectedDocument.description}
                    </Typography>
                  )}

                  <Chip
                    label={selectedDocument.category.replace(/_/g, ' ')}
                    size="small"
                    color="primary"
                    sx={{ mb: 2 }}
                  />

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      '& h1': { fontSize: '2rem', fontWeight: 'bold', mt: 3, mb: 2 },
                      '& h2': { fontSize: '1.5rem', fontWeight: 'bold', mt: 2.5, mb: 1.5 },
                      '& h3': { fontSize: '1.25rem', fontWeight: 'bold', mt: 2, mb: 1 },
                      '& p': { mb: 2, lineHeight: 1.7 },
                      '& ul': { mb: 2, pl: 3 },
                      '& li': { mb: 0.5 },
                      '& code': { 
                        bgcolor: 'grey.100', 
                        p: 0.5, 
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      },
                      '& pre': { 
                        bgcolor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1,
                        overflow: 'auto',
                        '& code': { bgcolor: 'transparent', p: 0 }
                      },
                      '& a': { color: 'primary.main', textDecoration: 'underline' }
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDocument.content) }}
                  />

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary">
                      Last updated: {new Date(selectedDocument.updatedAt).toLocaleString()}
                    </Typography>
                    {selectedDocument.updatedByUserName && (
                      <Typography variant="caption" color="textSecondary">
                        By: {selectedDocument.updatedByUserName}
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    Select a document to view
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default WikiViewer

