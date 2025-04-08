"use client"

import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Animated,
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"

// Message types
interface Message {
  id: string
  text: string
  isUser: boolean
  type?: "text" | "exercise" | "exercise-intro"
  duration?: string
  timestamp: Date
}

const AskDoulaScreen = () => {
  const router = useRouter()
  const [showExerciseOptions, setShowExerciseOptions] = useState(false)
  const [currentExercise, setCurrentExercise] = useState<{
    title: string
    duration: string
  } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isAssistantResponding, setIsAssistantResponding] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)

  const scrollViewRef = useRef<ScrollView>(null)
  const loadingAnimation = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Initialize with exercise intro messages
  useEffect(() => {
    const initialMessages = [
      {
        id: "1",
        text: "This Mindfulness technique has proven to increase levels of optimism and kindness, especially towards oneself.",
        isUser: false,
        type: "text",
        timestamp: new Date(),
      },
    ]

    setMessages(initialMessages)

    // Set current exercise
    setCurrentExercise({
      title: "Mindfulness Exercise",
      duration: "5 min",
    })

    // Show typing indicator
    setIsTyping(true)

    // After a delay, add the exercise card and show options
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: "4",
          text: "Mindfulness Exercise",
          isUser: false,
          type: "exercise-intro",
          duration: "5 min",
          timestamp: new Date(),
        },
      ])

      // Show exercise options with animation
      setTimeout(() => {
        setShowExerciseOptions(true)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start()
      }, 500)
    }, 2000)
  }, [])

  // Auto-scroll to bottom when messages change or when typing indicator appears
  useEffect(() => {
    if (scrollViewRef.current && (messages.length > 0 || isTyping)) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages, isTyping, showExerciseOptions])

  // Animate the typing indicator
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ).start()
    } else {
      loadingAnimation.setValue(0)
    }
  }, [isTyping, loadingAnimation])

  const startExercise = () => {
    // Hide options
    setShowExerciseOptions(false)

    // Add exercise card to messages
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: currentExercise?.title || "Mindfulness Exercise",
        isUser: false,
        type: "exercise",
        duration: currentExercise?.duration || "5 min",
        timestamp: new Date(),
      },
    ])

    setIntroComplete(true)
  }

  const doLater = () => {
    // Hide options
    setShowExerciseOptions(false)

    // Add message that user will do it later
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: "I'll do this exercise later.",
        isUser: true,
        type: "text",
        timestamp: new Date(),
      },
    ])

    // Show typing indicator
    setIsTyping(true)

    // After a delay, add response from assistant
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "No problem! The exercise will be available whenever you're ready. Is there anything else I can help you with?",
          isUser: false,
          type: "text",
          timestamp: new Date(),
        },
      ])
      setIntroComplete(true)
    }, 1500)
  }

  const sendMessage = async () => {
    if (inputText.trim()) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        type: "text",
        timestamp: new Date(),
      }

      // Update messages state with the new message
      setMessages([...messages, userMessage])
      setInputText("")
      setIsTyping(true)
      setIsAssistantResponding(true)

      // Simulate AI response after a delay
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "I understand how you feel. Let's work through this together with another mindfulness exercise.",
          isUser: false,
          type: "text",
          timestamp: new Date(),
        }
        setMessages((prevMessages) => [...prevMessages, aiResponse])
        setIsTyping(false)
        setIsAssistantResponding(false)
      }, 2000)
    }
  }

  const handleOptionPress = (optionText: string) => {
    setInputText(optionText)
  }

  const renderTypingIndicator = () => {
    const dot1Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 1, 0.3, 0.3],
    })

    const dot2Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 1, 0.3],
    })

    const dot3Opacity = loadingAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 0.3, 1],
    })

    return (
      <View style={styles.messageRow}>
        <View style={styles.typingIndicator}>
          <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    )
  }

  return (
    <LinearGradient colors={["#2A3990", "#2A3990", "#1E7B9F"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={"#2A3990"} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mindfulness Exercise</Text>
          <TouchableOpacity></TouchableOpacity>
        </View>

        {/* Chat Container */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => {
            if (messages.length > 0 || isTyping) {
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          }}
        >
          <View style={styles.messagesContainer}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[styles.messageRow, message.isUser ? styles.userMessageRow : styles.doulaMessageRow]}
              >
                {/* {!message.isUser && (
                  <Image
                    source={{
                      uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-01%20at%2017.18.43_75308238.jpg-UWVGq1hQLIrSXGXeHVgmDhXBt6xMBO.jpeg",
                    }}
                    style={styles.doulaAvatar}
                  />
                )} */}

                {message.type === "text" ? (
                  <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.doulaBubble]}>
                    <Text
                      style={[styles.messageText, message.isUser ? styles.userMessageText : styles.doulaMessageText]}
                    >
                      {message.text}
                    </Text>
                  </View>
                ) : message.type === "exercise" ? (
                  <View style={styles.exerciseBubble}>
                    <View style={styles.exerciseContent}>
                      <View style={styles.playButton}>
                        <Ionicons name="play" size={40} color="#8BB8D7" />
                      </View>
                      <Text style={styles.exerciseTitle}>{message.text}</Text>
                      <Text style={styles.exerciseDuration}>{message.duration}</Text>
                      <View style={styles.feedbackButtons}>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Ionicons name="thumbs-up" size={24} color="#FFD700" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.feedbackButton}>
                          <Ionicons name="thumbs-down" size={24} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.exerciseIntroBubble}>
                    <View style={styles.exerciseIntroContent}>
                      <View style={styles.exerciseIconContainer}>
                        <Ionicons name="leaf-outline" size={40} color="white" />
                      </View>
                      <Text style={styles.exerciseIntroTitle}>{message.text}</Text>
                      <Text style={styles.exerciseIntroDuration}>{message.duration}</Text>
                    </View>
                  </View>
                )}

                {message.isUser && (
                  <Image
                    source={{
                      uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-01%20at%2017.18.43_75308238.jpg-UWVGq1hQLIrSXGXeHVgmDhXBt6xMBO.jpeg",
                    }}
                    style={styles.userAvatar}
                  />
                )}
              </View>
            ))}

            {isTyping && renderTypingIndicator()}

            {/* Exercise Options */}
          </View>

          {/* Why Button */}
          {/* <TouchableOpacity style={styles.whyButton}>
            <Text style={styles.whyButtonText}>Why?</Text>
          </TouchableOpacity> */}
        </ScrollView>

        {/* Input Area - Only show if intro is complete */}

        {showExerciseOptions && (
          <Animated.View style={[styles.exerciseOptionsContainer, { opacity: fadeAnim }]}>
            <TouchableOpacity style={styles.startExerciseButton} onPress={startExercise}>
              <Text style={styles.startExerciseText}>Start Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doLaterButton} onPress={doLater}>
              <Text style={styles.doLaterText}>I'll do it later</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {introComplete && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Reply or say help..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={(text) => setInputText(text)}
                onSubmitEditing={() => sendMessage()}
                editable={!isAssistantResponding}
              />
              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic-outline" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isTyping}
            >
              <Feather name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "DMSans600",
  },
  messagesContainer: {
    width: "100%",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  doulaMessageRow: {
    justifyContent: "flex-start",
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#1E7B9F",
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  doulaBubble: {
    backgroundColor: "white",
    borderTopLeftRadius: 4,
    marginLeft: 8,
  },
  exerciseBubble: {
    width: "80%",
    aspectRatio: 1,
    backgroundColor: "#1E7B9F",
    borderRadius: 20,
    alignSelf: "center",
    marginLeft: 8,
    padding: 20,
  },
  exerciseIntroBubble: {
    width: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    alignSelf: "center",
    marginLeft: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  exerciseContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseIntroContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  exerciseIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  exerciseIntroTitle: {
    color: "white",
    fontSize: 22,
    fontFamily: "DMSans600",
    marginBottom: 8,
    textAlign: "center",
  },
  exerciseIntroDuration: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontFamily: "DMSans400",
    textAlign: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseTitle: {
    color: "white",
    fontSize: 20,
    fontFamily: "DMSans600",
    marginTop: 16,
    textAlign: "center",
  },
  exerciseDuration: {
    color: "white",
    fontSize: 16,
    fontFamily: "DMSans400",
    marginTop: 8,
  },
  feedbackButtons: {
    flexDirection: "row",
    marginTop: 20,
  },
  feedbackButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "DMSans400",
  },
  userMessageText: {
    color: "white",
  },
  doulaMessageText: {
    color: "#434343",
  },
  doulaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
  },
  typingIndicator: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 12,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 70,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2A3990",
    marginHorizontal: 4,
  },
  whyButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1E90FF",
    justifyContent: "center",
    alignItems: "center",
  },
  whyButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  exerciseOptionsContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
    // marginTop: 20,
  },
  startExerciseButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 30,
    // width: "80%",
    alignItems: "center",
    // marginBottom: 16,
  },
  startExerciseText: {
    color: "#2A3990",
    fontSize: 14,
    fontFamily: "DMSans600",
  },
  doLaterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 30,
    // width: "80%",
    alignItems: "center",
  },
  doLaterText: {
    color: "white",
    fontSize: 14,
    fontFamily: "DMSans400",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 50,
    paddingLeft: 16,
    paddingRight: 8,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: "DMSans400",
    fontSize: 14,
    height: "100%",
  },
  micButton: {
    padding: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1E7B9F",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})

export default AskDoulaScreen

