//

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  TextInput,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { Avatar } from "react-native-nice-avatar"
import { Button } from "@rneui/themed"
import ColorPicker from "@/constants/color-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { MaterialIcons, Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import * as Speech from "expo-speech"

// Define the AvatarProps type
type AvatarProps = {
  size?: number
  sex?: "female" | "male"
  eyesType?: "Round" | "Eyeshadow" | "Eyes" | "Smiling"
  backgroundType?: "Circle" | "Square" | "Rounded"
  backgroundColor?: string
  skinColor?: string
  earType?: "Round" | "WithEarLobe"
  earRingType?: "None" | "Stud" | "Hoop"
  mouthType?: "Nervous" | "Pucker" | "Frown" | "Sad" | "Smirk" | "Smile" | "Suprised" | "Laughing"
  hairType?:
    | "Fonze"
    | "MrT"
    | "Doug"
    | "Danny"
    | "Full"
    | "Turban"
    | "Pixie"
    | "Bald"
    | "LongHair"
    | "Curly"
    | "BobCut"
    | "Bun"
  hairColor?: string
  noseType?: "Round" | "Pointed" | "Curved"
  eyeBrowsType?: "Up" | "Down" | "EyeLashesUp" | "EyeLashesDown"
  glassesType?: "None" | "Round" | "Square"
  facialHairType?: "None" | "Stubble" | "Beard"
  shirtType?: "Collared" | "Crew" | "Open" | "Blouse" | "Dress"
  shirtColor?: string
  collarColor?: string
  accessoryType?: "None" | "Earrings" | "Necklace" | "Scarf"
}

// Language options
type Language = {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
]

// Translations for UI elements
const translations = {
  en: {
    title: "Create Your Avatar",
    subtitle: "Customize your digital identity",
    face: "Face",
    hair: "Hair",
    accessories: "Accessories",
    clothes: "Clothes",
    background: "Background",
    language: "Language",
    voice: "Voice",
    skinTone: "Skin Tone",
    noseType: "Nose Type",
    mouthType: "Mouth Type",
    eyesType: "Eyes Type",
    eyebrowsType: "Eyebrows Type",
    earType: "Ear Type",
    earRingType: "Ear Ring Type",
    hairType: "Hair Type",
    hairColor: "Hair Color",
    facialHair: "Facial Hair",
    glassesType: "Glasses Type",
    shirtType: "Shirt Type",
    shirtColor: "Shirt Color",
    collarColor: "Collar Color",
    backgroundType: "Background Type",
    backgroundColor: "Background Color",
    voiceType: "Voice Type",
    voicePitch: "Voice Pitch",
    voiceRate: "Voice Speed",
    save: "Save Avatar",
    randomize: "Randomize",
    continue: "Continue",
    skip: "Skip",
    preview: "Preview",
    back: "Back",
    speak: "Speak",
    gender: "Gender",
    male: "Male",
    female: "Female",
    accessoryType: "Accessory Type",
    speakingText: "Hello! I'm your custom avatar. How do I look?",
    customSpeech: "Custom Speech",
    listenToMe: "Listen to me",
    voiceLanguage: "Voice Language",
  },
  es: {
    title: "Crea Tu Avatar",
    subtitle: "Personaliza tu identidad digital",
    face: "Cara",
    hair: "Pelo",
    accessories: "Accesorios",
    clothes: "Ropa",
    background: "Fondo",
    language: "Idioma",
    voice: "Voz",
    skinTone: "Tono de Piel",
    noseType: "Tipo de Nariz",
    mouthType: "Tipo de Boca",
    eyesType: "Tipo de Ojos",
    eyebrowsType: "Tipo de Cejas",
    earType: "Tipo de Oreja",
    earRingType: "Tipo de Pendiente",
    hairType: "Tipo de Pelo",
    hairColor: "Color de Pelo",
    facialHair: "Vello Facial",
    glassesType: "Tipo de Gafas",
    shirtType: "Tipo de Camisa",
    shirtColor: "Color de Camisa",
    collarColor: "Color de Cuello",
    backgroundType: "Tipo de Fondo",
    backgroundColor: "Color de Fondo",
    voiceType: "Tipo de Voz",
    voicePitch: "Tono de Voz",
    voiceRate: "Velocidad de Voz",
    save: "Guardar Avatar",
    randomize: "Aleatorio",
    continue: "Continuar",
    skip: "Omitir",
    preview: "Vista Previa",
    back: "Atrás",
    speak: "Hablar",
    gender: "Género",
    male: "Masculino",
    female: "Femenino",
    accessoryType: "Tipo de Accesorio",
    speakingText: "¡Hola! Soy tu avatar personalizado. ¿Cómo me veo?",
    customSpeech: "Discurso Personalizado",
    listenToMe: "Escúchame",
    voiceLanguage: "Idioma de Voz",
  },
  // Add more languages as needed
}

