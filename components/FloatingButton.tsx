"use client"

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
} from "react-native"

interface FloatingButtonProps {
  onPress?: () => void
  onPositionChange?: (position: { x: number; y: number }) => void
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onPress, onPositionChange }) => {
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

  return (
    <Animated.View style={[styles.container, pan.getLayout()]} {...panResponder.panHandlers}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 999,
    elevation: 5,
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
})

export default FloatingButton

