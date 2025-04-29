import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MoonIcon1 from "@/assets/images/Svg/MoonIcon1";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SleepScreen = () => {
  const user = useSelector((state: any) => state.user);
  const userId = user?.user_id;
  useEffect(() => {
    const setsleepVisited = async () => {
      await AsyncStorage.setItem("sleep_7", "true");
    };

    setsleepVisited();
  }, [userId]);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#001F3E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sleep</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/patient/tracksleep")}
        >
          <Text style={styles.buttonText}>Track Sleep</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/patient/bedtime")}
        >
          <Text style={styles.buttonText}>Bed Time Calculator</Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          position: "absolute",
          zIndex: 99,
          left: 0,
          bottom: 0,
        }}
      >
        <MoonIcon1 />
      </View>
    </SafeAreaView>
  );
};

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
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    color: "white",
    fontFamily: "DMSans600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  moonContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    position: "relative",
  },
  moon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0A2647",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-30deg" }],
  },
  moonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#001B3D",
    transform: [{ translateX: 15 }],
  },
  star1: {
    position: "absolute",
    width: 4,
    height: 4,
    backgroundColor: "#FFB84C",
    borderRadius: 2,
    top: "30%",
    right: "30%",
  },
  star2: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "#FFB84C",
    borderRadius: 3,
    bottom: "35%",
    left: "35%",
  },
  menuButton: {
    padding: 8,
  },
  buttonContainer: {
    marginHorizontal: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    marginBottom: 30,
    flex: 1,
  },
  button: {
    width: "100%",
    height: 46,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,

    justifyContent: "center",
    alignItems: "center",
    borderColor: "#FFD764",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#002451",
    borderTopWidth: 1,
    borderTopColor: "#003471",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
});

export default SleepScreen;