// Voice options
const voiceTypes = {
  female: ["Soft Female", "Cheerful Female", "Professional Female", "Mature Female", "Young Female", "Elegant Female"],
  male: ["Default Male", "Deep Male", "Robotic Male", "Serious Male", "Energetic Male", "Calm Male"],
}

// Theme colors
const THEME = {
  primary: "#6366f1", // Indigo
  primaryDark: "#4f46e5",
  primaryLight: "#a5b4fc",
  secondary: "#f97316", // Orange
  accent: "#8b5cf6", // Purple
  success: "#10b981", // Emerald
  background: "#f8fafc", // Slate 50
  card: "#ffffff",
  text: "#1e293b", // Slate 800
  textLight: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  gradientStart: "#4f46e5", // Indigo 600
  gradientEnd: "#7c3aed", // Violet 600
  female: "#d946ef", // Pink
  male: "#3b82f6", // Blue
}

// Female-specific hair types
const femaleHairTypes = ["LongHair", "Curly", "BobCut", "Bun", "Pixie"]
// Male-specific hair types
const maleHairTypes = ["Fonze", "MrT", "Doug", "Danny", "Full", "Turban", "Bald"]
// Shared hair types
const sharedHairTypes = ["Pixie", "Bald"]

// Female-specific shirt types
const femaleShirtTypes = ["Blouse", "Dress", "Crew"]
// Male-specific shirt types
const maleShirtTypes = ["Collared", "Crew", "Open"]

// Accessory types
const accessoryTypes = ["None", "Earrings", "Necklace", "Scarf"]

