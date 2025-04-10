import { useState, useRef, useEffect } from "react"
import { StyleSheet, Text, View, TouchableOpacity, Animated, StatusBar, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Audio } from "expo-av"

const { width, height } = Dimensions.get("window")

const AudioPlayerScreen = () => {
  const router = useRouter()
  const params = useLocalSearchParams()

  // Get audio details from params
  const title = (params.title as string) || "Audio Track"
  const duration = (params.duration as string) || "0:00"
  const audioUrl = params.url as string
  const description = (params.description as string) || ""

  // Parse gradient colors from params or use default blue gradient
  let gradientColors: string[] = ["#1A237E", "#006064"]
  try {
    if (params.gradientColors) {
      const parsedColors = JSON.parse(params.gradientColors as string)
      if (Array.isArray(parsedColors) && parsedColors.length >= 2) {
        gradientColors = parsedColors
      }
    }
  } catch (error) {
    console.error("Error parsing gradient colors:", error)
  }

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(300) // Default 5 minutes in seconds
  const [position, setPosition] = useState(0) // Start at beginning
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressWidth, setProgressWidth] = useState("0%")

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Timer for manual progress updates
  const progressTimer = useRef<NodeJS.Timeout | null>(null)

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Request audio permissions
  const requestPermissions = async () => {
    try {
      console.log("Requesting audio permissions...")
      const permission = await Audio.requestPermissionsAsync()
      console.log("Permission result:", permission)
      return permission.granted
    } catch (err) {
      console.error("Error requesting permissions:", err)
      return false
    }
  }

  // Update progress width based on position and duration
  const updateProgressWidth = () => {
    if (position && audioDuration && audioDuration > 0) {
      // Ensure position doesn't exceed duration for progress calculation
      const adjustedPosition = Math.min(position, audioDuration)
      const percentage = (adjustedPosition / audioDuration) * 100
      setProgressWidth(`${Math.min(percentage, 100)}%`)
    } else {
      setProgressWidth("0%")
    }
  }

  // Start manual progress timer
  const startProgressTimer = () => {
    // Clear any existing timer
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
    }

    // Set up a timer to update position every second
    progressTimer.current = setInterval(() => {
      if (isPlaying && sound) {
        sound
          .getStatusAsync()
          .then((status) => {
            if (status.isLoaded) {
              setPosition(status.positionMillis / 1000)
            }
          })
          .catch((err) => {
            console.error("Error getting status:", err)
          })
      }
    }, 500) // Update twice per second for smoother progress
  }

  // Update progress width whenever position or duration changes
  useEffect(() => {
    updateProgressWidth()
  }, [position, audioDuration])

  // Ensure URL is HTTPS
  const ensureHttps = (url: string) => {
    if (url && url.startsWith("http://")) {
      return url.replace("http://", "https://")
    }
    return url
  }

  // Clean up audio resources
  const cleanupAudio = async () => {
    try {
      // Stop the progress timer
      if (progressTimer.current) {
        clearInterval(progressTimer.current)
        progressTimer.current = null
      }

      // Stop and unload the sound
      if (sound) {
        console.log("Stopping and unloading sound...")
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
      }

      setIsPlaying(false)
    } catch (error) {
      console.error("Error cleaning up audio:", error)
    }
  }

  // Load and play the audio track
  const loadAudio = async () => {
    try {
      setLoading(true)
      setError(null)
      setPosition(0)
      setProgressWidth("0%")

      // Clean up any existing audio first
      await cleanupAudio()

      // Request permissions first
      const hasPermission = await requestPermissions()
      if (!hasPermission) {
        setError("Audio permissions not granted")
        setLoading(false)
        return false
      }

      // Set audio mode first
      console.log("Setting audio mode...")
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
      })

      // Use the URL from params or fallback to a default URL
      const url = audioUrl 
      const secureUrl = ensureHttps(url)
      console.log("Loading audio track:", title, "URL:", secureUrl)

      // Load the audio with timeout
      console.log("Creating sound object...")
      try {
        // Add a timeout to the audio loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Audio loading timed out")), 10000),
        )

        const loadPromise = Audio.Sound.createAsync(
          { uri: secureUrl },
          { shouldPlay: true, volume: 1.0, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate,
        )

        // Race between timeout and loading
        const { sound: newSound } = await Promise.race([loadPromise, timeoutPromise])

        console.log("Sound loaded successfully")
        setSound(newSound)

        // Play the sound
        console.log("Playing sound...")
        await newSound.playAsync()
        setIsPlaying(true)

        // Start progress timer
        startProgressTimer()
        return true
      } catch (error) {
        console.error("Error in audio loading:", error)
        setError(`Failed to load audio: ${error instanceof Error ? error.message : String(error)}`)
        return false
      }
    } catch (error) {
      console.error("Error loading audio:", error)
      setError(`Failed to load audio: ${error instanceof Error ? error.message : String(error)}`)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Handle playback status updates
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      // Update state if there's an error
      if (status.error) {
        console.log(`Encountered an error: ${status.error}`)
        setError(`Playback error: ${status.error}`)
      }
      return
    }

    // Update state based on playback status
    if (status.durationMillis) {
      // Only update duration if it's significantly different (more than 5%)
      // This prevents constant small adjustments
      const newDuration = status.durationMillis / 1000
      if (Math.abs(newDuration - audioDuration) / audioDuration > 0.05) {
        setAudioDuration(newDuration)
      }
    }

    if (status.positionMillis) {
      setPosition(status.positionMillis / 1000)
    }

    setIsPlaying(status.isPlaying)

    // If reached the end
    if (status.didJustFinish) {
      setIsPlaying(false)
      setPosition(audioDuration)
      updateProgressWidth()
    }
  }

  // Initialize audio on component mount
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()

    // Load the audio track
    loadAudio()

    // Cleanup when component unmounts
    return () => {
      cleanupAudio()
    }
  }, [])

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!sound) {
      // If no sound is loaded, try loading again
      await loadAudio()
      return
    }

    try {
      if (isPlaying) {
        console.log("Pausing playback...")
        await sound.pauseAsync()
      } else {
        console.log("Resuming playback...")
        await sound.playAsync()
        // Restart progress timer
        startProgressTimer()
      }
    } catch (error) {
      console.error("Error toggling playback:", error)
      setError(`Playback control error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Handle back button press
  const handleBackPress = async () => {
    // Stop and clean up audio before navigating back
    await cleanupAudio()
    router.back()
  }

  // Handle restart
  const handleRestart = async () => {
    if (sound) {
      try {
        await sound.stopAsync()
        await sound.setPositionAsync(0)
        await sound.playAsync()
        setPosition(0)
        updateProgressWidth()
      } catch (error) {
        console.error("Error restarting audio:", error)
        setError(`Failed to restart: ${error instanceof Error ? error.message : String(error)}`)
      }
    } else {
      await loadAudio()
    }
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.safeArea}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {/* Title and Description */}
        <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.duration}>{duration}</Text>
          
          {/* Added description from Contentful */}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {/* Show error if any */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Show loading indicator */}
          {loading && <Text style={styles.loadingText}>Loading audio...</Text>}
        </Animated.View>

        {/* Play/Pause Button */}
        <Animated.View style={[styles.controlsContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause} disabled={loading}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#78BBEE" />
          </TouchableOpacity>

          {/* Restart button */}
          <TouchableOpacity style={styles.reloadButton} onPress={handleRestart} disabled={loading}>
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.reloadText}>Restart</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 10,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    paddingTop: 100,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "DMSans600",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  duration: {
    fontSize: 18,
    fontFamily: "DMSans400",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: "DMSans400",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginTop: 16,
    marginHorizontal: 20,
    lineHeight: 22,
  },
  errorText: {
    color: "#FF8A80",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontFamily: "DMSans400",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontFamily: "DMSans400",
  },
  controlsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  reloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  reloadText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
    fontFamily: "DMSans400",
  },
  progressContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  progressBarBackground: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    color: "white",
    fontSize: 16,
    fontFamily: "DMSans400",
  },
})

export default AudioPlayerScreen

