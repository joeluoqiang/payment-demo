import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import zh from './zh';
import ko from './ko';
import ja from './ja';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  ko: { translation: ko },
  ja: { translation: ja },
};

// 地区代码映射到语言
const COUNTRY_LANGUAGE_MAP: { [key: string]: string } = {
  'GLOBAL': 'en',
  'HK': 'zh',
  'KR': 'ko',
  'JP': 'ja',
  'MY': 'en',
  'ID': 'en',
  'TH': 'en',
  'SG': 'en',
};

// 浏览器语言映射
const BROWSER_LANGUAGE_MAP: { [key: string]: string } = {
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'zh-HK': 'zh',
  'ko': 'ko',
  'ko-KR': 'ko',
  'ja': 'ja',
  'ja-JP': 'ja',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
};

// 检测浏览器语言
export const detectBrowserLanguage = (): string => {
  try {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    console.log('[Language Detection] Browser language:', browserLang);
    
    // 首先尝试精确匹配
    if (BROWSER_LANGUAGE_MAP[browserLang]) {
      return BROWSER_LANGUAGE_MAP[browserLang];
    }
    
    // 尝试语言代码前缀匹配
    const langPrefix = browserLang.split('-')[0];
    if (BROWSER_LANGUAGE_MAP[langPrefix]) {
      return BROWSER_LANGUAGE_MAP[langPrefix];
    }
    
    console.log('[Language Detection] No match found, using default: en');
    return 'en'; // 默认返回英文
  } catch (error) {
    console.warn('[Language Detection] Error detecting browser language:', error);
    return 'en';
  }
};

// 获取支持的语言（确保语言在支持列表中）
export const getSupportedLanguage = (language: string): string => {
  const supportedLanguages = ['en', 'zh', 'ko', 'ja'];
  return supportedLanguages.includes(language) ? language : 'en';
};

// 根据国家代码获取语言
export const getLanguageByCountry = (countryCode: string): string => {
  return COUNTRY_LANGUAGE_MAP[countryCode] || 'en';
};

// 初始化语言（使用浏览器语言检测）
const initialLanguage = getSupportedLanguage(detectBrowserLanguage());
console.log('[i18n] Initial language detected:', initialLanguage);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;