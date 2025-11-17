import React, { createContext, useContext, useState, useEffect } from 'react'
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
  }, [language])

  const changeLanguage = (lang) => {
    setLanguage(lang)
  }

  const value = {
    language,
    changeLanguage,
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
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
