import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useEffect, useRef } from "react";
import HeartIcon from "@/assets/images/Svg/HeartIcon";
import { width } from '../constants/helper';

interface HeartRateProps {
  bpm: number;
  maxBpm?: number;
  progressColor?: string;
}

export default function HeartCard({
  bpm,
  maxBpm = 240,
  progressColor = "#E91E63",
}: HeartRateProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: bpm,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [bpm, animatedValue]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Circle properties
  const size = 180;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Use animated value to calculate strokeDashoffset
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, maxBpm],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Background Circle */}
      <View style={styles.backgroundCircle}>
        {/* SVG for Progress Circle */}
        <Svg width={size} height={size} style={styles.svg}>
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        {/* Content */}
        <View style={styles.content}>
          <Animated.Text style={styles.bpmValue}>{animatedValue}</Animated.Text>
          <View style={styles.heartContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] , marginTop:10,}}>

                <HeartIcon width={40} height={40} />
              {/* <Svg width={40} height={40} viewBox="0 0 24 20">
                <Path
                  d="M12 18.35l-1.45-1.32C5.4 12.36 2 9.28 2 5.5 2 2.42 4.42 0 7.5 0c1.74 0 3.41.81 4.5 2.09C13.09.81 14.76 0 16.5 0 19.58 0 22 2.42 22 5.5c0 3.78-3.4 6.86-8.55 11.54L12 18.35z"
                  fill={progressColor}
                />
                <Path
                  d="M7 10h2l2-6 2 12 2-6h2"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg> */}
            </Animated.View>
            {/* Heart Icon with ECG Line */}

            <Text style={styles.bpmText}>bpm</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Create an animated version of the Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundCircle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#FBECED",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.10);",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  content: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  bpmValue: {
    fontSize: 40,
    color: "#373737",
    fontFamily:'Inter400',
    // marginBottom: 5,
    marginRight:5,
  },
  heartContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  bpmText: {
    fontSize: 16,
    fontFamily:'Inter300',
    color: "#434343",
    marginLeft: 4,
  },
});
