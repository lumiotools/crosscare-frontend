import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { BarChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import HeartCard from "@/components/HeartCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import MoonIcon from "@/assets/images/Svg/MoonIcon";
import SleepLogModal from "./modal/sleepmodal";
import { MenuProvider } from "react-native-popup-menu";
import DeleteMenu from "./modal/deletemodal";
import MoonIcon1 from "@/assets/images/Svg/MoonIcon1";
import { useSelector } from "react-redux";
import { ActivityIndicator } from "react-native";

const { width } = Dimensions.get("window");
const BAR_WIDTH = 20;
const SPACING = (width - BAR_WIDTH * 10) / 8;
const MAX_HEIGHT = 200;
type CustomBarProps = {
  item: { day: string; hours: number; date: string };
  index: number;
  isSelected: boolean;
};

interface ChartDataEntry {
  day: string;
  hours: number;
  date: string;
}

interface SleepEntry {
  id: string;
  date: string;
  sleepStart: string;
  sleepEnd: string;
  duration: string;
}

const sleepData: SleepEntry[] = [
  {
    id: "1",
    date: "26th Feb, 2025",
    sleepStart: "11:30 PM",
    sleepEnd: "7:30 AM",
    duration: "8 hr 30 min",
  },
  {
    id: "2",
    date: "27th Feb, 2025",
    sleepStart: "11:30 PM",
    sleepEnd: "7:30 AM",
    duration: "8 hr",
  },
];

export default function tracksleep() {
  // Mock data for the weekly chart
  const [logAdded, setLogAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // Default to Wednesday (index 3)
  const [tooltipAnim] = useState(new Animated.Value(0)); // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepEntry[]>(sleepData);
  const [CharData, setChartData] = useState<ChartDataEntry[]>([]);

  const user = useSelector((state: any) => state.user);

  const [isModalVisible, setIsModalVisible] = useState(false);

  // Add these functions to handle the modal
  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSaveSleepLog = (date: Date, sleepTime: Date, wakeTime: Date) => {
    // Format the times for display
    const formattedSleepTime = sleepTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const formattedWakeTime = wakeTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate duration (this is a simple calculation, might need adjustment)
    const sleepMs = sleepTime.getTime();
    const wakeMs = wakeTime.getTime();
    let durationMs = wakeMs - sleepMs;

    // If wake time is earlier than sleep time, assume it's the next day
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000;
    }

    const durationHours = Math.floor(durationMs / (60 * 60 * 1000));
    const durationMinutes = Math.floor(
      (durationMs % (60 * 60 * 1000)) / (60 * 1000)
    );

    const formattedDuration = `${durationHours} hr${
      durationMinutes > 0 ? ` ${durationMinutes} min` : ""
    }`;

    // Format the date
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Create a new sleep entry
    const newEntry: SleepEntry = {
      id: (sleepLogs.length + 1).toString(),
      date: formattedDate,
      sleepStart: formattedSleepTime,
      sleepEnd: formattedWakeTime,
      duration: formattedDuration,
    };

    // Add the new entry to the sleep data
    // Note: In a real app, you would likely use state management or API calls here
    setSleepLogs((prevLogs) => [newEntry, ...prevLogs]);

    // Force a re-render (in a real app, you'd use state management)
    // This is just for demonstration
    setIsModalVisible(false);
  };

  // Sample data for the last 7 days
  // const data = [
  //   { day: "S", hours: 7.5, date: "FEB 25, 2025" },
  //   { day: "M", hours: 8.2, date: "FEB 26, 2025" },
  //   { day: "T", hours: 6.5, date: "FEB 27, 2025" },
  //   { day: "W", hours: 7.8, date: "FEB 28, 2025" },
  //   { day: "T", hours: 5.5, date: "FEB 29, 2025" },
  //   { day: "F", hours: 8.5, date: "MAR 1, 2025" },
  //   { day: "S", hours: 7.2, date: "MAR 2, 2025" },
  // ];

  const getSleepStatus = async () => {
    setLoading(true); // Show loader
    try {
      const response = await fetch(
        `http://192.168.1.102:8000/api/user/activity/${user.user_id}/sleepstatus`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log(data);
      setSleepLogs(data);

      const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
    const fullWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Create a map to store unique sleep data
    const sleepMap = new Map();

    data.forEach((entry: { date: string | number | Date; duration: { split: (arg0: string) => { (): any; new(): any; map: { (arg0: (part: any, index: any) => number): [any, any]; new(): any; }; }; }; }) => {
      const date = new Date(entry.date);
      const fullDay = date.toLocaleString("en-US", { weekday: "long" }); // Get full weekday name
      const dayIndex = fullWeekdays.indexOf(fullDay); // Get unique index

      if (dayIndex === -1) return; // Skip invalid dates

      const dayLetter = fixedWeekdays[dayIndex]; // Get S, M, T, W...
      
      // Extract sleep duration
      const [hours, minutes] = entry.duration.split(" ").map((part: string, index: number) => {
        if (index === 0) return parseFloat(part); // Extract hours
        if (index === 2) return parseFloat(part) / 60; // Convert minutes to fraction of an hour
        return 0;
      });

      // Store data uniquely per day
      sleepMap.set(dayIndex, {
        day: dayLetter,
        hours: hours + minutes,
        date: entry.date,
      });
    });

    // Ensure all weekdays exist, filling missing ones with zero
    const chartData = fixedWeekdays.map((day, index) => {
      return sleepMap.get(index) || { day, hours: 0, date: "" };
    });

      setChartData(chartData);
    } catch (error) {
      console.error("Error fetching sleep data:", error);
    } finally {
      setLoading(false); // Hide loader
    }
  };

  useEffect(() => {
    getSleepStatus();
  }, []);

  const handleDeleteLog = async(id: string) => {
    console.log(id);
    const response = await fetch(`http://192.168.1.102:8000/api/user/activity/${user.user_id}/sleepstatus/delete/${id}`,{
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log(data);
    setSleepLogs(sleepLogs.filter((log) => log.id !== id));
  };


  // ✅ Convert "10.0" to "10 hr 0 min" format
  const formatDuration = (duration: string | null | undefined) => {
    if (!duration) return "0 hr 0 min"; // Default if missing
    const totalMinutes = parseFloat(duration) * 60;
    if (isNaN(totalMinutes)) return "0 hr 0 min"; // Handle invalid numbers

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  };

  // ✅ Convert "03/08/2025" to "08 March, 25"
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    // Function to add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return "th"; // Covers 4th-20th
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    const maxWeight = Math.max(...CharData.map((item) => item.hours));
    const minWeight = Math.min(...CharData.map((item) => item.hours));

    // Calculate rounded max for y-axis (round up to nearest 5)
    const roundedMax = Math.ceil(maxWeight / 5) * 5;
    // Calculate rounded min for y-axis (round down to nearest 5)
    const roundedMin = Math.floor(minWeight / 5) * 5;

    // Create appropriate y-axis labels based on data range
    const range = roundedMax - roundedMin;
    const step = Math.ceil(range / 4); // We want about 4 labels

    const labels = [];
    for (let i = 0; i <= 4; i++) {
      const value = roundedMin + step * i;
      if (value <= roundedMax) {
        labels.push(value);
      }
    }

    // Make sure max value is included
    if (labels[labels.length - 1] < roundedMax) {
      labels.push(roundedMax);
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    };
  }, [CharData]); // Only recalculate when data changes

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
    const normalizedWeight = item.hours - roundedMin; // Adjust for minimum value
    const barHeight = (normalizedWeight / dataRange) * MAX_HEIGHT;

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
              isSelected ? ["#B0C0D0", "#B0C0D0"] : ["#8AA1B9", "#8AA1B9"]
            }
            style={[styles.bar, { height: "100%" }]}
          />
        </View>

        {isSelected && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>SLEEP</Text>
              <Text style={styles.tooltipWeight}>
                ~{item.hours}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#E6EBF0",
                  }}
                >
                  hr
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
    <MenuProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Sleep</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Feather name="more-vertical" size={20} color="#E5E5E5" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Heart Rate Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <View style={styles.moonIcon}>
                <MoonIcon width={88} height={88} />
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 14,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: "#E5E5E5",
                fontFamily: "Inter600",
              }}
            >
              Hi {user.user_name}!
            </Text>

            {logAdded ? (
              <View>
                <Text
                  style={{
                    color: "#E5E5E5",
                    fontFamily: "Inter400",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Logs added
                </Text>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    gap: 14,
                  }}
                >
                  <Text
                    style={{
                      color: "#E5E5E5",
                      fontFamily: "Inter400",
                      fontSize: 14,
                    }}
                  >
                    Did you sleep at 11:30 PM?
                  </Text>
                  <Text
                    style={{
                      color: "#E5E5E5",
                      fontFamily: "Inter400",
                      fontSize: 14,
                    }}
                  >
                    Did you wake up at 07:30 AM?
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 48,
                    marginTop: 6,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 27,
                      paddingVertical: 6,
                      backgroundColor: "#547698",
                      borderWidth: 2,
                      borderColor: "#E6EBF0",
                      borderRadius: 99,
                      boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                    }}
                    onPress={() => setIsModalVisible(true)}
                  >
                    <Text
                      style={{
                        color: "#E5E5E5",
                        fontFamily: "Inter400",
                        fontSize: 14,
                      }}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 27,
                      paddingVertical: 6,
                      backgroundColor: "#547698",
                      borderWidth: 2,
                      borderColor: "#E6EBF0",
                      borderRadius: 99,
                      boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                    }}
                    onPress={() => setLogAdded(true)}
                  >
                    <Text
                      style={{
                        color: "#E5E5E5",
                        fontFamily: "Inter400",
                        fontSize: 14,
                      }}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View
            style={{
              marginTop: 30,
              marginHorizontal: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(229, 229, 229, 0.20);",
              }}
            >
              <Text
                style={{
                  color: "#E5E5E5",
                  fontFamily: "Inter500",
                  fontSize: 16,
                }}
              >
                My Sleep
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#335C85",
                  borderWidth: 2,
                  borderColor: "#547698",
                  flexDirection: "row",
                  paddingHorizontal: 12,
                  gap: 5,
                  paddingVertical: 8,
                  borderRadius: 32,
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                }}
                onPress={handleOpenModal}
              >
                <Ionicons name="add" size={14} color={"#FFF6ED"} />
                <Text
                  style={{
                    color: "#FFF6ED",
                    fontSize: 12,
                    fontFamily: "Inter500",
                  }}
                >
                  Add Log
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View
                style={{
                  marginVertical: 20,
                }}
              >
                <ActivityIndicator size="small" color="#335C85" />
              </View>
            ) : sleepLogs.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 40,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <MoonIcon1 width={24} height={24} />
                  <Text
                    style={{
                      color: "#547698",
                      fontSize: 14,
                      fontFamily: "Inter500",
                    }}
                  >
                    No sleep tracked yet!
                  </Text>
                </View>
              </View>
            ) : (
              sleepLogs.map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    flexDirection: "column",
                    paddingVertical: 21,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(229, 229, 229, 0.20);",
                    gap: 17,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontFamily: "Inter700",
                          color: "white",
                          fontSize: 16,
                        }}
                      >
                        {entry.duration}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter400",
                          color: "white",
                          fontSize: 12,
                        }}
                      >
                        {formatDate(entry.date)}
                      </Text>
                    </View>
                    <DeleteMenu onDelete={() => handleDeleteLog(entry.id)} />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter400",
                          fontSize: 12,
                          color: "white",
                        }}
                      >
                        Sleep
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter500",
                          fontSize: 14,
                          color: "white",
                        }}
                      >
                        {entry.sleepStart}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter400",
                          fontSize: 12,
                          color: "white",
                        }}
                      >
                        Wake
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter500",
                          fontSize: 14,
                          color: "white",
                        }}
                      >
                        {entry.sleepEnd}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Connect to Application */}
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

          {/* Analysis Section */}
          <View style={styles.analysisSection}>
            <View style={styles.analysisHeader}>
              <View style={styles.analysisTab}>
                <MaterialIcons name="bar-chart" size={18} color="#547698" />
                <Text style={styles.analysisTabText}>Analysis</Text>
              </View>
              <TouchableOpacity style={styles.periodSelector}>
                <Text style={styles.periodText}>Last 7 Days</Text>
                <Ionicons name="chevron-down" size={14} color="#E5E5E5" />
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

            {/* Chart area */}
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
                {CharData.map((item, index) => (
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

          {/* Bottom Message */}
          <View style={styles.bottomContainer}>
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>Get a good night’s sleep</Text>
              <Text style={styles.messageSubtitle}>
                Set a reminder and stay on track.
              </Text>
            </View>
            <TouchableOpacity style={styles.reminderButton}>
              <Ionicons name="alarm" size={16} color="#FEF8FD" />
              <Text style={styles.reminderButtonText}>Set Reminder</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <SleepLogModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          onSave={handleSaveSleepLog}
          reload={getSleepStatus}
        />
      </SafeAreaView>
    </MenuProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001F3E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    color: "white",
    fontFamily: "DMSans600",
  },
  moreButton: {
    padding: 4,
  },
  heartRateContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  progressContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  progressCircle: {
    position: "absolute",
  },
  heartRateTextContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  analysisContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
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
    color: "#E5E5E5",
    letterSpacing: 0.28,
    fontFamily: "Inter400",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#547698",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#E6EBF0",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.10);",
    alignItems: "center",
  },
  moonIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  bpmValue: {
    fontSize: 48,
    fontWeight: "300",
    color: "#fff",
  },
  heartIconContainer: {
    position: "absolute",
    top: "40%",
    right: "30%",
  },
  bpmLabel: {
    fontSize: 14,
    color: "#fff",
    marginTop: 5,
  },
  connectionSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connectionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthAppIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
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
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    paddingLeft: SPACING,
  },
  barContainer: {
    width: BAR_WIDTH,
    marginRight: SPACING,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
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
    backgroundColor: "#547698",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // tooltipArrow: {
  //   width: 2, // Width of the line
  //   height: "170%", // Height of the line - adjust as needed
  //   backgroundColor: "#B0C0D0", // Same color as tooltip
  //   // marginRight: 4, // Small gap between line and tooltip content
  // },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#E5E5E5",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#E6EBF0",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#E6EBF0",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#E6EBF0",
    fontFamily: "Inter500",
  },
  connectionText: {
    fontSize: 15,
  },

  connectButtonText: {
    color: "#FF3B30",
    fontWeight: "500",
    fontSize: 13,
  },
  analysisSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  analysisTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  analysisTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  analysisIcon: {
    marginRight: 5,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  daysSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  daysSelectorText: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },

  yAxisLabels: {
    width: 20,
    height: 120,
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 5,
  },

  barColumn: {
    alignItems: "center",
    width: 30,
  },

  dayLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#999",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#335C85",
    borderWidth: 1,
    borderColor: "#547698",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#E5E5E5",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? "auto" : 5,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 14,
    color: "#E5E5E5",
    textTransform: "capitalize",
    fontFamily: "Inter500",
  },
  messageSubtitle: {
    fontSize: 12,
    color: "#8A8A8A",
    fontFamily: "Inter400",
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#335C85",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#547698",
    paddingVertical: 10,
    boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
    borderRadius: 20,
  },
  reminderButtonText: {
    color: "#FEF8FD",
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "Inter500",
  },
  sectionContainer: {
    marginTop: 40,
    paddingHorizontal: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: "white",
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
    color: "white",
  },
  connectButton: {
    color: "#FFD764",
    fontSize: 14,
    fontFamily: "Inter600",
    lineHeight: 22,
  },
});
