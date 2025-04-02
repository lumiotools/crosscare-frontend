import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome, MaterialIcons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";

// Define the content type
type ContentType = "EXERCISES" | "AUDIOS" | "STORIES";

// Define the props interface for the card
interface SelfCareCardProps {
  id?: string;
  title: string;
  iconType: "heart" | "landscape" | "moon" | "none" | "cloud" | "sun" | "feather";
  count: number;
  contentType?: ContentType;
  gradientColors: [string, string, ...string[]];
}

const SelfCareCard = ({
  id,
  title,
  iconType,
  count,
  contentType = "EXERCISES",
  gradientColors,
}: SelfCareCardProps) => {
  // Function to render the appropriate icon based on iconType
  const renderIcon = () => {
    switch (iconType) {
      case "heart":
        return (
          <View style={styles.iconContainer}>
            <FontAwesome name="heart" size={70} color="rgba(255,255,255,0.2)" />
          </View>
        );
      case "landscape":
        return (
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="landscape"
              size={70}
              color="rgba(255,255,255,0.2)"
            />
          </View>
        );
      case "moon":
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="moon" size={50} color="rgba(255,255,255,0.2)" />
          </View>
        );
      case "feather":
        return (
          <View style={styles.iconContainer}>
            <Feather name="feather" size={50} color="rgba(255,255,255,0.2)" />
          </View>
        );
      case "cloud":
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="cloud" size={70} color="rgba(255,255,255,0.15)" />
          </View>
        );
      case "sun":
        return (
          <View style={styles.iconContainer}>
            <Ionicons name="sunny" size={70} color="rgba(255,255,255,0.15)" />
          </View>
        );
      default:
        return null;
    }
  };

  const handlePress = () => {
    // Using Expo Router's push method to navigate with params
    router.push({
      pathname: "/patient/excerises/excerise",
      params: {
        id: id,
        title:title,
        count: count.toString(),
        contentType,
        gradientColors: JSON.stringify(gradientColors),
      },
    });
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={handlePress}
      style={styles.cardContainer}
    >
      <LinearGradient colors={gradientColors} style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        {renderIcon()}
        <View style={styles.exerciseCountContainer}>
          <Text style={styles.exerciseCountText}>{count} {contentType}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '48%', // This controls the width in the grid
    marginBottom: 15,
  },
  card: {
    width: '100%', // This makes the gradient fill the container
    height: 180, // Adjusted height to match screenshot
    borderRadius: 20,
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    color: "white",
    fontSize: 22,
    fontFamily: "DMSans600",
    marginBottom: 10,
  },
  iconContainer: {
    position: "absolute",
    bottom: 50,
    right: 10,
    opacity: 0.3,
  },
  exerciseCountContainer: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    alignSelf: "flex-start",
    marginTop: "auto",
  },
  exerciseCountText: {
    color: "white",
    fontFamily: "DMSans400",
    fontSize: 12,
  },
});

export default SelfCareCard;