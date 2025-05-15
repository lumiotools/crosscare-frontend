import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { store } from "../store/store"
import { setLanguage } from "../store/languageSlice"
import { en, es, pt, ht } from "."


// Import translations

// Initialize i18next
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    compatibilityJSON: "v4", // This line is important for Android
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      ht: { translation: ht },
    },
    debug:true,
    lng: "en", // Default to English initially
    fallbackLng: "en", // Fallback to English if translation is missing
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

// Function to load saved language
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem("userLanguage")
    if (savedLanguage) {
      // Update i18n
      i18n.changeLanguage(savedLanguage)

      // Update Redux state
      store.dispatch(setLanguage(savedLanguage))
    }
  } catch (error) {
    console.error("Error loading language:", error)
  }
}

// Function to change language
export const changeLanguage = async (language: string) => {
  try {
    // Save to AsyncStorage
    await AsyncStorage.setItem("userLanguage", language)

    // Update i18n
    i18n.changeLanguage(language)

    // Update Redux state
    store.dispatch(setLanguage(language))
  } catch (error) {
    console.error("Error changing language:", error)
  }
}

// Load saved language on initialization
loadSavedLanguage()

export default i18n