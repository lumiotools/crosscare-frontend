import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { calculateBedtimes, calculateWakeupTimes, parseTimeString } from "@/constants/constant";
import SunIcon from "@/assets/images/Svg/SunIcon";
import { width } from "../../constants/helper";
import MoonIcon from "@/assets/images/Svg/MoonIcon";
import { useSelector } from "react-redux";

// Handle time change
interface TimeChangeEvent {
  type: string;
  nativeEvent: any;
}

interface FormatTime {
  (date: Date): string;
}

const bedtime = () => {
  const [wakeUpTime, setWakeUpTime] = useState(new Date());
  const [sleepTime, setSleepTime] = useState(new Date());
  const [showWakeUpPicker, setShowWakeUpPicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  const user = useSelector((state:any)=>state.user);
  // Format time to display in the button

  const formatTime: FormatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12

    return `${hours}:${minutes} | ${ampm}`;
  };

  const onTimeChange = (
    event: TimeChangeEvent,
    selectedDate: Date | undefined,
    isWakeUp: boolean
  ): void => {
    if (Platform.OS === "android") {
      setShowWakeUpPicker(false);
      setShowSleepPicker(false);
    }

    if (selectedDate) {
      if (isWakeUp) {
        setWakeUpTime(selectedDate);
      } else {
        setSleepTime(selectedDate);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#001B3D" />

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

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Day/Night Circle */}
        <View style={styles.circleContainer}>
          <View
            style={{
              borderRadius: 999,
              borderWidth: 5,
              boxShadow:'0px 0px 4px 0px rgba(0, 0, 0, 0.10);',
              borderColor: "#E6EBF0",
              overflow: "hidden",
              flexDirection: "row",
              width: 180,
              height: 180,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#FFD764",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <SunIcon width={40} height={40} />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#547698",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MoonIcon width={40} height={40} />
            </View>
          </View>
        </View>

        {/* Welcome Text */}
        <Text style={styles.greeting}>Hi {user.user_name}!</Text>
        <Text style={styles.welcomeText}>
          Welcome to your bedtime calculator, pick a time to get started.
        </Text>

        {/* Time Selection */}
        <View style={styles.timeSelectionContainer}>
          <View>
            <Text style={styles.timeLabel}>I want to wake up at...</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderWidth: 2,
                  borderColor: "#E6EBF0",
                  borderRadius: 99,
                  backgroundColor: "#547698",
                  boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                }}
                onPress={() => setShowWakeUpPicker(true)}
              >
                <Text
                  style={{
                    color: "#E6EBF0",
                    fontSize: 16,
                    fontFamily: "Inter600",
                  }}
                >
                  {formatTime(wakeUpTime)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#E6EBF0",
                }}
                onPress={() => {
                  // Get the current displayed sleep time
                  const sleepTime = formatTime(wakeUpTime);

                  // Calculate wake-up times based on this sleep time
                  const sleepDate = parseTimeString(sleepTime);
                  const calculatedTimes = calculateBedtimes(sleepDate);

                  // Navigate to the wakeup screen with the calculated times
                  router.push({
                    pathname: "/patient/wakeup",
                    params: {
                      sleepTime: sleepTime,
                      wakeupTimes: JSON.stringify(calculatedTimes),
                    },
                  });
                }}
              >
                <Ionicons name="arrow-forward" size={16} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.orText}>Or</Text>
          <View>
            <Text style={styles.timeLabel}>I want to sleep up at...</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  borderWidth: 2,
                  borderColor: "#E6EBF0",
                  borderRadius: 99,
                  backgroundColor: "#547698",
                  boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                }}
                onPress={() => setShowSleepPicker(true)}
              >
                <Text
                  style={{
                    color: "#E6EBF0",
                    fontSize: 16,
                    fontFamily: "Inter600",
                  }}
                >
                  {formatTime(sleepTime)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#E6EBF0",
                }}
                onPress={() => {
                  // Get the current displayed sleep time

                  // Calculate wake-up times based on this sleep time
                  const sleepDate = parseTimeString(formatTime(sleepTime));
                  const calculatedTimes = calculateWakeupTimes(sleepDate);

                  // Navigate to the wakeup screen with the calculated times
                  router.push({
                    pathname: "/patient/sleepup",
                    params: {
                      sleepTime: formatTime(sleepTime),
                      wakeupTimes: JSON.stringify(calculatedTimes),
                    },
                  });
                }}
              >
                <Ionicons name="arrow-forward" size={16} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* DateTimePicker for Wake Up Time */}
      {showWakeUpPicker && (
        <DateTimePicker
          value={wakeUpTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) =>
            onTimeChange(event, selectedDate, true)
          }
          style={styles.dateTimePicker}
          textColor="#E6EBF0"
          themeVariant="dark"
        />
      )}

      {/* DateTimePicker for Sleep Time */}
      {showSleepPicker && (
        <DateTimePicker
          value={sleepTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) =>
            onTimeChange(event, selectedDate, false)
          }
          style={styles.dateTimePicker}
          textColor="#E6EBF0"
          themeVariant="dark"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001B3D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "white",
  },
  dateTimePicker: {
    backgroundColor: "#335C85",
    height: 200,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  circleContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: "white",
    fontFamily: "Inter600",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 12,
    color: "#E5E5E5",
    textAlign: "center",
    marginHorizontal: 40,
    lineHeight: 22,
    fontFamily: "Inter400",
    marginBottom: 40,
  },
  timeSelectionContainer: {
    flexDirection: "column",
    gap: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 16,
    color: "#E5E5E5",
    fontFamily: "Inter600",
    marginBottom: 12,
    alignSelf: "center",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#547698",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 24,
  },
  timeText: {
    fontSize: 18,
    color: "white",
    fontFamily: "Inter600",
    marginRight: 4,
  },
  ampmText: {
    fontSize: 18,
    color: "white",
    fontFamily: "Inter400",
    flex: 1,
  },
  arrowContainer: {
    backgroundColor: "#335C85",
    borderRadius: 20,
    padding: 8,
  },
  orText: {
    fontSize: 16,
    color: "#E5E5E5",
    fontFamily: "Inter400",
    marginVertical: 16,
  },
});

export default bedtime;
