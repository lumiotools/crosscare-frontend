import type React from "react"
import { useRef, useEffect, useState } from "react"
import {
  View,
  Animated,
  PanResponder,
  Text,
  Dimensions,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Easing,
} from "react-native"
// import { X } from "lucide-react"

interface FloatingButtonProps {
  onPress?: () => void
  onPositionChange?: (position: { x: number; y: number }) => void
  showMessage?: boolean
  message?: string
  onMessageDismiss?: () => void
  autoShowInterval?: number
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  onPositionChange,
  showMessage = false,
  message = "Hey, do you have a minute?",
  onMessageDismiss,
  autoShowInterval = 60000, // Default to 1 minute (60000ms)
}) => {
  // Get screen dimensions
  const { width, height } = Dimensions.get("window")

  // Initialize position (bottom right corner)
  const pan = useRef(new Animated.ValueXY({ x: width - 70, y: height / 2 })).current

  // Track if we're currently dragging to differentiate between drag and tap
  const isDragging = useRef(false)
  // Track the start time of touch to differentiate between tap and drag
  const touchStartTime = useRef(0)
  // Track if image loaded successfully
  const [imageLoaded, setImageLoaded] = useState(true)

  // Enhanced animations for message bubble
  const messageOpacity = useRef(new Animated.Value(0)).current
  const messageScale = useRef(new Animated.Value(0.8)).current
  const messageTranslateY = useRef(new Animated.Value(-20)).current
  const messageBounce = useRef(new Animated.Value(0)).current
  const buttonPulse = useRef(new Animated.Value(1)).current

  // Track if message is visible
  const [isMessageVisible, setIsMessageVisible] = useState(false)

  // Auto-show message every minute
  useEffect(() => {
    const showMessageWithAnimation = () => {
      if (onMessageDismiss) {
        onMessageDismiss() // This will trigger the show animation through the showMessage prop
      }
    }

    // Set up interval to show message every minute
    const intervalId = setInterval(showMessageWithAnimation, autoShowInterval)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [autoShowInterval, onMessageDismiss])

  // Show/hide message based on prop with enhanced animations
  useEffect(() => {
    if (showMessage && !isMessageVisible) {
      setIsMessageVisible(true)

      // Pulse animation for the button to draw attention
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ]).start()

      // Sequence of animations for the message bubble
      Animated.sequence([
        // First appear with scale and fade
        Animated.parallel([
          Animated.timing(messageOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(messageScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(1.5)),
          }),
          Animated.timing(messageTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]),
        // Then add a subtle bounce effect
        Animated.timing(messageBounce, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.elastic(1.2),
        }),
      ]).start()
    } else if (!showMessage && isMessageVisible) {
      // Hide animation
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(messageScale, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(messageTranslateY, {
          toValue: -20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsMessageVisible(false)
        messageBounce.setValue(0) // Reset bounce for next time
      })
    }
  }, [showMessage])

  // Update position when screen dimensions change
  useEffect(() => {
    const updatePosition = () => {
      const { width, height } = Dimensions.get("window")

      // Keep button within screen bounds after rotation
      if (pan.x._value > width - 60) {
        pan.x.setValue(width - 60)
      }
      if (pan.y._value > height - 60) {
        pan.y.setValue(height - 60)
      }

      // Report position change
      if (onPositionChange) {
        onPositionChange({ x: pan.x._value, y: pan.y._value })
      }
    }

    const subscription = Dimensions.addEventListener("change", updatePosition)

    // Initial position report
    if (onPositionChange) {
      onPositionChange({ x: pan.x._value, y: pan.y._value })
    }

    return () => subscription.remove()
  }, [])

  // Update position whenever it changes - with debounce to prevent too many updates
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout

    const xListener = pan.x.addListener(({ value }) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (onPositionChange) {
          onPositionChange({ x: value, y: pan.y._value })
        }
      }, 100) // Debounce position updates
    })

    const yListener = pan.y.addListener(({ value }) => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (onPositionChange) {
          onPositionChange({ x: pan.x._value, y: value })
        }
      }, 100) // Debounce position updates
    })

    return () => {
      clearTimeout(debounceTimer)
      pan.x.removeListener(xListener)
      pan.y.removeListener(yListener)
    }
  }, [onPositionChange])

  const handlePress = () => {
    console.log("FloatingButton pressed")
    if (onPress) {
      onPress()
    }
  }

  const handleMessageDismiss = () => {
    if (onMessageDismiss) {
      onMessageDismiss()
    }
  }

  const handleMessagePress = () => {
    handleMessageDismiss()
    handlePress()
  }

  const panResponder = useRef(
    PanResponder.create({
      // We want to activate the gesture handler on touch
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      // When the gesture starts, record the time and set dragging flag to false initially
      onPanResponderGrant: () => {
        touchStartTime.current = Date.now()
        isDragging.current = false

        // Store the initial position
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        })
        // Reset the gesture value
        pan.setValue({ x: 0, y: 0 })
      },

      // When moving, update the dragging flag if moved more than a threshold
      onPanResponderMove: (evt, gestureState) => {
        // If moved more than 5px in any direction, consider it a drag
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDragging.current = true
        }

        // Update position
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gestureState)
      },

      // When released, handle the end of gesture
      onPanResponderRelease: (_, gestureState) => {
        // Flatten offset to avoid jumps in next drag
        pan.flattenOffset()

        // If it was a short tap without much movement, trigger the onPress
        const isQuickTap = Date.now() - touchStartTime.current < 200
        if (!isDragging.current && isQuickTap) {
          console.log("Quick tap detected")
          handlePress()
          return
        }

        // If it was a drag, snap to the nearest edge
        const { moveX } = gestureState
        const screenWidth = Dimensions.get("window").width
        const screenHeight = Dimensions.get("window").height

        // Determine which edge to snap to (left or right)
        const finalX = moveX > screenWidth / 2 ? screenWidth - 60 : 10

        // Animate to the edge with a nice spring effect
        Animated.spring(pan, {
          toValue: { x: finalX, y: pan.y._value },
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start()

        // Ensure button stays within vertical bounds
        if (pan.y._value < 50) {
          Animated.spring(pan.y, {
            toValue: 50,
            useNativeDriver: false,
          }).start()
        } else if (pan.y._value > screenHeight - 100) {
          Animated.spring(pan.y, {
            toValue: screenHeight - 100,
            useNativeDriver: false,
          }).start()
        }
      },
    }),
  ).current

  // Determine if button is on the right side of the screen
  const isOnRightSide = pan.x._value > width / 2

  // Calculate bounce effect for message
  const bounceInterpolation = messageBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 5, 0],
  })

  return (
    <Animated.View style={[styles.container, pan.getLayout()]} {...panResponder.panHandlers}>
      {/* Message bubble - positioned based on which side of screen the button is on */}
      {isMessageVisible && (
        <Animated.View
          style={[
            styles.messageBubbleContainer,
            isOnRightSide ? styles.messageBubbleLeft : styles.messageBubbleRight,
            {
              opacity: messageOpacity,
              transform: [
                { translateY: messageTranslateY },
                { scale: messageScale },
                { translateY: bounceInterpolation }, // Add bounce effect
              ],
            },
          ]}
        >
          {/* <TouchableOpacity style={styles.closeButton} onPress={handleMessageDismiss}>
            <X size={16} color="#666" />
          </TouchableOpacity> */}
          <TouchableOpacity onPress={handleMessagePress}>
            <Text style={styles.messageText}>{message}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Floating button with pulse animation */}
      <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
        <TouchableWithoutFeedback onPress={handlePress}>
          <View style={styles.button}>
            {imageLoaded ? (
              <Image
                source={require("../assets/images/doulaImg.png")}
                style={styles.image}
                resizeMode="contain"
                onError={() => setImageLoaded(false)}
              />
            ) : (
              <Text style={styles.fallbackText}>D</Text>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 999,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    borderWidth: 2,
    borderColor: "#FDE8F8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    overflow: "hidden", // Ensure image stays within the circular button
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallbackText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  messageBubbleContainer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderTopEndRadius: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderColor: "#F76CCF",
    paddingVertical: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingRight: 24, // Extra space for close button
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageBubbleLeft: {
    right: 50, // Position to the left of the button
    top: -50,
  },
  messageBubbleRight: {
    left: 60, // Position to the right of the button
    top: 0,
  },
  messageText: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "#3F3F3F",
  },
  closeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 1,
    padding: 4,
  },
})

export default FloatingButton
