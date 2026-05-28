import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './translations/en.json';
import hi from './translations/hi.json';
import te from './translations/te.json';
import kn from './translations/kn.json';

const translations = { en, hi, te, kn };

const LANG_KEY = 'smartqr_lang';

const LANG_SPEECH_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  kn: 'kn-IN',
};

const LanguageContext = createContext();

/**
 * Resolve a dotted key like "nav.home" from a translation object.
 */
function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    // 1. Check localStorage
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && translations[stored]) return stored;

    // 2. Check browser language
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && translations[browserLang]) return browserLang;

    return 'en';
  });

  // Persist selection
  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLanguage = useCallback((code) => {
    if (translations[code]) setLangState(code);
  }, []);

  /**
   * Translate a key. Falls back to English if key is missing in current language.
   * Supports template variables: t('key', { days: 5 }) → "expired 5 days ago"
   */
  const t = useCallback(
    (key, vars) => {
      let text = resolve(translations[lang], key) || resolve(translations.en, key) || key;
      if (vars && typeof text === 'string') {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
      }
      return text;
    },
    [lang]
  );

  const speechLang = LANG_SPEECH_MAP[lang] || 'en-IN';

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, speechLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
