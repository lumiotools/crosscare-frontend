//

import { useState, useEffect, useRef } from "react"
import { View, TouchableOpacity, Text, StyleSheet, Alert, Animated } from "react-native"
import { Audio } from "expo-av"
import { Feather, MaterialIcons } from "@expo/vector-icons"
import * as Speech from "expo-speech"
import axios from "axios"
import { systemPrompts } from "@/constants/systemPrompts"
import { useSelector } from "react-redux"

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
  const [isProcessing, setIsProcessing] = useState(false) // Fixed: Initialized with a boolean value
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [audioUri, setAudioUri] = useState("")
  const [femaleVoice, setFemaleVoice] = useState<Speech.Voice | null>(null)

  // Use a ref to track if recording is being unloaded to prevent double unloading
  const isUnloading = useRef(false)
  const progressWidth = useRef(new Animated.Value(0)).current

  const user = useSelector((state: any) => state.user)

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
          await processUserInput(transcriptText)
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

  const wordToNumberMap = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    half: 0.5,
    quarter: 0.25,
  }

  const wordsToNumber = (words: string): number | null => {
    const parts = words.split(/[-\s]+/) // Split by space or hyphen
    let total = 0
    let current = 0

    for (const word of parts) {
      if (wordToNumberMap[word as keyof typeof wordToNumberMap] !== undefined) {
        const num = wordToNumberMap[word as keyof typeof wordToNumberMap]
        if (num === 100) {
          current *= 100 // Handle "one hundred", "two hundred", etc.
        } else {
          current += num
        }
      } else if (current > 0) {
        total += current
        current = 0
      }
    }
    total += current
    return total > 0 ? total : null
  }

  const convertWordsToNumbers = (text: string): string => {
    return text.replace(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|half|quarter)([-\s]?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety))?\b/gi,
      (match) => {
        const num = wordsToNumber(match.toLowerCase())
        return num !== null ? num.toString() : match
      },
    )
  }

  const processUserInput = async (userText: string) => {
    console.log("Processing input:", userText)

    // Convert words like "fifty-six kg" → "56 kg"
    userText = convertWordsToNumbers(userText)
    console.log("Converted input:", userText)

    // Updated regex to capture water/weight inputs
    const waterMatch = userText.match(/([\d]+(?:\.\d+)?)\s*(ml|milliliters|liters|litres|l)/i)
    const weightMatch = userText.match(/([\d]+(?:\.\d+)?)\s*(kg|pounds)/i)

    let logDetails = null

    if (waterMatch) {
      let value = Number.parseFloat(waterMatch[1])
      const unit = waterMatch[2].toLowerCase()

      if (unit.startsWith("l")) {
        value *= 1000
      }

      logDetails = { category: "water_intake", value, unit: "ml" }
    } else if (weightMatch) {
      const value = Number.parseFloat(weightMatch[1])
      const unit = weightMatch[2].toLowerCase()

      logDetails = { category: "weight", value, unit }
    }

    if (logDetails && logDetails.value > 0) {
      console.log("✅ Extracted log:", logDetails)
      await logData(logDetails)
    } else {
      console.log("❌ No valid data extracted.")
    }
  }

  const logData = async ({ category, value, unit }) => {
    const userId = user.user_id
    const waterCount = value / 250
    console.log(waterCount)

    try {
      let responseMessage = ""

      if (category === "water_intake") {
        await axios.post(`https://crosscare-backends.onrender.com/api/user/activity/${userId}/water`, {
          water: waterCount,
        })
        console.log("✅ Water intake logged.")
        responseMessage = `I have logged your water intake of ${value} milliliters. Keep staying hydrated!`
      } else if (category === "weight") {
        await axios.post(`https://crosscare-backends.onrender.com/api/user/activity/${userId}/weight`, {
          weight: value,
          weight_unit: unit,
        })
        console.log("✅ Weight logged.")
        responseMessage = `Your weight of ${value} ${unit} has been recorded.`
      }

      // Speak the response aloud
      // if (responseMessage) {
      //     speakResponse(responseMessage);
      // }
    } catch (error: any) {
      console.error("❌ Error logging:", error.response ? error.response.data : error.message)
    }
  }

  // Replace the commented-out processUserQuery function with this updated version
  const processUserQuery = async (query: string) => {
    try {
      console.log("processUserQuery started with:", query)

      // Always fetch health data regardless of query
      let healthData = null
      const healthStats = {
        water: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
        steps: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
        weight: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0, unit: "kg" },
        heart: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
        sleep: { today: 0, weekly: 0, monthly: 0, avgWeekly: 0, avgMonthly: 0 },
      }

      if (user && user.user_id) {
        console.log(`User ID available: ${user.user_id}`)
        try {
          // Use the specified endpoint format
          const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}`
          console.log(`Making API call to: ${apiUrl}`)

          // Make the API call
          const response = await axios.get(apiUrl)

          console.log("API response status:", response.status)
          console.log("API response data type:", typeof response.data)
          console.log("API response is array:", Array.isArray(response.data) ? response.data.length : "N/A")

          // Process the data if we got a response
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log("API data found. First record:", JSON.stringify(response.data[0], null, 2))

            // Sort by date (newest first)
            const sortedRecords = [...response.data].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )

            console.log("Sorted records - count:", sortedRecords.length)

            // Get the most recent record
            const latestRecord = sortedRecords[0]
            console.log("Latest record details structure:", JSON.stringify(latestRecord.details || {}, null, 2))

            // Get the last 7 days of records for weekly stats
            const last7Days = sortedRecords.slice(0, 7)

            // Get the last 30 days of records for monthly stats
            const last30Days = sortedRecords.slice(0, 30)

            // Calculate sleep duration in hours for a record
            const calculateSleepDuration = (record: any) => {
              if (record.details && record.details.sleep && record.details.sleep.start && record.details.sleep.end) {
                const start = new Date(record.details.sleep.start)
                const end = new Date(record.details.sleep.end)
                return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert ms to hours
              }
              return 0
            }

            // TODAY'S STATS
            healthStats.water.today = latestRecord.details?.water || 0
            healthStats.steps.today = latestRecord.details?.steps || 0
            healthStats.heart.today = latestRecord.details?.heart || 0
            healthStats.sleep.today = calculateSleepDuration(latestRecord)
            if (latestRecord.details?.weight?.value) {
              healthStats.weight.today = latestRecord.details.weight.value
              healthStats.weight.unit = latestRecord.details.weight.unit || "kg"
            }

            // WEEKLY STATS
            // Filter records with valid data for each metric
            const weeklyWaterRecords = last7Days.filter(
              (r) => r.details && typeof r.details.water === "number" && r.details.water > 0,
            )
            const weeklyStepsRecords = last7Days.filter(
              (r) => r.details && typeof r.details.steps === "number" && r.details.steps > 0,
            )
            const weeklyHeartRecords = last7Days.filter(
              (r) => r.details && typeof r.details.heart === "number" && r.details.heart > 0,
            )
            const weeklySleepRecords = last7Days.filter((r) => calculateSleepDuration(r) > 0)
            const weeklyWeightRecords = last7Days.filter(
              (r) =>
                r.details &&
                r.details.weight &&
                typeof r.details.weight.value === "number" &&
                r.details.weight.value > 0,
            )

            // Calculate totals
            healthStats.water.weekly = weeklyWaterRecords.reduce((sum, r) => sum + r.details.water, 0)
            healthStats.steps.weekly = weeklyStepsRecords.reduce((sum, r) => sum + r.details.steps, 0)
            healthStats.heart.weekly = weeklyHeartRecords.reduce((sum, r) => sum + r.details.heart, 0)
            healthStats.sleep.weekly = weeklySleepRecords.reduce((sum, r) => sum + calculateSleepDuration(r), 0)
            healthStats.weight.weekly = weeklyWeightRecords.reduce((sum, r) => sum + r.details.weight.value, 0)

            // Calculate averages
            healthStats.water.avgWeekly =
              weeklyWaterRecords.length > 0 ? healthStats.water.weekly / weeklyWaterRecords.length : 0
            healthStats.steps.avgWeekly =
              weeklyStepsRecords.length > 0 ? healthStats.steps.weekly / weeklyStepsRecords.length : 0
            healthStats.heart.avgWeekly =
              weeklyHeartRecords.length > 0 ? healthStats.heart.weekly / weeklyHeartRecords.length : 0
            healthStats.sleep.avgWeekly =
              weeklySleepRecords.length > 0 ? healthStats.sleep.weekly / weeklySleepRecords.length : 0
            healthStats.weight.avgWeekly =
              weeklyWeightRecords.length > 0 ? healthStats.weight.weekly / weeklyWeightRecords.length : 0

            // MONTHLY STATS
            // Filter records with valid data for each metric
            const monthlyWaterRecords = last30Days.filter(
              (r) => r.details && typeof r.details.water === "number" && r.details.water > 0,
            )
            const monthlyStepsRecords = last30Days.filter(
              (r) => r.details && typeof r.details.steps === "number" && r.details.steps > 0,
            )
            const monthlyHeartRecords = last30Days.filter(
              (r) => r.details && typeof r.details.heart === "number" && r.details.heart > 0,
            )
            const monthlySleepRecords = last30Days.filter((r) => calculateSleepDuration(r) > 0)
            const monthlyWeightRecords = last30Days.filter(
              (r) =>
                r.details &&
                r.details.weight &&
                typeof r.details.weight.value === "number" &&
                r.details.weight.value > 0,
            )

            // Calculate totals
            healthStats.water.monthly = monthlyWaterRecords.reduce((sum, r) => sum + r.details.water, 0)
            healthStats.steps.monthly = monthlyStepsRecords.reduce((sum, r) => sum + r.details.steps, 0)
            healthStats.heart.monthly = monthlyHeartRecords.reduce((sum, r) => sum + r.details.heart, 0)
            healthStats.sleep.monthly = monthlySleepRecords.reduce((sum, r) => sum + calculateSleepDuration(r), 0)
            healthStats.weight.monthly = monthlyWeightRecords.reduce((sum, r) => sum + r.details.weight.value, 0)

            // Calculate averages
            healthStats.water.avgMonthly =
              monthlyWaterRecords.length > 0 ? healthStats.water.monthly / monthlyWaterRecords.length : 0
            healthStats.steps.avgMonthly =
              monthlyStepsRecords.length > 0 ? healthStats.steps.monthly / monthlyStepsRecords.length : 0
            healthStats.heart.avgMonthly =
              monthlyHeartRecords.length > 0 ? healthStats.heart.monthly / monthlyHeartRecords.length : 0
            healthStats.sleep.avgMonthly =
              monthlySleepRecords.length > 0 ? healthStats.sleep.monthly / monthlySleepRecords.length : 0
            healthStats.weight.avgMonthly =
              monthlyWeightRecords.length > 0 ? healthStats.weight.monthly / monthlyWeightRecords.length : 0

            // Create health data object with safer property access (for backward compatibility)
            healthData = {
              steps: {
                today: healthStats.steps.today,
                weekly: healthStats.steps.weekly,
              },
              water: {
                today: healthStats.water.today,
                weekly: healthStats.water.weekly,
              },
              weight: {
                current: latestRecord.details?.weight?.value || 0,
                unit: latestRecord.details?.weight?.unit || "kg",
                previous: 0,
              },
            }

            // Find previous weight record for backward compatibility
            const prevWeightRecord = sortedRecords.find(
              (r) =>
                r !== latestRecord &&
                r.details &&
                r.details.weight &&
                typeof r.details.weight.value === "number" &&
                r.details.weight.value > 0,
            )

            if (prevWeightRecord && prevWeightRecord.details && prevWeightRecord.details.weight) {
              healthData.weight.previous = prevWeightRecord.details.weight.value
            }

            console.log("Health stats calculated successfully:", JSON.stringify(healthStats, null, 2))
          } else {
            console.log("No valid data in API response")
          }
        } catch (error: any) {
          console.error("API call error:", error.message)
          console.error("Error stack:", error.stack)
          if (error.response) {
            console.error("API error response status:", error.response.status)
            console.error("API error response data:", JSON.stringify(error.response.data, null, 2))
          }
        }
      } else {
        console.log("No user ID available")
      }

      // Check for different types of health stat queries
      const isWaterQuery = /water|hydration/i.test(query)
      const isWeightQuery = /weight/i.test(query)
      const isStepsQuery = /steps|step count|walking/i.test(query)
      const isHeartQuery = /heart|pulse|bpm/i.test(query)
      const isSleepQuery = /sleep|slept/i.test(query)

      // Check for time period queries
      const isAverageQuery = /average|avg/i.test(query)
      const isTodayQuery = /today|current/i.test(query)
      const isWeeklyQuery = /week|weekly|7 days/i.test(query)
      const isMonthlyQuery = /month|monthly|30 days/i.test(query)

      // Check for comprehensive stats query
      const isComprehensiveQuery =
        /all stats|all metrics|health summary|overview/i.test(query) ||
        (/avg|average/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          /heart|water|steps|sleep|weight/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) weight/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) sleep/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) heart/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) water/i.test(query) &&
          !/^what('s| is) (my |the )?(avg|average) steps/i.test(query) &&
          !/sleep duration/i.test(query))

      console.log("Query analysis:", {
        isWaterQuery,
        isWeightQuery,
        isStepsQuery,
        isHeartQuery,
        isSleepQuery,
        isAverageQuery,
        isTodayQuery,
        isWeeklyQuery,
        isMonthlyQuery,
        isComprehensiveQuery,
      })

      // Handle comprehensive health stats query
      if (isComprehensiveQuery) {
        console.log("Detected comprehensive health stats query")

        // Format a comprehensive health stats response
        let statsMessage = "Here's a summary of your health statistics:\n\n"

        // Determine time period to report
        let reportPeriod = "weekly" // Default to weekly
        if (isTodayQuery) reportPeriod = "today"
        if (isMonthlyQuery) reportPeriod = "monthly"

        // Water stats
        if (reportPeriod === "today") {
          statsMessage += `Water: ${healthStats.water.today} glasses today\n`
        } else if (reportPeriod === "weekly") {
          statsMessage += `Water: ${healthStats.water.avgWeekly.toFixed(1)} glasses per day (weekly average)\n`
        } else {
          statsMessage += `Water: ${healthStats.water.avgMonthly.toFixed(1)} glasses per day (monthly average)\n`
        }

        // Steps stats
        if (reportPeriod === "today") {
          statsMessage += `Steps: ${healthStats.steps.today} steps today\n`
        } else if (reportPeriod === "weekly") {
          statsMessage += `Steps: ${healthStats.steps.avgWeekly.toFixed(0)} steps per day (weekly average)\n`
        } else {
          statsMessage += `Steps: ${healthStats.steps.avgMonthly.toFixed(0)} steps per day (monthly average)\n`
        }

        // Weight stats
        if (healthStats.weight.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `Weight: ${healthStats.weight.today} ${healthStats.weight.unit} today\n`
          } else if (reportPeriod === "weekly") {
            statsMessage += `Weight: ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit} (weekly average)\n`
          } else {
            statsMessage += `Weight: ${healthStats.weight.avgMonthly.toFixed(1)} ${healthStats.weight.unit} (monthly average)\n`
          }
        }

        // Heart rate stats
        if (healthStats.heart.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `Heart rate: ${healthStats.heart.today} bpm today\n`
          } else if (reportPeriod === "weekly") {
            statsMessage += `Heart rate: ${healthStats.heart.avgWeekly.toFixed(0)} bpm (weekly average)\n`
          } else {
            statsMessage += `Heart rate: ${healthStats.heart.avgMonthly.toFixed(0)} bpm (monthly average)\n`
          }
        }

        // Sleep stats
        if (healthStats.sleep.avgWeekly > 0) {
          if (reportPeriod === "today") {
            statsMessage += `Sleep: ${healthStats.sleep.today.toFixed(1)} hours today\n`
          } else if (reportPeriod === "weekly") {
            statsMessage += `Sleep: ${healthStats.sleep.avgWeekly.toFixed(1)} hours per night (weekly average)\n`
          } else {
            statsMessage += `Sleep: ${healthStats.sleep.avgMonthly.toFixed(1)} hours per night (monthly average)\n`
          }
        }

        // Add a note if some metrics are missing
        if (healthStats.heart.avgWeekly === 0 || healthStats.sleep.avgWeekly === 0) {
          statsMessage += "\nSome metrics have no data. Regular tracking will provide more complete insights."
        }

        // Speak the response
        speakResponse(statsMessage)

        // Send to parent component
        onSendAudio("", "", statsMessage)

        return // Exit early since we've handled this specific query
      }

      // Handle specific metric queries
      if (isWaterQuery) {
        let waterMessage = ""

        if (isTodayQuery) {
          waterMessage = `You've consumed ${healthStats.water.today} glasses of water today.`
        } else if (isWeeklyQuery || isAverageQuery) {
          waterMessage = `Your average water consumption is ${healthStats.water.avgWeekly.toFixed(1)} glasses per day over the past week. Your total weekly consumption was ${healthStats.water.weekly} glasses.`
        } else if (isMonthlyQuery) {
          waterMessage = `Your average water consumption is ${healthStats.water.avgMonthly.toFixed(1)} glasses per day over the past month. Your total monthly consumption was ${healthStats.water.monthly} glasses.`
        } else {
          // Default to weekly if no time period specified
          waterMessage = `Your average water consumption is ${healthStats.water.avgWeekly.toFixed(1)} glasses per day over the past week. Today you've had ${healthStats.water.today} glasses.`
        }

        waterMessage += " Staying hydrated is important for your pregnancy!"

        speakResponse(waterMessage)
        onSendAudio("", "", waterMessage)
        return
      }

      if (isWeightQuery && /^what('s| is) (my |the )?(avg|average) weight/i.test(query)) {
        if (healthStats.weight.avgWeekly === 0 && healthStats.weight.today === 0) {
          const noDataMessage =
            "I don't have enough weight data to calculate statistics. Please log your weight regularly to track your pregnancy progress."
          speakResponse(noDataMessage)
          onSendAudio("", "", noDataMessage)
          return
        }

        let weightMessage = ""

        if (isMonthlyQuery) {
          weightMessage = `Your average weight is ${healthStats.weight.avgMonthly.toFixed(1)} ${healthStats.weight.unit} over the past month.`
        } else {
          // Default to weekly average for "what is avg weight" queries
          weightMessage = `Your average weight is ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit} over the past week.`
        }

        speakResponse(weightMessage)
        onSendAudio("", "", weightMessage)
        return
      }

      if (isWeightQuery) {
        if (healthStats.weight.avgWeekly === 0 && healthStats.weight.today === 0) {
          const noDataMessage =
            "I don't have enough weight data to calculate statistics. Please log your weight regularly to track your pregnancy progress."
          speakResponse(noDataMessage)
          onSendAudio("", "", noDataMessage)
          return
        }

        let weightMessage = ""

        if (isTodayQuery) {
          weightMessage = `Your current weight is ${healthStats.weight.today} ${healthStats.weight.unit}.`
        } else if (isWeeklyQuery || isAverageQuery) {
          weightMessage = `Your average weight is ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit} over the past week.`
        } else if (isMonthlyQuery) {
          weightMessage = `Your average weight is ${healthStats.weight.avgMonthly.toFixed(1)} ${healthStats.weight.unit} over the past month.`
        } else {
          // Default to current weight if no time period specified
          weightMessage = `Your current weight is ${healthStats.weight.today} ${healthStats.weight.unit}. Your average weight over the past week is ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit}.`
        }

        speakResponse(weightMessage)
        onSendAudio("", "", weightMessage)
        return
      }

      if (isStepsQuery) {
        let stepsMessage = ""

        if (isTodayQuery) {
          stepsMessage = `You've taken ${healthStats.steps.today} steps today.`
        } else if (isWeeklyQuery || isAverageQuery) {
          stepsMessage = `You're averaging ${healthStats.steps.avgWeekly.toFixed(0)} steps per day over the past week. Your total weekly steps were ${healthStats.steps.weekly}.`
        } else if (isMonthlyQuery) {
          stepsMessage = `You're averaging ${healthStats.steps.avgMonthly.toFixed(0)} steps per day over the past month. Your total monthly steps were ${healthStats.steps.monthly}.`
        } else {
          // Default to today if no time period specified
          stepsMessage = `You've taken ${healthStats.steps.today} steps today. Your weekly average is ${healthStats.steps.avgWeekly.toFixed(0)} steps per day.`
        }

        stepsMessage += " Regular walking is beneficial during pregnancy!"

        speakResponse(stepsMessage)
        onSendAudio("", "", stepsMessage)
        return
      }

      if (isHeartQuery) {
        if (healthStats.heart.avgWeekly === 0 && healthStats.heart.today === 0) {
          const noDataMessage =
            "I don't have any heart rate data recorded. Please sync your heart rate monitor to track this metric."
          speakResponse(noDataMessage)
          onSendAudio("", "", noDataMessage)
          return
        }

        let heartMessage = ""

        if (isTodayQuery) {
          heartMessage = `Your heart rate today is ${healthStats.heart.today} beats per minute.`
        } else if (isWeeklyQuery || isAverageQuery) {
          heartMessage = `Your average heart rate is ${healthStats.heart.avgWeekly.toFixed(0)} beats per minute over the past week.`
        } else if (isMonthlyQuery) {
          heartMessage = `Your average heart rate is ${healthStats.heart.avgMonthly.toFixed(0)} beats per minute over the past month.`
        } else {
          // Default to today if no time period specified
          heartMessage = `Your heart rate today is ${healthStats.heart.today} beats per minute. Your weekly average is ${healthStats.heart.avgWeekly.toFixed(0)} beats per minute.`
        }

        speakResponse(heartMessage)
        onSendAudio("", "", heartMessage)
        return
      }

      if (isSleepQuery && (isAverageQuery || /duration/i.test(query))) {
        if (healthStats.sleep.avgWeekly === 0 && healthStats.sleep.today === 0) {
          const noDataMessage =
            "I don't have enough sleep data to calculate statistics. Please log your sleep regularly for better tracking."
          speakResponse(noDataMessage)
          onSendAudio("", "", noDataMessage)
          return
        }

        let sleepMessage = ""

        if (isMonthlyQuery) {
          sleepMessage = `Your average sleep duration is ${healthStats.sleep.avgMonthly.toFixed(1)} hours per night over the past month.`
        } else {
          // Default to weekly average for "what is avg sleep duration" queries
          sleepMessage = `Your average sleep duration is ${healthStats.sleep.avgWeekly.toFixed(1)} hours per night over the past week.`
        }

        sleepMessage += " Quality sleep is essential during pregnancy!"

        speakResponse(sleepMessage)
        onSendAudio("", "", sleepMessage)
        return
      }

      if (isSleepQuery) {
        if (healthStats.sleep.avgWeekly === 0 && healthStats.sleep.today === 0) {
          const noDataMessage =
            "I don't have enough sleep data to calculate statistics. Please log your sleep regularly for better tracking."
          speakResponse(noDataMessage)
          onSendAudio("", "", noDataMessage)
          return
        }

        let sleepMessage = ""

        if (isTodayQuery) {
          sleepMessage = `You slept for ${healthStats.sleep.today.toFixed(1)} hours last night.`
        } else if (isWeeklyQuery || isAverageQuery) {
          sleepMessage = `You're averaging ${healthStats.sleep.avgWeekly.toFixed(1)} hours of sleep per night over the past week.`
        } else if (isMonthlyQuery) {
          sleepMessage = `You're averaging ${healthStats.sleep.avgMonthly.toFixed(1)} hours of sleep per night over the past month.`
        } else {
          // Default to weekly average if no time period specified
          sleepMessage = `You're averaging ${healthStats.sleep.avgWeekly.toFixed(1)} hours of sleep per night over the past week. Last night you slept for ${healthStats.sleep.today.toFixed(1)} hours.`
        }

        sleepMessage += " Quality sleep is essential during pregnancy!"

        speakResponse(sleepMessage)
        onSendAudio("", "", sleepMessage)
        return
      }

      // Create enhanced prompt with health data if available
      let enhancedPrompt = systemPrompt

      if (healthData) {
        enhancedPrompt += `\n\nUser's health data:\n`

        if (healthStats.steps) {
          enhancedPrompt += `- Steps: Today: ${healthStats.steps.today}, Weekly average: ${healthStats.steps.avgWeekly.toFixed(0)}, Monthly average: ${healthStats.steps.avgMonthly.toFixed(0)}\n`
        }

        if (healthStats.water) {
          enhancedPrompt += `- Water: Today: ${healthStats.water.today} glasses, Weekly average: ${healthStats.water.avgWeekly.toFixed(1)} glasses, Monthly average: ${healthStats.water.avgMonthly.toFixed(1)} glasses\n`
        }

        if (healthStats.weight && healthStats.weight.avgWeekly > 0) {
          enhancedPrompt += `- Weight: Current: ${healthStats.weight.today} ${healthStats.weight.unit}, Weekly average: ${healthStats.weight.avgWeekly.toFixed(1)} ${healthStats.weight.unit}, Monthly average: ${healthStats.weight.avgMonthly.toFixed(1)} ${healthStats.weight.unit}\n`
        }

        if (healthStats.heart && healthStats.heart.avgWeekly > 0) {
          enhancedPrompt += `- Heart rate: Current: ${healthStats.heart.today} bpm, Weekly average: ${healthStats.heart.avgWeekly.toFixed(0)} bpm, Monthly average: ${healthStats.heart.avgMonthly.toFixed(0)} bpm\n`
        }

        if (healthStats.sleep && healthStats.sleep.avgWeekly > 0) {
          enhancedPrompt += `- Sleep: Last night: ${healthStats.sleep.today.toFixed(1)} hours, Weekly average: ${healthStats.sleep.avgWeekly.toFixed(1)} hours, Monthly average: ${healthStats.sleep.avgMonthly.toFixed(1)} hours\n`
        }

        enhancedPrompt += `\nPlease answer the user's question about their health metrics using this data. Be specific and encouraging.`

        console.log("HEALTH DATA SUMMARY:")
        console.log(`- Steps today: ${healthStats.steps.today}, avg weekly: ${healthStats.steps.avgWeekly.toFixed(0)}`)
        console.log(
          `- Water today: ${healthStats.water.today} glasses, avg weekly: ${healthStats.water.avgWeekly.toFixed(1)}`,
        )
        console.log(
          `- Current weight: ${healthStats.weight.today} ${healthStats.weight.unit}, avg weekly: ${healthStats.weight.avgWeekly.toFixed(1)}`,
        )
        console.log("Health data successfully added to prompt")
      } else {
        console.log("WARNING: No health data available to add to prompt")
      }

      console.log("Calling Gemini API")

      // Call Gemini API
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
              parts: [{ text: enhancedPrompt }, { text: query }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 1.0,
          },
        },
      })

      console.log("Gemini API response received")

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const assistantMessage = response.data.candidates[0].content.parts[0].text.trim()
        console.log("Assistant response:", assistantMessage)

        // Speak the response
        speakResponse(assistantMessage)

        // Send to parent component
        onSendAudio("", "", assistantMessage)
      } else {
        throw new Error("No valid response from Gemini API")
      }
    } catch (error: any) {
      console.error("Error in processUserQuery:", error.message)
      console.error("Error stack:", error.stack)
      setIsProcessing(false)
      Alert.alert("Error", "I couldn't process your request. Please try again.")
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

