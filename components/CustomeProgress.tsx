import type React from "react"
import { View, Text, StyleSheet } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"
import { FontAwesome } from "@expo/vector-icons"

interface CustomProgressCircleProps {
  size: number
  strokeWidth: number
  progress: number
  value: number
}

export const CustomProgress: React.FC<CustomProgressCircleProps> = ({ size, strokeWidth, progress, value }) => {
  // Calculate dimensions
  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  // Calculate the path for the progress arc
  const calculateArcPath = (percentage: number) => {
    const angle = percentage * 180 - 90 // -90 to start from the right
    const angleRad = (angle * Math.PI) / 180
    const x = center + radius * Math.cos(angleRad)
    const y = center + radius * Math.sin(angleRad)

    // Create the arc path
    const largeArcFlag = percentage > 0.5 ? 1 : 0
    return `M ${center + radius} ${center} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y}`
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle cx={center} cy={center} r={radius} fill="#FFD6DE" />

        {/* Progress Arc */}
        <Path
          d={calculateArcPath(progress)}
          stroke="#FF3B30"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.valueText}>{value}</Text>
        <View style={styles.heartContainer}>
          <FontAwesome name="heart" size={16} color="#FF3B30" />
        </View>
        <Text style={styles.bpmText}>bpm</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  valueText: {
    fontSize: 48,
    fontWeight: "300",
    color: "#FF3B30",
  },
  heartContainer: {
    position: "absolute",
    top: "40%",
    right: "-20%",
  },
  bpmText: {
    fontSize: 14,
    color: "#FF3B30",
    marginTop: 5,
  },
})

