import { StatusBar, StyleSheet, Text, TouchableOpacity, View, FlatList, Image } from "react-native"
import { useEffect, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"
import { useDispatch } from "react-redux"
import { changeLanguage } from "@/translation/i18next"

const languages = [
  {
    id: "en",
    name: "English",
    nativeName: "English",
    flag: "https://cdn.countryflags.com/thumbs/united-states-of-america/flag-400.png",
  },
  {
    id: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "https://cdn.countryflags.com/thumbs/spain/flag-400.png",
  },
  {
    id: "ht",
    name: "Haitian Creole",
    nativeName: "Kreyòl Ayisyen",
    flag: "https://cdn.countryflags.com/thumbs/haiti/flag-400.png",
  },
  {
    id: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "https://cdn.countryflags.com/thumbs/portugal/flag-400.png",
  },
]

const Language = () => {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en")

  useEffect(() => {
    // Load saved language on component mount
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("userLanguage")
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage)
        }
      } catch (error) {
        console.error("Error loading language:", error)
      }
    }

    loadLanguage()
  }, [])

  const handleLanguageSelect = async (langId) => {
    try {
      // Use the changeLanguage helper function
      await changeLanguage(langId)
      
      // if (success) {
        // Update local state
        setSelectedLanguage(langId)
        
        // Show success feedback
        setTimeout(() => {
          router.back()
        }, 500)
      // }
    } catch (error) {
      console.error("Error saving language:", error)
    }
  }

  const renderLanguageItem = ({ item }) => {
    const isSelected = selectedLanguage === item.id

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageSelect(item.id)}
      >
        <View style={styles.languageContent}>
          <Image source={{ uri: item.flag }} style={styles.flag} />
          <View style={styles.languageTextContainer}>
            <Text style={styles.languageName}>{item.name}</Text>
            <Text style={styles.languageNativeName}>{item.nativeName}</Text>
          </View>
        </View>

        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#883B72" />}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.language')}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.subtitle}>
          {t('language.title')}
        </Text>

        <FlatList
          data={languages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.languageList}
        />
      </View>
    </SafeAreaView>
  )
}

export default Language

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#666",
    marginBottom: 20,
  },
  languageList: {
    paddingBottom: 20,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  selectedLanguageItem: {
    borderColor: "#883B72",
    backgroundColor: "#FFF8FD",
  },
  languageContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  flag: {
    width: 30,
    height: 20,
    borderRadius: 4,
    marginRight: 15,
  },
  languageTextContainer: {
    flexDirection: "column",
  },
  languageName: {
    fontSize: 16,
    fontFamily: "DMSans500",
    color: "#373737",
  },
  languageNativeName: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#666",
  },
})
