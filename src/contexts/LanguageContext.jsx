import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import i18n from '../i18n'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import 'dayjs/locale/en'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en')
  const [isReady, setIsReady] = useState(i18n.isInitialized)
  const [updateTrigger, setUpdateTrigger] = useState(0) // Force re-render when language changes

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.on('initialized', () => {
        setIsReady(true)
      })
    } else {
      setIsReady(true)
    }
    
    i18n.changeLanguage(language)
    localStorage.setItem('language', language)
    // Update dayjs locale when language changes
    dayjs.locale(language === 'tr' ? 'tr' : 'en')
    
    // Force re-render by updating trigger
    setUpdateTrigger(prev => prev + 1)
  }, [language])

  // Listen to i18n language changes to ensure all components update
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setLanguage(lng)
      localStorage.setItem('language', lng)
      dayjs.locale(lng === 'tr' ? 'tr' : 'en')
      setUpdateTrigger(prev => prev + 1)
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  const changeLanguage = (lang) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  // Memoize the value object to ensure React detects changes when language or updateTrigger changes
  const value = useMemo(() => ({
    language,
    changeLanguage,
    updateTrigger, // Include trigger in value to force re-renders
    t: (key, options) => {
      if (!isReady) {
        // Return a fallback while i18n is initializing
        if (key.includes('.')) {
          const parts = key.split('.')
          const lastPart = parts[parts.length - 1]
          return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
        }
        return key
      }
      // Use updateTrigger to ensure this function reference changes
      const translation = i18n.t(key, options)
      // If translation returns the key itself (meaning not found), try to provide a fallback
      if (translation === key && key.includes('.')) {
        const parts = key.split('.')
        const lastPart = parts[parts.length - 1]
        // Return a human-readable version of the last part
        return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
      }
      return translation
    }
  }), [language, isReady, updateTrigger]) // Dependencies ensure value object changes when these change

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
