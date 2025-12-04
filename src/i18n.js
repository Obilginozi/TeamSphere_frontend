import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import tr from './locales/tr.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr }
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    returnEmptyString: false,
    returnNull: false,
    keySeparator: '.',
    nsSeparator: false,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed'
    },
    debug: false
  })

export default i18n
