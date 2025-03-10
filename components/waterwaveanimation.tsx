"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { View, StyleSheet, Animated, Easing } from "react-native"
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg"

interface WaterWaveProps {
  percentage: number
  waveColor?: string
  containerSize?: number
}

const WaterWaveAnimation = ({ percentage, waveColor = "#67B6FF", containerSize = 180 }: WaterWaveProps) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

  // Animation values
  const waterLevel = useRef(new Animated.Value(0)).current
  const waveOffset1 = useRef(new Animated.Value(0)).current
  const waveOffset2 = useRef(new Animated.Value(0)).current

  // State to store the animated wave paths
  const [wavePath1, setWavePath1] = useState("")
  const [wavePath2, setWavePath2] = useState("")

  // Function to update first wave path
  const updateWavePath1 = useCallback(
    (value: number) => {
      const amplitude = 6 // Wave height
      const frequency = 2 // Wave frequency

      // Create a smoother wave with more points
      let path = `M0 10 `

      // Generate a smooth wave with multiple points
      const points = 10 // Number of points to create a smooth curve
      const step = containerSize / points

      for (let i = 0; i <= points; i++) {
        const x = i * step
        // Use sine function with phase shift based on animation value
        const y = 10 + amplitude * Math.sin((frequency * Math.PI * i) / points + value * Math.PI * 2)

        if (i === 0) {
          path += `L${x} ${y} `
        } else {
          // Use curve commands for smoother waves
          const prevX = (i - 1) * step
          const cpX1 = prevX + step / 3
          const cpX2 = x - step / 3

          path += `C${cpX1} ${y - 2}, ${cpX2} ${y + 2}, ${x} ${y} `
        }
      }

      // Complete the path
      path += `L${containerSize} ${containerSize} L0 ${containerSize} Z`

      setWavePath1(path)
    },
    [containerSize],
  )

  // Function to update second wave path with different phase
  const updateWavePath2 = useCallback(
    (value: number) => {
      const amplitude = 4 // Slightly smaller amplitude
      const frequency = 1.5 // Different frequency
      const phaseShift = Math.PI / 2 // Phase difference from first wave

      let path = `M0 15 `

      const points = 10
      const step = containerSize / points

      for (let i = 0; i <= points; i++) {
        const x = i * step
        // Different phase for second wave
        const y = 15 + amplitude * Math.sin((frequency * Math.PI * i) / points + value * Math.PI * 2 + phaseShift)

        if (i === 0) {
          path += `L${x} ${y} `
        } else {
          const prevX = (i - 1) * step
          const cpX1 = prevX + step / 3
          const cpX2 = x - step / 3

          path += `C${cpX1} ${y + 2}, ${cpX2} ${y - 2}, ${x} ${y} `
        }
      }

      path += `L${containerSize} ${containerSize} L0 ${containerSize} Z`

      setWavePath2(path)
    },
    [containerSize],
  )

  // Initialize wave paths
  useEffect(() => {
    // Create initial wave paths
    updateWavePath1(0)
    updateWavePath2(0)
  }, [containerSize, updateWavePath1, updateWavePath2])

  // Update water level when percentage changes
  useEffect(() => {
    Animated.timing(waterLevel, {
      toValue: clampedPercentage,
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start()
  }, [clampedPercentage, waterLevel])

  // Continuous wave animation for first wave
  useEffect(() => {
    // Create a wave animation that oscillates in place
    Animated.loop(
      Animated.timing(waveOffset1, {
        toValue: 1,
        duration: 3000, // Slower for smoother animation
        easing: Easing.linear, // Linear for continuous movement
        useNativeDriver: false,
      }),
    ).start()

    // Update the wave path based on the animation value
    const animationListener = waveOffset1.addListener(({ value }) => {
      updateWavePath1(value)
    })

    return () => {
      waveOffset1.removeListener(animationListener)
    }
  }, [waveOffset1, updateWavePath1])

  // Continuous wave animation for second wave (with different timing)
  useEffect(() => {
    // Create a wave animation that oscillates in place with different timing
    Animated.loop(
      Animated.timing(waveOffset2, {
        toValue: 1,
        duration: 4000, // Even slower for the second wave
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start()

    // Update the second wave path based on the animation value
    const animationListener = waveOffset2.addListener(({ value }) => {
      updateWavePath2(value)
    })

    return () => {
      waveOffset2.removeListener(animationListener)
    }
  }, [waveOffset2, updateWavePath2])

  // Convert percentage to actual height
  const waterHeight = waterLevel.interpolate({
    inputRange: [0, 100],
    outputRange: [0, containerSize * 1], // Max 80% of container height
  })

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }]}>
      <Animated.View
        style={[
          styles.waterContainer,
          {
            height: waterHeight,
            bottom: 0,
          },
        ]}
      >
        <View style={styles.wave}>
          <Svg height="100%" width="100%" style={{ position: "absolute" }}>
            <Defs>
              <LinearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={waveColor} stopOpacity="0.6" />
                <Stop offset="1" stopColor={waveColor} stopOpacity="0.3" />
              </LinearGradient>
              <LinearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={waveColor} stopOpacity="0.8" />
                <Stop offset="1" stopColor={waveColor} stopOpacity="0.5" />
              </LinearGradient>
            </Defs>
            {/* Second wave (rendered first to be behind) */}
            <Path d={wavePath2} fill="url(#grad2)" />
            {/* First wave (rendered second to be in front) */}
            <Path d={wavePath1} fill="url(#grad1)" />
          </Svg>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 100,
  },
  waterContainer: {
    position: "absolute",
    width: "100%",
    overflow: "hidden",
  },
  wave: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
})

export default WaterWaveAnimation

