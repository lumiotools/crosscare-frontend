import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Pen from "@/assets/images/Svg/Pen";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const openphoto = () => {
  const params = useLocalSearchParams();
  const user = useSelector((state: any) => state.user);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const item1 = details;

  // Parse the params.item (which is likely a string)
  const item = typeof params.item === "string" ? JSON.parse(params.item) : null;
  
  // console.log("Parsed Note Data:", item);

  // Safely get date parts - only try to split if createdAt exists
  const datePart = item1?.createdAt ? item1.createdAt.split(", ")[0] : null;
  const timePart = item1?.createdAt ? item1.createdAt.split(", ")[1] : null;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown Date";
    
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

  const getdetails = async () => {
    if (!item?.id || !user?.user_id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/journal/${item.id}`, 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch details: ${response.statusText}`);
      }
      
      const data = await response.json();
      // console.log("Fetched details:", data.data);
      setDetails(data.data);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused, fetching details...");
      getdetails();
      
      // Return a cleanup function
      return () => {
        // Any cleanup code if needed
      };
    }, [item?.id, user?.user_id])
  );
    
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
        <TouchableOpacity style={styles.menuButton} onPress={getdetails}>
          <Feather name={loading ? "loader" : "refresh-cw"} size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F76CCF" />
          <Text style={styles.loadingText}>Loading photo details...</Text>
        </View>
      ) : (
        <>
          {/* Image Section */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ 
                uri: item1?.imageSource || item?.imageSource?.uri 
              }} 
              style={styles.image} 
              resizeMode="cover" 
            />
            <Text style={styles.title}>{item1?.title || item?.title || "Untitled Photo"}</Text>
            <View style={styles.detailsContainer}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.text1}>Taken on </Text>
                <Text style={styles.text}>
                  {datePart ? formatDate(datePart) : "Unknown Date"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.text1}>At</Text>
                <Text style={styles.text}> {timePart || "Unknown Time"}</Text>
              </View>
            </View>
          </View>

          {/* Edit Icon */}
          <TouchableOpacity 
            onPress={() =>
              router.push({
                pathname: "/patient/editphoto",
                params: {
                  item: JSON.stringify({
                    id: item1?.id || item?.id,
                    title: item1?.title || item?.title || "Untitled Photo",
                    imageSource: item1?.imageSource || item?.imageSource?.uri,
                    date: item1?.createdAt || item?.date,
                  }),
                },
              })
            } 
            style={styles.editIcon}
          >
            <Pen/>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: "#373737",
    fontFamily: "OpenSans600",
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
    justifyContent: "flex-start",
    marginTop: 20,
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
    flexDirection: "column",
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
    marginTop: 20,
  },
});

export default openphoto;