export default function AvatarCustomizer() {
  const [avatar, setAvatar] = useState<AvatarProps>({
    size: 200,
    sex: "female",
    eyesType: "Round",
    backgroundType: "Circle",
    backgroundColor: "#FFAD08",
    skinColor: "#F8D25C",
    earType: "Round",
    earRingType: "None",
    mouthType: "Smile",
    hairType: "LongHair",
    hairColor: "#8D4A43",
    noseType: "Round",
    eyeBrowsType: "Up",
    glassesType: "None",
    facialHairType: "None",
    shirtType: "Blouse",
    shirtColor: "#FF69B4",
    collarColor: "#FFFFFF",
    accessoryType: "None",
  })

  const [activeTab, setActiveTab] = useState("face")
  const [language, setLanguage] = useState("en")
  const [voiceType, setVoiceType] = useState("Soft Female")
  const [voicePitch, setVoicePitch] = useState(1.2)
  const [voiceRate, setVoiceRate] = useState(0.9)
  const [isFullPreview, setIsFullPreview] = useState(false)
  const [showTutorial, setShowTutorial] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [customSpeechText, setCustomSpeechText] = useState("")
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [voiceLanguage, setVoiceLanguage] = useState("en")

  const insets = useSafeAreaInsets()
  const windowWidth = Dimensions.get("window").width
  const windowHeight = Dimensions.get("window").height

  const scrollViewRef = useRef<ScrollView>(null)
  const animatedValue = useRef(new Animated.Value(0)).current
  const previewAnimation = useRef(new Animated.Value(0)).current
  const speakingAnimation = useRef(new Animated.Value(0)).current

  // Get translations based on selected language
  const t = translations[language as keyof typeof translations] || translations.en

  // Get available voices
  useEffect(() => {
    const getVoices = async () => {
      const voices = await Speech.getAvailableVoicesAsync()
      setAvailableVoices(voices)

      // Try to find a female voice
      const femaleVoice = voices.find(
        (voice) =>
          voice.identifier.toLowerCase().includes("female") ||
          voice.name.toLowerCase().includes("female") ||
          voice.name.toLowerCase().includes("woman") ||
          voice.name.toLowerCase().includes("girl"),
      )

      if (femaleVoice) {
        setSelectedVoice(femaleVoice.identifier)
      }
    }

    getVoices()
  }, [])

  // Animation for speaking
  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(speakingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(speakingAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      speakingAnimation.setValue(0)
    }
  }, [isSpeaking])

  const updateAvatar = (key: keyof AvatarProps, value: any) => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    // Handle special cases for gender-specific options
    if (key === "sex") {
      const newGender = value as "male" | "female"
      const updatedAvatar: Partial<AvatarProps> = { sex: newGender }

      // Update hair type based on gender
      if (newGender === "female") {
        if (
          !femaleHairTypes.includes(avatar.hairType as string) &&
          !sharedHairTypes.includes(avatar.hairType as string)
        ) {
          updatedAvatar.hairType = "LongHair"
        }
        if (!femaleShirtTypes.includes(avatar.shirtType as string)) {
          updatedAvatar.shirtType = "Blouse"
        }
        updatedAvatar.facialHairType = "None"

        // Set female voice
        setVoiceType("Soft Female")
        setVoicePitch(1.2)
      } else {
        if (
          !maleHairTypes.includes(avatar.hairType as string) &&
          !sharedHairTypes.includes(avatar.hairType as string)
        ) {
          updatedAvatar.hairType = "Full"
        }
        if (!maleShirtTypes.includes(avatar.shirtType as string)) {
          updatedAvatar.shirtType = "Crew"
        }

        // Set male voice
        setVoiceType("Default Male")
        setVoicePitch(0.9)
      }

      setAvatar((prev) => ({ ...prev, ...updatedAvatar }))
    } else {
      setAvatar((prev) => ({ ...prev, [key]: value }))
    }
  }

  const randomizeAvatar = () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }

    const gender = Math.random() > 0.5 ? "male" : "female"
    const eyesTypes = ["Round", "Eyeshadow", "Eyes", "Smiling"]
    const mouthTypes = ["Nervous", "Pucker", "Frown", "Sad", "Smirk", "Smile", "Suprised", "Laughing"]
    const skinColors = ["#FFDBB4", "#EDB98A", "#D08B5B", "#AE5D29", "#614335", "#F8D25C"]
    const hairColors = ["#000000", "#4A312C", "#8D4A43", "#D2691E", "#B87333", "#F4C2C2", "#FFDB58"]
    const shirtColors = ["#3C4F5C", "#1E90FF", "#FF6347", "#32CD32", "#9370DB", "#FF69B4"]
    const backgroundColors = ["#FFAD08", "#EDD75A", "#73B06F", "#0C8F8F", "#405059", "#CD5554"]

    // Choose hair type based on gender
    const hairType =
      gender === "female"
        ? femaleHairTypes[Math.floor(Math.random() * femaleHairTypes.length)]
        : maleHairTypes[Math.floor(Math.random() * maleHairTypes.length)]

    // Choose shirt type based on gender
    const shirtType =
      gender === "female"
        ? femaleShirtTypes[Math.floor(Math.random() * femaleShirtTypes.length)]
        : maleShirtTypes[Math.floor(Math.random() * maleShirtTypes.length)]

    // Choose accessory
    const accessoryType =
      Math.random() > 0.7 ? accessoryTypes[Math.floor(Math.random() * accessoryTypes.length)] : "None"

    setAvatar({
      ...avatar,
      sex: gender as "male" | "female",
      eyesType: eyesTypes[Math.floor(Math.random() * eyesTypes.length)] as any,
      mouthType: mouthTypes[Math.floor(Math.random() * mouthTypes.length)] as any,
      hairType: hairType as any,
      skinColor: skinColors[Math.floor(Math.random() * skinColors.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
      backgroundColor: backgroundColors[Math.floor(Math.random() * backgroundColors.length)],
      shirtType: shirtType as any,
      facialHairType: gender === "male" && Math.random() > 0.5 ? "Beard" : "None",
      accessoryType: accessoryType as any,
    })

    // Set voice type based on gender
    if (gender === "female") {
      setVoiceType(voiceTypes.female[Math.floor(Math.random() * voiceTypes.female.length)])
      setVoicePitch(1 + Math.random() * 0.5) // Higher pitch for female
    } else {
      setVoiceType(voiceTypes.male[Math.floor(Math.random() * voiceTypes.male.length)])
      setVoicePitch(0.7 + Math.random() * 0.5) // Lower pitch for male
    }
  }

  const toggleFullPreview = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }

    setIsFullPreview(!isFullPreview)
    Animated.timing(previewAnimation, {
      toValue: isFullPreview ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const speakText = async (text?: string) => {
    // Stop any ongoing speech
    Speech.stop()

    // Get the appropriate text based on the voice language
    const textToSpeak =
      text ||
      customSpeechText ||
      (translations[voiceLanguage as keyof typeof translations] || translations.en).speakingText

    // Set speaking state
    setIsSpeaking(true)

    // Determine voice options based on avatar gender and selected voice type
    const options: Speech.SpeechOptions = {
      rate: voiceRate,
      pitch: voicePitch,
      language: voiceLanguage, // Use voiceLanguage instead of language
    }

    // If we have a selected voice, use it
    if (selectedVoice) {
      options.voice = selectedVoice
    }

    try {
      await Speech.speak(textToSpeak, {
        ...options,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    } catch (error) {
      console.error("Speech error:", error)
      setIsSpeaking(false)
    }
  }

  const renderPicker = (label: string, property: keyof AvatarProps, options: string[]) => (
    <View style={styles.pickerContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={avatar[property]}
          style={styles.picker}
          onValueChange={(value) => updateAvatar(property, value)}
          dropdownIconColor={THEME.text}
          itemStyle={{ fontSize: 16, color: THEME.text }}
        >
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
    </View>
  )

  const renderColorPicker = (label: string, property: keyof AvatarProps) => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.label}>{label}</Text>
      <ColorPicker
        selectedColor={avatar[property] as string}
        onColorChange={(color) => updateAvatar(property, color)}
      />
    </View>
  )

  const renderGenderSelector = () => (
    <View style={styles.genderContainer}>
      <Text style={styles.label}>{t.gender}</Text>
      <View style={styles.genderOptions}>
        <TouchableOpacity
          style={[
            styles.genderOption,
            avatar.sex === "female" && styles.selectedGenderOption,
            avatar.sex === "female" && { borderColor: THEME.female, backgroundColor: "rgba(217, 70, 239, 0.1)" },
          ]}
          onPress={() => updateAvatar("sex", "female")}
        >
          <FontAwesome5
            name="female"
            size={24}
            color={avatar.sex === "female" ? THEME.female : THEME.textLight}
            style={styles.genderIcon}
          />
          <Text style={[styles.genderText, avatar.sex === "female" && { color: THEME.female }]}>{t.female}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderOption,
            avatar.sex === "male" && styles.selectedGenderOption,
            avatar.sex === "male" && { borderColor: THEME.male, backgroundColor: "rgba(59, 130, 246, 0.1)" },
          ]}
          onPress={() => updateAvatar("sex", "male")}
        >
          <FontAwesome5
            name="male"
            size={24}
            color={avatar.sex === "male" ? THEME.male : THEME.textLight}
            style={styles.genderIcon}
          />
          <Text style={[styles.genderText, avatar.sex === "male" && { color: THEME.male }]}>{t.male}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderLanguagePicker = () => (
    <View style={styles.languagePickerContainer}>
      <Text style={styles.label}>{t.language}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroll}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageOption, language === lang.code && styles.selectedLanguageOption]}
            onPress={() => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              setLanguage(lang.code)
            }}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text style={styles.languageName}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderVoiceLanguagePicker = () => (
    <View style={styles.languagePickerContainer}>
      <Text style={styles.label}>{t.voiceLanguage || "Voice Language"}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroll}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageOption, voiceLanguage === lang.code && styles.selectedLanguageOption]}
            onPress={() => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              setVoiceLanguage(lang.code)

              // Try to find a voice for this language
              const langVoice = availableVoices.find(
                (voice) => voice.language?.startsWith(lang.code) || voice.identifier.toLowerCase().includes(lang.code),
              )

              if (langVoice) {
                setSelectedVoice(langVoice.identifier)
              }
            }}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text style={styles.languageName}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderVoiceOptions = () => (
    <View style={styles.voiceOptionsContainer}>
      <Text style={styles.label}>{t.voiceType}</Text>
      <View style={styles.voiceTypeContainer}>
        {(avatar.sex === "female" ? voiceTypes.female : voiceTypes.male).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.voiceTypeOption, voiceType === type && styles.selectedVoiceTypeOption]}
            onPress={() => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              setVoiceType(type)
            }}
          >
            <Text style={[styles.voiceTypeText, voiceType === type && styles.selectedVoiceTypeText]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.voicePitch}</Text>
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          onPress={() => setVoicePitch(Math.max(0.5, voicePitch - 0.1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="remove-circle" size={28} color={THEME.primary} />
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${((voicePitch - 0.5) * 100) / 1.5}%` }]} />
          <View
            style={[
              styles.sliderThumb,
              { left: `${((voicePitch - 0.5) * 100) / 1.5}%`, transform: [{ translateX: -12 }] },
            ]}
          />
        </View>
        <TouchableOpacity
          onPress={() => setVoicePitch(Math.min(2, voicePitch + 0.1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add-circle" size={28} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t.voiceRate}</Text>
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          onPress={() => setVoiceRate(Math.max(0.5, voiceRate - 0.1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="remove-circle" size={28} color={THEME.primary} />
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${((voiceRate - 0.5) * 100) / 1.5}%` }]} />
          <View
            style={[
              styles.sliderThumb,
              { left: `${((voiceRate - 0.5) * 100) / 1.5}%`, transform: [{ translateX: -12 }] },
            ]}
          />
        </View>
        <TouchableOpacity
          onPress={() => setVoiceRate(Math.min(2, voiceRate + 0.1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add-circle" size={28} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.speechTestContainer}>
        <Button
          title={isSpeaking ? "..." : t.listenToMe}
          buttonStyle={[styles.speechTestButton, isSpeaking && styles.speakingButton]}
          containerStyle={styles.speechTestButtonContainer}
          icon={
            <Animated.View
              style={{
                marginRight: 8,
                transform: [
                  {
                    scale: speakingAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name={isSpeaking ? "volume-high" : "volume-medium"} size={20} color="white" />
            </Animated.View>
          }
          onPress={() => speakText()}
          disabled={isSpeaking}
        />
      </View>

      <View style={styles.customSpeechContainer}>
        <Text style={styles.label}>{t.customSpeech}</Text>
        <View style={styles.customSpeechInputContainer}>
          <TextInput
            style={styles.customSpeechInput}
            placeholder={t.speakingText}
            value={customSpeechText}
            onChangeText={setCustomSpeechText}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.customSpeechButton, isSpeaking && styles.speakingButton]}
            onPress={() => speakText(customSpeechText)}
            disabled={isSpeaking}
          >
            <Ionicons name="volume-high" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const saveAvatar = () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }

    // Here you would implement saving the avatar configuration
    console.log("Avatar configuration saved:", avatar)
    console.log("Language selected:", language)
    console.log("Voice settings:", { type: voiceType, pitch: voicePitch, rate: voiceRate })
    // You could save to AsyncStorage, a database, or pass to another component
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "face":
        return (
          <View>
            {renderGenderSelector()}
            {renderColorPicker(t.skinTone, "skinColor")}
            {renderPicker(t.noseType, "noseType", ["Round", "Pointed", "Curved"])}
            {renderPicker(t.mouthType, "mouthType", [
              "Nervous",
              "Pucker",
              "Frown",
              "Sad",
              "Smirk",
              "Smile",
              "Suprised",
              "Laughing",
            ])}
            {renderPicker(t.eyesType, "eyesType", ["Round", "Eyeshadow", "Eyes", "Smiling"])}
            {renderPicker(t.eyebrowsType, "eyeBrowsType", ["Up", "Down", "EyeLashesUp", "EyeLashesDown"])}
            {renderPicker(t.earType, "earType", ["Round", "WithEarLobe"])}
            {renderPicker(t.earRingType, "earRingType", ["None", "Stud", "Hoop"])}
          </View>
        )
      case "hair":
        return (
          <View>
            {renderPicker(
              t.hairType,
              "hairType",
              avatar.sex === "female"
                ? [...femaleHairTypes, ...sharedHairTypes]
                : [...maleHairTypes, ...sharedHairTypes],
            )}
            {renderColorPicker(t.hairColor, "hairColor")}
            {avatar.sex === "male" && renderPicker(t.facialHair, "facialHairType", ["None", "Stubble", "Beard"])}
          </View>
        )
      case "accessories":
        return (
          <View>
            {renderPicker(t.glassesType, "glassesType", ["None", "Round", "Square"])}
            {renderPicker(t.accessoryType, "accessoryType", accessoryTypes)}
          </View>
        )
      case "clothes":
        return (
          <View>
            {renderPicker(t.shirtType, "shirtType", avatar.sex === "female" ? femaleShirtTypes : maleShirtTypes)}
            {renderColorPicker(t.shirtColor, "shirtColor")}
            {renderColorPicker(t.collarColor, "collarColor")}
          </View>
        )
      case "background":
        return (
          <View>
            {renderPicker(t.backgroundType, "backgroundType", ["Circle", "Square", "Rounded"])}
            {renderColorPicker(t.backgroundColor, "backgroundColor")}
          </View>
        )
      case "language":
        return (
          <View>
            {renderLanguagePicker()}
            {renderVoiceLanguagePicker()}
            {renderVoiceOptions()}
          </View>
        )
      default:
        return null
    }
  }

  const renderFullPreview = () => {
    if (!isFullPreview) return null

    return (
      <Animated.View
        style={[
          styles.fullPreviewContainer,
          {
            opacity: previewAnimation,
            transform: [
              {
                scale: previewAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView intensity={90} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.closePreviewButton} onPress={toggleFullPreview}>
          <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>

        <View style={styles.fullPreviewContent}>
          <View style={styles.fullPreviewAvatarContainer}>
            <LinearGradient
              colors={[
                avatar.sex === "female" ? "#d946ef" : "#3b82f6",
                avatar.sex === "female" ? "#8b5cf6" : "#4f46e5",
              ]}
              style={styles.fullPreviewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Avatar {...avatar} size={windowWidth * 0.7} />

              {isSpeaking && (
                <Animated.View
                  style={[
                    styles.speakingIndicator,
                    {
                      transform: [
                        {
                          scale: speakingAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.3],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="volume-high" size={24} color="white" />
                </Animated.View>
              )}
            </LinearGradient>
          </View>

          <View style={styles.previewActions}>
            <Button
              title={t.speak}
              buttonStyle={[styles.previewActionButton, { backgroundColor: THEME.secondary }]}
              containerStyle={styles.previewActionContainer}
              icon={<Ionicons name="volume-high" size={20} color="white" style={{ marginRight: 8 }} />}
              onPress={() => speakText()}
              disabled={isSpeaking}
            />
            <Button
              title={t.randomize}
              buttonStyle={styles.previewActionButton}
              containerStyle={styles.previewActionContainer}
              icon={<Ionicons name="shuffle" size={20} color="white" style={{ marginRight: 8 }} />}
              onPress={randomizeAvatar}
            />
            <Button
              title={t.continue}
              buttonStyle={[styles.previewActionButton, { backgroundColor: THEME.success }]}
              containerStyle={styles.previewActionContainer}
              icon={<Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />}
              onPress={() => {
                toggleFullPreview()
                saveAvatar()
              }}
            />
          </View>
        </View>
      </Animated.View>
    )
  }

  const renderTutorial = () => {
    if (!showTutorial) return null

    return (
      <View style={styles.tutorialContainer}>
        <BlurView intensity={90} style={StyleSheet.absoluteFill} />
        <View style={styles.tutorialContent}>
          <View style={styles.tutorialAvatarContainer}>
            <LinearGradient
              colors={[THEME.gradientStart, THEME.gradientEnd]}
              style={styles.tutorialAvatarWrapper}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Avatar {...avatar} size={150} />
            </LinearGradient>
          </View>

          <Text style={styles.tutorialTitle}>Welcome to Avatar Creator</Text>
          <Text style={styles.tutorialText}>
            Create your unique digital identity by customizing every aspect of your avatar. Choose from various styles,
            colors, and accessories to express yourself.
          </Text>

          <View style={styles.tutorialButtons}>
            <Button
              title={t.skip}
              type="outline"
              buttonStyle={styles.tutorialSkipButton}
              containerStyle={styles.tutorialButtonContainer}
              titleStyle={{ color: THEME.textLight }}
              onPress={() => setShowTutorial(false)}
            />
            <Button
              title={t.continue}
              buttonStyle={styles.tutorialContinueButton}
              containerStyle={styles.tutorialButtonContainer}
              onPress={() => setShowTutorial(false)}
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[avatar.sex === "female" ? "#d946ef" : "#3b82f6", avatar.sex === "female" ? "#8b5cf6" : "#4f46e5"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={toggleFullPreview}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="eye" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={randomizeAvatar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="shuffle" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.previewContainer}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={toggleFullPreview} activeOpacity={0.9}>
            <Avatar {...avatar} />
            {isSpeaking && (
              <Animated.View
                style={[
                  styles.speakingIndicator,
                  {
                    transform: [
                      {
                        scale: speakingAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="volume-high" size={20} color="white" />
              </Animated.View>
            )}
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>{t.preview}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.speakButton} onPress={() => speakText()} disabled={isSpeaking}>
            <Ionicons name="volume-high" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {[
            { id: "face", icon: "face", label: t.face },
            { id: "hair", icon: "content-cut", label: t.hair },
            { id: "accessories", icon: "visibility", label: t.accessories },
            { id: "clothes", icon: "checkroom", label: t.clothes },
            { id: "background", icon: "palette", label: t.background },
            { id: "language", icon: "language", label: t.language },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => {
                if (Platform.OS === "ios") {
                  Haptics.selectionAsync()
                }
                setActiveTab(tab.id)
                scrollViewRef.current?.scrollTo({ y: 0, animated: true })
              }}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={24}
                color={activeTab === tab.id ? THEME.primary : THEME.textLight}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
              {activeTab === tab.id && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.customizationContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.customizationContent}
      >
        <View style={styles.section}>{renderTabContent()}</View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t.continue}
          buttonStyle={styles.continueButton}
          containerStyle={styles.buttonContainer}
          icon={<Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />}
          iconRight
          onPress={saveAvatar}
        />
      </View>

      {renderFullPreview()}
      {renderTutorial()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerGradient: {
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  randomizeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  randomizeText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "500",
  },
  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    position: "relative",
  },
  avatarWrapper: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 120,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  previewBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: THEME.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  previewBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  speakButton: {
    position: "absolute",
    top: 0,
    right: "25%",
    backgroundColor: THEME.secondary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  speakingIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: THEME.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tabsContainer: {
    backgroundColor: THEME.card,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 10,
  },
  tab: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: THEME.primary,
    borderRadius: 3,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: THEME.textLight,
    fontWeight: "500",
  },
  activeTabText: {
    color: THEME.primary,
    fontWeight: "600",
  },
  customizationContainer: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  customizationContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: THEME.text,
    fontWeight: "600",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    backgroundColor: THEME.background,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  colorPickerContainer: {
    marginBottom: 20,
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.card,
  },
  selectedGenderOption: {
    borderColor: THEME.primary,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  genderIcon: {
    marginRight: 8,
  },
  genderText: {
    fontSize: 16,
    fontWeight: "500",
    color: THEME.text,
  },
  languagePickerContainer: {
    marginBottom: 24,
  },
  languageScroll: {
    flexDirection: "row",
    marginVertical: 10,
  },
  languageOption: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.card,
    width: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedLanguageOption: {
    borderColor: THEME.primary,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  languageFlag: {
    fontSize: 24,
    marginBottom: 5,
  },
  languageName: {
    fontSize: 12,
    color: THEME.text,
    textAlign: "center",
    fontWeight: "500",
  },
  voiceOptionsContainer: {
    marginBottom: 24,
  },
  voiceTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  voiceTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.card,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedVoiceTypeOption: {
    borderColor: THEME.primary,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  voiceTypeText: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: "500",
  },
  selectedVoiceTypeText: {
    color: THEME.primary,
    fontWeight: "600",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: THEME.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: THEME.primary,
    top: -8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  speechTestContainer: {
    marginBottom: 20,
  },
  speechTestButtonContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  speechTestButton: {
    backgroundColor: THEME.secondary,
    paddingVertical: 12,
  },
  speakingButton: {
    backgroundColor: THEME.accent,
  },
  customSpeechContainer: {
    marginBottom: 10,
  },
  customSpeechInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  customSpeechInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: THEME.background,
    fontSize: 16,
    color: THEME.text,
    marginRight: 10,
    minHeight: 100,
    textAlignVertical: "top",
  },
  customSpeechButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    padding: 16,
    backgroundColor: THEME.card,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  continueButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  fullPreviewContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  closePreviewButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1001,
  },
  fullPreviewContent: {
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
  },
  fullPreviewAvatarContainer: {
    marginBottom: 30,
    position: "relative",
  },
  fullPreviewGradient: {
    padding: 20,
    borderRadius: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    position: "relative",
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  previewActionContainer: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewActionButton: {
    paddingVertical: 14,
    backgroundColor: THEME.primary,
  },
  tutorialContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  tutorialContent: {
    width: "85%",
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  tutorialAvatarContainer: {
    marginBottom: 20,
  },
  tutorialAvatarWrapper: {
    padding: 15,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: THEME.text,
    marginBottom: 12,
    textAlign: "center",
  },
  tutorialText: {
    fontSize: 16,
    color: THEME.textLight,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  tutorialButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  tutorialButtonContainer: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  tutorialSkipButton: {
    paddingVertical: 14,
    borderColor: THEME.border,
    borderWidth: 1,
  },
  tutorialContinueButton: {
    paddingVertical: 14,
    backgroundColor: THEME.primary,
  },
})

