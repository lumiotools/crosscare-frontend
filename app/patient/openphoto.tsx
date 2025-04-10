import React, { useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Appbar } from "react-native-paper";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Pen from "@/assets/images/Svg/Pen";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const openphoto = () => {
  const params = useLocalSearchParams();
    const user = useSelector((state:any)=>state.user);
    const [details, setDetails] = React.useState([]);
    // const item = details;

  
    // Parse the params.item (which is likely a string)
    const item = typeof params.item === "string" ? JSON.parse(params.item) : null;
  
    console.log("Parsed Note Data:", item);

    const [datePart, timePart] = item?.date.split(", ");
    
    const formatDate = (dateString: string) => {
  // Split the date into day, month, and year (expected format: dd/mm/yyyy)
  const [day, month, year] = dateString.split("/");

  // Create a new Date object using the correct format: yyyy-mm-dd
  const formattedDate = `${year}-${month}-${day}`;
  const date = new Date(formattedDate);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error("Invalid date:", formattedDate);
    return "Invalid Date";
  }

  // Get the day, month, and year
  const dayOfMonth = date.getDate();
  const monthName = date.toLocaleString("default", { month: "short" }); // Get abbreviated month name (e.g., "Apr")
  const fullYear = date.getFullYear();

  // Adding the suffix to the day
  const suffix = (dayOfMonth: number): string => {
    if (dayOfMonth > 3 && dayOfMonth < 21) return "th"; // For dates like 4th, 5th, etc. till 20th
    switch (dayOfMonth % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return `${dayOfMonth}${suffix(dayOfMonth)} ${monthName}, ${fullYear}`;
};

    
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageSource.uri }} style={styles.image} resizeMode="cover" />
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.detailsContainer}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.text1}>Taken on </Text>
            <Text style={styles.text}>{formatDate(datePart)}</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.text1}>At</Text>
            <Text style={styles.text}> {timePart}</Text>
          </View>
        </View>
      </View>

      {/* Title and Description */}

      {/* Edit Icon */}
      <TouchableOpacity onPress={() =>
              router.push({
                pathname: "/patient/editphoto",
                params: {
                  item: JSON.stringify({
                    id: item.id,
                    title: item.title,
                    imageSource: item.imageSource.uri,
                    date: item.date,
                  }),
                },
              })
            } style={styles.editIcon}>
        <Pen/>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 20,
    // paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  
  appbar: {
    backgroundColor: "#fff",
    elevation: 0,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },
  imageContainer: {
    // alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 20,
    // marginBottom: 20,
    gap: 16,
    flexDirection: "column",
    marginHorizontal: 47,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#F5F5F5",
  },
  detailsContainer: {
    // alignItems: "center",
    flexDirection: "column",
    // justifyContent: "center",
    marginBottom: 20,
    marginTop: 16,
    gap: 10,
  },
  title: {
    color: "#373737",
    fontSize: 16,
    fontFamily: "OpenSans600",
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    fontFamily: "Inter700",
    color: "#757575",
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
    fontFamily: "OpenSans600",
  },
  moreButton: {
    padding: 4,
  },
  text1: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  editIcon: {
    position:'absolute',
    bottom: 20, 
    right: 20,
    // alignItems: "center",
    // justifyContent: "center",
    marginTop: 20,
  },
});

export default openphoto;
