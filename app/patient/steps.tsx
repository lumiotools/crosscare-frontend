import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  Feather,
  MaterialIcons,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import StepsIcon from "@/assets/images/Svg/StepsIcon";
import { LinearGradient } from "expo-linear-gradient";
import StepsModal from "./modal/stepsmodal";

const { width } = Dimensions.get("window");
const BAR_WIDTH = 20;
const SPACING = (width - BAR_WIDTH * 10) / 8;
const MAX_HEIGHT = 200;

// Define the CustomBarProps interface
interface CustomBarProps {
  item: {
    day: string;
    steps: number;
    date: string;
  };
  index: number;
  isSelected: boolean;
}

// Custom Progress Bar Component
const CustomProgressBar = ({ progress }: { progress: number }) => {
  const progressWidth = `${progress * 100}%`;

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarBackground, { width: "100%" }]}>
        <View
          style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  );
};

const step = () => {
  const [stepGoal, setStepGoal] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stepsWalked, setStepsWalked] = useState(0); // This can be dynamic based on actual step count
  
  // Calculate progress based on goal (if set)
  const progress = stepGoal ? stepsWalked / stepGoal : 0;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // Default to Wednesday (index 3)
  const [tooltipAnim] = useState(new Animated.Value(0)); // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSaveGoal = (steps: string) => {
    const parsedSteps = Number.parseInt(steps, 10)
    if (!isNaN(parsedSteps) && parsedSteps > 0) {
      setStepGoal(parsedSteps)
    }
    setModalVisible(false)
  }

  // Sample data for the last 7 days
  const data = [
    { day: "S", steps: 8542, date: "FEB 25, 2025" },
    { day: "M", steps: 12350, date: "FEB 26, 2025" },
    { day: "T", steps: 9876, date: "FEB 27, 2025" },
    { day: "W", steps: 15240, date: "FEB 28, 2025" },
    { day: "T", steps: 7890, date: "FEB 29, 2025" },
    { day: "F", steps: 11425, date: "MAR 1, 2025" },
    { day: "S", steps: 9650, date: "MAR 2, 2025" },
  ];

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    // Step values are divided by 1000 to represent in thousands
    const maxSteps = Math.max(...data.map((item) => item.steps)) / 1000; // Convert to thousands
    const minSteps = Math.min(...data.map((item) => item.steps)) / 1000; // Convert to thousands

    // Calculate rounded max for y-axis (round up to nearest integer)
    const roundedMax = Math.ceil(maxSteps);
    // Calculate rounded min for y-axis (round down to nearest integer)
    const roundedMin = Math.floor(minSteps);

    // Create appropriate y-axis labels based on the new range
    const range = roundedMax - roundedMin;
    const step = Math.ceil(range / 4); // Divide the range into 4 labels

    const labels = [];
    for (let i = 0; i <= 4; i++) {
      const value = roundedMin + step * i;
      if (value <= roundedMax) {
        labels.push(value);
      }
    }

    // Ensure max value is included
    if (labels[labels.length - 1] < roundedMax) {
      labels.push(roundedMax);
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    };
  }, [data]); // Recalculate when data changes
  // Only recalculate when data changes

  // Function to hide tooltip after a delay
  const hideTooltipAfterDelay = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Set a new timeout to hide the tooltip after 3 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedIndex(null);
      });
    }, 3000);
  };

  const handleBarPress = (index: number): void => {
    if (selectedIndex === index) {
      return; // Already selected
    }

    // Animate tooltip disappearing and reappearing
    Animated.sequence([
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedIndex(index);

    Animated.timing(tooltipAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Set timeout to hide tooltip after delay
    hideTooltipAfterDelay();
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const CustomBar = ({ item, index, isSelected }: CustomBarProps) => {
    // Calculate bar height based on data range
    const dataRange = roundedMax - roundedMin;
  const normalizedSteps = (item.steps/1000) - roundedMin; // Adjust for minimum value
  const barHeight = dataRange === 0 ? 0 : (normalizedSteps / dataRange) * MAX_HEIGHT;


    const formatSteps = (steps: number) => {
      return steps >= 1000 ? `${(steps / 1000).toFixed(1)}` : steps.toString();
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleBarPress(index)}
        style={styles.barContainer}
      >
        <View style={styles.barLabelContainer}>
          <Text style={styles.barLabel}>{item.day}</Text>
        </View>

        <View style={[styles.barWrapper, { height: barHeight }]}>
          <LinearGradient
            colors={
              isSelected ? ["#5E4FA2", "#5E4FA2"] : ["#B5AED4", "#B5AED4"]
            }
            style={[styles.bar, { height: "100%" }]}
          />
        </View>

        {isSelected && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>STEPS</Text>
              <Text style={styles.tooltipWeight}>
                {formatSteps(item.steps)}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#5E4FA2",
                  }}
                >
                  k
                </Text>
              </Text>
              <Text style={styles.tooltipDate}>{item.date}</Text>
            </View>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Steps</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Step Count Section */}
        <View style={styles.stepCountContainer}>
          <View style={styles.stepsCircleContainer}>
            <View style={styles.stepsCircle}>
              <StepsIcon width={80} height={80} />
            </View>
          </View>
          <CustomProgressBar progress={progress} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.stepCountText}>
              {stepsWalked}{" "}
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter400",
                  color: "black",
                }}
              >
                {stepGoal ? `of ${stepGoal} steps walked` : "steps walked"}
              </Text>
            </Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
              <FontAwesome5 name="pen" size={15} color="#707070" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connect to Application Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connect to Application</Text>
          <View style={styles.connectItem}>
            <Image
              source={require("../../assets/images/applehealth.png")}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.connectText}>Health App</Text>
            <TouchableOpacity>
              <Text style={styles.connectButton}>CONNECT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connect to Device Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connect to Device</Text>
          <View style={styles.connectItem}>
            <Image
              source={require("../../assets/images/fitbit.png")}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.connectText}>Fitbit</Text>
            <TouchableOpacity>
              <Text style={styles.connectButton}>CONNECT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <View style={styles.analysisTab}>
              <MaterialIcons name="bar-chart" size={18} color="#CDC8E2" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>Last 7 Days</Text>
              <Ionicons name="chevron-down" size={14} color="#7E72B5" />
            </TouchableOpacity>
          </View>

          {/* Chart */}
        </View>
        <View style={styles.customChartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxisContainer}>
            {yAxisLabels.map((label, index) => (
              <Text key={index} style={styles.yAxisLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.chartContainer}>
            {/* Horizontal grid lines */}
            {yAxisLabels.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT },
                ]}
              />
            ))}

            {/* Bars */}
            <View style={styles.barsContainer}>
              {data.map((item, index) => (
                <CustomBar
                  key={index}
                  item={item}
                  index={index}
                  isSelected={selectedIndex === index}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <StepsModal visible={modalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveGoal} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    // paddingh: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "DMSans600",
  },
  menuButton: {
    padding: 8,
  },
  stepCountContainer: {
    // marginTop: 20,
    // alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  stepsCircleContainer: {
    alignItems: "center",
    // marginTop: 20,
    marginBottom: 20,
  },
  stepsCircle: {
    width: 180,
    height: 180,
    borderWidth: 4,
    borderColor: "#FFF",
    borderRadius: 100,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 0px 4.8px 0px rgba(0, 0, 0, 0.25);",
  },
  stepCountText: {
    fontFamily: "Inter600",
    fontSize: 17,
  },
  progressBarContainer: {
    width: "100%",
    height: 7,
    backgroundColor: "#EFEFEF",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
  },
  progressBarBackground: {
    backgroundColor: "#EFEFEF",
  },
  analysisContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  analysisTab: {
    flexDirection: "row",
    alignItems: "center",
  },
  analysisTabText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
    letterSpacing: 0.28,
    fontFamily: "Inter400",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEDF6",
    borderWidth: 1,
    borderColor: "#CDC8E2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#7E72B5",
  },
  barContainer: {
    width: BAR_WIDTH,
    marginRight: SPACING,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    paddingLeft: SPACING,
  },
  customChartContainer: {
    flexDirection: "row",
    marginTop: 10,
    height: MAX_HEIGHT + 40, // Add extra height for labels
    marginRight: 16,
  },
  yAxisContainer: {
    width: 40,
    height: MAX_HEIGHT,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 5,
  },
  yAxisLabel: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: "Inter400",
  },
  chartContainer: {
    flex: 1,
    height: MAX_HEIGHT,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  barWrapper: {
    width: BAR_WIDTH,
    borderRadius: 0,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barLabelContainer: {
    position: "absolute",
    bottom: -25,
    alignItems: "center",
  },
  barLabel: {
    fontSize: 14,
    color: "#888888",
    fontFamily: "Inter400",
  },

  tooltip: {
    position: "absolute",
    top: -60, // Positioned above the bar
    alignItems: "center",
    width: 120,
    zIndex: 10, // Ensure tooltip is above other elements
  },
  tooltipContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#5E4FA2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#5E4FA2",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#5E4FA2",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#5E4FA2",
  },
  editButton: {
    marginTop: 10,
  },
  sectionContainer: {
    marginTop: 30,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
    fontFamily: "Inter600",
  },
  connectItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingBottom: 10,
    paddingTop: 15,
    gap: 5,
  },
  connectText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter600",
    color: "#0C0C0C",
  },
  connectButton: {
    color: "#5E4FA2",
    fontSize: 14,
    fontFamily: "Inter600",
    lineHeight: 22,
  },
});

export default step;
