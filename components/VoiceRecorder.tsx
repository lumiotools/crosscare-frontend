import { useState, useEffect, useRef } from "react"
import { View, TouchableOpacity, Text, StyleSheet, Alert, Animated } from "react-native"
import { Audio } from "expo-av"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import * as Speech from "expo-speech"
import axios from "axios"
import { systemPrompts } from "@/constants/systemPrompts"

interface VoiceRecorderProps {
  onSendAudio: (audioUri: string, transcript?: string, assistantResponse?: string) => void
  systemPrompt?: string
  apiKey?: string
}
interface FormatTimeProps {
  seconds: number
}

export default function VoiceRecorder({
  onSendAudio,
  systemPrompt = systemPrompts,
  apiKey = "AIzaSyD0ISmMWP4_yDqEvlrjpNJB8TnuJBkhZPs",
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [audioUri, setAudioUri] = useState("")
  const [femaleVoice, setFemaleVoice] = useState<Speech.Voice | null>(null)

  // Use a ref to track if recording is being unloaded to prevent double unloading
  const isUnloading = useRef(false)
  const progressWidth = useRef(new Animated.Value(0)).current

  // Get available voices when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync()
        // console.log("Available voices:", voices)

        // Find a female voice - look for voices with "female" in the identifier or name
        // or common female voice identifiers
        const femaleVoices = voices.filter(
          (voice) =>
            voice.identifier.toLowerCase().includes("female") ||
            (voice.name && voice.name.toLowerCase().includes("female")) ||
            voice.identifier.toLowerCase().includes("samantha") ||
            voice.identifier.toLowerCase().includes("karen") ||
            voice.identifier.toLowerCase().includes("victoria") ||
            voice.identifier.toLowerCase().includes("tessa") ||
            voice.identifier.toLowerCase().includes("moira") ||
            voice.identifier.toLowerCase().includes("kyoko") ||
            voice.identifier.toLowerCase().includes("ava"),
        )

        if (femaleVoices.length > 0) {
          // console.log("Selected female voice:", femaleVoices[0])
          setFemaleVoice(femaleVoices[0])
        } else {
          // console.log("No female voice found, using default")
        }
      } catch (error) {
        console.error("Error loading voices:", error)
      }
    }

    loadVoices()
  }, [])

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Only attempt cleanup if we're recording and not already unloading
      if (recording && !isUnloading.current) {
        cleanupRecording()
      }

      // Clear timer if it exists
      if (recordingTimer) {
        clearInterval(recordingTimer)
      }

      // Stop any ongoing speech
      if (isSpeaking) {
        Speech.stop()
      }
    }
  }, [recording, recordingTimer, isSpeaking])

  // Animate progress bar
  useEffect(() => {
    if (isRecording) {
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 60000, // 60 seconds max recording
        useNativeDriver: false,
      }).start()
    } else {
      progressWidth.setValue(0)
    }
  }, [isRecording, progressWidth])

  const formatTime = ({ seconds }: FormatTimeProps): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Safe cleanup function that won't try to unload twice
  const cleanupRecording = async () => {
    try {
      if (recording && !isUnloading.current) {
        isUnloading.current = true
        await recording.stopAndUnloadAsync()
        isUnloading.current = false
      }
    } catch (error) {
      console.log("Cleanup recording error (safe to ignore):", error)
      isUnloading.current = false
    }
  }

  const startRecording = async () => {
    try {
      // Reset unloading flag
      isUnloading.current = false

      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant microphone permission to record audio.")
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })

      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await newRecording.startAsync()
      setRecording(newRecording)
      setIsRecording(true)
      setTranscript("") // Clear any previous transcript

      const timer = setInterval(() => {
        setRecordingDuration((duration) => duration + 1)
      }, 1000)
      setRecordingTimer(timer)
    } catch (error) {
      console.error("Failed to start recording", error)
      Alert.alert("Error", "Failed to start recording")
    }
  }

  const stopRecording = async () => {
    try {
      // If no recording or already unloading, exit early
      if (!recording || isUnloading.current) return

      // Set flag to prevent double unloading
      isUnloading.current = true

      // Clear timer first
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }

      // Get URI before stopping (some implementations need this)
      const uri = recording.getURI()
      setAudioUri(uri || "")

      // Stop and unload
      await recording.stopAndUnloadAsync()

      // Reset states
      setRecording(null)
      setIsRecording(false)
      setRecordingDuration(0)
      isUnloading.current = false

      // Process the audio with Deepgram instead of just sending the URI
      if (uri) {
        setIsProcessing(true)
        await processAudioWithDeepgram(uri)
      }
    } catch (error) {
      console.error("Failed to stop recording", error)
      // Reset states even on error
      setRecording(null)
      setIsRecording(false)
      setRecordingDuration(0)
      isUnloading.current = false
      setIsProcessing(false)
    }
  }

  const processAudioWithDeepgram = async (audioUri: string) => {
    try {
      console.log("Processing audio with Deepgram...")

      // Convert URI to Blob
      const response = await fetch(audioUri)
      const audioBlob = await response.blob()

      if (!audioBlob) {
        throw new Error("Failed to convert audio to Blob")
      }

      console.log("Audio Blob size:", audioBlob.size)

      // Send audio blob to Deepgram API
      const deepgramResponse = await fetch(
        "https://api.deepgram.com/v1/listen?smart_format=true&language=en&model=nova-3",
        {
          method: "POST",
          headers: {
            Authorization: "Token d7916ca82390f587e38b1a754aa6bc098e14004f", // Replace with your Deepgram API key
            "Content-Type": "audio/wav",
          },
          body: audioBlob,
        },
      )

      if (!deepgramResponse.ok) {
        throw new Error(`Deepgram API error: ${deepgramResponse.status}`)
      }

      const data = await deepgramResponse.json()
      console.log("Deepgram response:", data)

      if (data.results && data.results.channels && data.results.channels.length > 0) {
        const transcriptText = data.results.channels[0].alternatives[0].transcript

        if (transcriptText) {
          console.log("Transcript:", transcriptText)
          setTranscript(transcriptText)
          
          // Send the audio URI to the parent component
          // We're passing the transcript as a hidden property for processing
          // but it won't be displayed separately
          onSendAudio(audioUri, transcriptText)

          // Send the transcript to Gemini API and speak the response
          await processUserQuery(transcriptText)
        } else {
          throw new Error("No transcript returned from Deepgram API")
        }
      } else {
        throw new Error("Invalid response format or missing transcript data")
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
      setIsProcessing(false)
      Alert.alert("Speech Recognition Error", "I'm having trouble understanding. Please try again.")
    }
  }

  const processUserQuery = async (query: string) => {
    try {
      console.log("Sending to Gemini API...")

      const response = await axios({
        method: "post",
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        params: {
          key: apiKey,
        },
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          contents: [
            {
              parts: [{ text: systemPrompt }, { text: query }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 100,
          },
        },
      })

      console.log("Gemini API response:", response.data)

      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        const assistantMessage = response.data.candidates[0]?.content?.parts[0]?.text.trim()

        if (assistantMessage) {
          // Speak the response
          speakResponse(assistantMessage)
          
          // Send the assistant's response to the parent component
          // We're using a different approach here to avoid duplicate messages
          onSendAudio("", "", assistantMessage)
        } else {
          throw new Error("No valid content in response.")
        }
      } else {
        throw new Error("Invalid response structure or no candidates found.")
      }
    } catch (error) {
      console.error("Error getting response from Gemini API:", error)
      setIsProcessing(false)
      Alert.alert("API Error", "Sorry, I'm having trouble connecting right now. Please try again later.")
    }
  }

  const speakResponse = (text: string) => {
    setIsSpeaking(true)

    // Create speech options with the female voice if available
    const speechOptions: Speech.SpeechOptions = {
      language: "en",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false)
        setIsProcessing(false)
      },
      onStopped: () => {
        setIsSpeaking(false)
        setIsProcessing(false)
      },
      onError: (error) => {
        console.error("Speech error:", error)
        setIsSpeaking(false)
        setIsProcessing(false)
      },
    }

    // Add the voice if we found a female one
    if (femaleVoice) {
      speechOptions.voice = femaleVoice.identifier
    }

    Speech.speak(text, speechOptions)
  }

  return (
    <View style={styles.container}>
      {isRecording ? (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime({ seconds: recordingDuration })}</Text>
          <TouchableOpacity style={styles.recordButton} onPress={stopRecording} activeOpacity={0.8}>
            <MaterialIcons name="stop-circle" size={45} color="#883B72" />
          </TouchableOpacity>
        </View>
      ) : isProcessing ? (
        <View style={styles.processingContainer}>
          <Animated.View style={styles.processingIndicator} />
          <Text style={styles.processingText}>{isSpeaking ? "Speaking..." : "Processing..."}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.micButton} onPress={startRecording} activeOpacity={0.7}>
          <Feather name="mic" size={19} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  timerText: {
    fontSize: 14,
    color: "#883B72",
    fontFamily: "Inter400",
  },
  micButton: {
    marginRight: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  recordButton: {
    // Styles for the record button
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    gap: 8,
  },
  processingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E162BC",
    opacity: 0.7,
  },
  processingText: {
    fontSize: 12,
    color: "#883B72",
    fontFamily: "Inter400",
  },
})
