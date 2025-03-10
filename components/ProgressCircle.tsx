import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const size = width * 0.38;
const strokeWidth = 3;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;
const totalWeeks = 40;
const padding = 10; // Padding to prevent clipping

interface ProgressCircleProps {
  weeksComplete: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressCircle: React.FC<ProgressCircleProps> = ({ weeksComplete }) => {
  const completedWeeks = weeksComplete || 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(completedWeeks / totalWeeks, {
      duration: 1000, // Animation duration in ms
    });
  }, [completedWeeks]);

  const strokeDashoffset = useDerivedValue(() =>
    interpolate(progress.value, [0, 1], [circumference, 0])
  );

  const angle = useDerivedValue(() => interpolate(progress.value, [0, 1], [-90, 270]));
  const radians = useDerivedValue(() => (angle.value * Math.PI) / 180);

  const center = (size + padding * 2) / 2; // New center considering padding

  const dotX = useDerivedValue(() => center + radius * Math.cos(radians.value));
  const dotY = useDerivedValue(() => center + radius * Math.sin(radians.value));

  return (
    <View style={styles.container}>
      <Svg
        width={size + padding * 2}
        height={size + padding * 2}
        viewBox={`0 0 ${size + padding * 2} ${size + padding * 2}`}
      >
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="white"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="#AF4D93"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`} // Adjust rotation center
        />

        {/* Animated Dot */}
        <AnimatedCircle cx={dotX} cy={dotY} r={7} fill="#E162BC" stroke="#E162BC" strokeWidth={3} />
        <AnimatedCircle cx={dotX} cy={dotY} r={4.5} fill="transparent" stroke="white" strokeWidth={3} />
        <AnimatedCircle cx={dotX} cy={dotY} r={3.5} fill="#E162BC" />
      </Svg>

      {/* Text Inside Circle */}
      <View style={styles.textContainer}>
        <Text style={{ fontSize: 11, color: "#fff" }}>WEEK</Text>
        <Text style={styles.weekText}>{completedWeeks}</Text>
        <Text style={styles.additionalText}>+3 day</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
  },
  weekText: {
    fontSize: 47,
    color: "white",
    fontFamily: "Inter500",
    letterSpacing: 0.9,
  },
  additionalText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Inter600",
    letterSpacing: 0.9,
  },
});

export default ProgressCircle;
