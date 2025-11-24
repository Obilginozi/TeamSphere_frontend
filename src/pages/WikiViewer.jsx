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
  Chip,
  Paper,
  InputBase,
  IconButton,
  Container,
  Button
} from '@mui/material'
import {
  Description as DescriptionIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  GetApp as DownloadIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import api from '../services/api'

// Enhanced markdown-to-HTML converter with wiki standards
const renderMarkdown = (markdown) => {
  if (!markdown) return ''
  
  let html = markdown
  
  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr />')
  html = html.replace(/^\*\*\*$/gim, '<hr />')
  
  // Headers (with proper hierarchy)
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>')
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>')
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>')
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // Bold and italic (order matters)
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
  
  // Strikethrough
  html = html.replace(/~~(.*?)~~/gim, '<del>$1</del>')
  
  // Code blocks (fenced)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
  
  // Inline code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>')
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
  
  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/gims, (match) => {
    return '<ol>' + match + '</ol>'
  })
  
  // Unordered lists
  html = html.replace(/^[-*+]\s+(.*)$/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/gims, (match) => {
    if (!match.includes('<ol>')) {
      return '<ul>' + match + '</ul>'
    }
    return match
  })
  
  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gim, '<blockquote>$1</blockquote>')
  html = html.replace(/(<blockquote>.*<\/blockquote>\n?)+/gims, (match) => {
    return match.replace(/<\/blockquote>\n<blockquote>/g, '<br />')
  })
  
  // Tables (basic support)
  html = html.replace(/\|(.+)\|/gim, (match) => {
    const cells = match.split('|').filter(c => c.trim())
    if (cells.length > 0) {
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
    }
    return match
  })
  
  // Paragraphs (handle line breaks)
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br />')
  html = '<p>' + html + '</p>'
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-6]>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<ul>|<ol>|<pre>|<blockquote>)/g, '$1')
  html = html.replace(/(<\/ul>|<\/ol>|<\/pre>|<\/blockquote>)<\/p>/g, '$1')
  
  return html
}

const WikiViewer = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [wikiDocuments, setWikiDocuments] = useState([])
  const [docFiles, setDocFiles] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('documentation') // 'documentation' or 'wiki'

  // Restrict access to ADMIN only
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchAllDocuments()
  }, [])

  const fetchAllDocuments = async () => {
    try {
      setLoading(true)
      
      // Fetch wiki documents and documentation files in parallel
      const [wikiResponse, docResponse] = await Promise.allSettled([
        api.get('/admin/wiki').catch(() => ({ data: { data: [] } })),
        api.get('/documentation').catch(() => ({ data: { data: [] } }))
      ])
      
      const wikiDocs = wikiResponse.status === 'fulfilled' 
        ? (wikiResponse.value.data.data || [])
        : []
      const files = docResponse.status === 'fulfilled'
        ? (docResponse.value.data.data || [])
        : []
      
      setWikiDocuments(wikiDocs)
      setDocFiles(files)
      
      // Select first documentation file by default, or first wiki doc
      if (files.length > 0) {
        setSelectedDocument({
          id: 'doc-' + files[0].name,
          title: files[0].name.replace('.md', '').replace('.pdf', ''),
          category: files[0].category,
          content: files[0].content || '',
          type: files[0].type,
          downloadUrl: files[0].downloadUrl,
          path: files[0].path
        })
      } else if (wikiDocs.length > 0) {
        setSelectedDocument(wikiDocs[0])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Combine wiki documents and doc files for grouping
  const allDocuments = [
    ...wikiDocuments.map(doc => ({ ...doc, source: 'wiki' })),
    ...docFiles.map(file => ({
      id: 'doc-' + file.name,
      title: file.name.replace('.md', '').replace('.pdf', ''),
      category: file.category,
      content: file.content || '',
      type: file.type,
      downloadUrl: file.downloadUrl,
      path: file.path,
      source: 'file',
      description: `Documentation file: ${file.name}`
    }))
  ]

  const groupedDocs = allDocuments.reduce((acc, doc) => {
    const category = doc.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(doc)
    return acc
  }, {})

  // Filter documents based on search query (searches in title, description, and content)
  const filteredDocuments = searchQuery
    ? allDocuments.filter(
        doc => {
          const query = searchQuery.toLowerCase()
          const titleMatch = doc.title?.toLowerCase().includes(query)
          const descMatch = doc.description?.toLowerCase().includes(query)
          const contentMatch = doc.content?.toLowerCase().includes(query)
          
          // If content matches, also store match context for highlighting
          if (contentMatch && doc.content) {
            const contentLower = doc.content.toLowerCase()
            const index = contentLower.indexOf(query)
            if (index !== -1) {
              // Store snippet around the match (100 chars before and after)
              const start = Math.max(0, index - 100)
              const end = Math.min(doc.content.length, index + query.length + 100)
              const snippet = doc.content.substring(start, end)
              // Escape special regex characters and highlight the search term in the snippet
              const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              const highlightedSnippet = snippet.replace(
                new RegExp(`(${escapedQuery})`, 'gi'),
                '<mark>$1</mark>'
              )
              doc.searchSnippet = '...' + highlightedSnippet + '...'
              doc.searchSnippetHtml = true // Flag to indicate HTML content
            }
          }
          
          return titleMatch || descMatch || contentMatch
        }
      )
    : allDocuments

  const filteredGroupedDocs = searchQuery
    ? filteredDocuments.reduce((acc, doc) => {
        const category = doc.category || 'other'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(doc)
        return acc
      }, {})
    : groupedDocs

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Wiki Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MenuBookIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 600 }}>
            Documentation Wiki
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Comprehensive documentation and knowledge base for TeamSphere platform
        </Typography>
      </Box>

      {/* Tabs for Documentation vs Wiki */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={activeTab === 'documentation' ? 'contained' : 'outlined'}
              onClick={() => {
                setActiveTab('documentation')
                if (docFiles.length > 0) {
                  setSelectedDocument({
                    id: 'doc-' + docFiles[0].name,
                    title: docFiles[0].name.replace('.md', '').replace('.pdf', ''),
                    category: docFiles[0].category,
                    content: docFiles[0].content || '',
                    type: docFiles[0].type,
                    downloadUrl: docFiles[0].downloadUrl,
                    path: docFiles[0].path
                  })
                }
              }}
            >
              Documentation Files
            </Button>
            <Button
              variant={activeTab === 'wiki' ? 'contained' : 'outlined'}
              onClick={() => {
                setActiveTab('wiki')
                if (wikiDocuments.length > 0) {
                  setSelectedDocument(wikiDocuments[0])
                }
              }}
            >
              Wiki Articles
            </Button>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              href="/api/swagger-ui.html"
              target="_blank"
              sx={{ ml: 'auto' }}
            >
              Swagger API Docs
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper
        component="form"
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          boxShadow: 2
        }}
      >
        <IconButton sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* Sidebar Navigation */}
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            position: 'sticky', 
            top: 20, 
            boxShadow: 3,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 100px)'
          }}>
            <CardContent sx={{ 
              flex: '0 0 auto',
              pb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Categories
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
            </CardContent>
            <Box sx={{ 
              flex: '1 1 auto',
              overflowY: 'auto',
              overflowX: 'hidden',
              px: 2,
              pb: 2
            }}>
              {Object.keys(filteredGroupedDocs).length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  {searchQuery ? 'No results found' : 'No documents available'}
                </Typography>
              ) : (
                Object.keys(filteredGroupedDocs).map((category) => (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        mb: 1,
                        textTransform: 'capitalize'
                      }}
                    >
                      {category.replace(/_/g, ' ')}
                    </Typography>
                    <List dense>
                      {filteredGroupedDocs[category].map((doc) => {
                        const isSelected = selectedDocument?.id === doc.id
                        const Icon = doc.type === 'pdf' ? PdfIcon : doc.type === 'markdown' ? CodeIcon : DescriptionIcon
                        
                        return (
                          <ListItem key={doc.id} disablePadding>
                            <ListItemButton
                              selected={isSelected}
                              onClick={() => setSelectedDocument(doc)}
                              sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                '&.Mui-selected': {
                                  bgcolor: 'primary.light',
                                  color: 'primary.contrastText',
                                  '&:hover': {
                                    bgcolor: 'primary.main'
                                  }
                                }
                              }}
                            >
                              <Icon sx={{ mr: 1, fontSize: 18 }} />
                              <ListItemText
                                primary={doc.title}
                                secondary={searchQuery && doc.searchSnippet ? (
                                  <Typography
                                    variant="caption"
                                    component="div"
                                    sx={{
                                      display: 'block',
                                      mt: 0.5,
                                      color: 'text.secondary',
                                      fontSize: '0.7rem',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      '& mark': {
                                        backgroundColor: 'warning.light',
                                        color: 'warning.contrastText',
                                        padding: '0 2px',
                                        borderRadius: '2px',
                                        fontWeight: 600
                                      }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: doc.searchSnippet }}
                                  />
                                ) : null}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { fontWeight: isSelected ? 600 : 400 }
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        )
                      })}
                    </List>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Card sx={{ boxShadow: 3, minHeight: '600px' }}>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <Typography>Loading documentation...</Typography>
                </Box>
              ) : selectedDocument ? (
                <>
                  <Breadcrumbs sx={{ mb: 3 }}>
                    <Link
                      component="button"
                      variant="body1"
                      underline="hover"
                      sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
                      onClick={() => setSelectedDocument(null)}
                    >
                      <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                      Wiki
                    </Link>
                    <Typography color="text.primary" sx={{ textTransform: 'capitalize' }}>
                      {selectedDocument.category.replace(/_/g, ' ')}
                    </Typography>
                    <Typography color="text.primary" sx={{ fontWeight: 600 }}>
                      {selectedDocument.title}
                    </Typography>
                  </Breadcrumbs>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                          {selectedDocument.title}
                        </Typography>
                        {selectedDocument.description && (
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 400,
                              fontStyle: 'italic'
                            }}
                          >
                            {selectedDocument.description}
                          </Typography>
                        )}
                      </Box>
                      {selectedDocument.downloadUrl && (
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          href={selectedDocument.downloadUrl}
                          target="_blank"
                          size="small"
                        >
                          Download
                        </Button>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        icon={<CategoryIcon />}
                        label={(selectedDocument.category || 'other').replace(/_/g, ' ')}
                        size="small"
                        color="primary"
                        sx={{ textTransform: 'capitalize' }}
                      />
                      {selectedDocument.type && (
                        <Chip
                          icon={selectedDocument.type === 'pdf' ? <PdfIcon /> : <CodeIcon />}
                          label={selectedDocument.type.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Content - Show markdown or PDF download */}
                  {selectedDocument.type === 'pdf' ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <PdfIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                      <Typography variant="h5" gutterBottom>
                        PDF Document
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        This is a PDF file. Click the download button above to view it.
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<DownloadIcon />}
                        href={selectedDocument.downloadUrl}
                        target="_blank"
                      >
                        Download PDF
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      className="wiki-content"
                    sx={{
                      '& h1': {
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        mt: 4,
                        mb: 2,
                        pb: 1,
                        borderBottom: '2px solid',
                        borderColor: 'divider'
                      },
                      '& h2': {
                        fontSize: '2rem',
                        fontWeight: 600,
                        mt: 3,
                        mb: 1.5,
                        pt: 2
                      },
                      '& h3': {
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        mt: 2.5,
                        mb: 1
                      },
                      '& h4': {
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        mt: 2,
                        mb: 1
                      },
                      '& h5, & h6': {
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        mt: 1.5,
                        mb: 0.5
                      },
                      '& p': {
                        mb: 2,
                        lineHeight: 1.8,
                        fontSize: '1rem'
                      },
                      '& ul, & ol': {
                        mb: 2,
                        pl: 4,
                        '& li': {
                          mb: 1,
                          lineHeight: 1.8
                        }
                      },
                      '& code': {
                        bgcolor: 'grey.100',
                        color: 'error.main',
                        p: '2px 6px',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.9em',
                        fontWeight: 500
                      },
                      '& pre': {
                        bgcolor: 'grey.900',
                        color: 'grey.100',
                        p: 2,
                        borderRadius: 2,
                        overflow: 'auto',
                        mb: 2,
                        '& code': {
                          bgcolor: 'transparent',
                          color: 'inherit',
                          p: 0,
                          fontSize: '0.875rem'
                        }
                      },
                      '& a': {
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      },
                      '& blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2,
                        ml: 2,
                        fontStyle: 'italic',
                        color: 'text.secondary',
                        mb: 2
                      },
                      '& hr': {
                        my: 3,
                        border: 'none',
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      },
                      '& img': {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 1,
                        my: 2,
                        boxShadow: 2
                      },
                      '& table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        mb: 2,
                        '& th, & td': {
                          border: '1px solid',
                          borderColor: 'divider',
                          p: 1,
                          textAlign: 'left'
                        },
                        '& th': {
                          bgcolor: 'grey.100',
                          fontWeight: 600
                        }
                      },
                      '& del': {
                        textDecoration: 'line-through',
                        color: 'text.secondary'
                      }
                    }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDocument.content || '') }}
                    />
                  )}
                  
                  <Divider sx={{ my: 4 }} />

                  {/* Footer with metadata */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                      pt: 2
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date(selectedDocument.updatedAt).toLocaleString()}
                    </Typography>
                    {selectedDocument.updatedByUserName && (
                      <Typography variant="body2" color="text.secondary">
                        Updated by: {selectedDocument.updatedByUserName}
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <MenuBookIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    {searchQuery ? 'No documents found' : 'Welcome to Wiki'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Select a document from the sidebar to get started'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default WikiViewer

