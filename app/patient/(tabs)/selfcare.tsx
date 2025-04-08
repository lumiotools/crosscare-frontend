import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ListRenderItemInfo,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SelfCareCard from "@/components/SelfCareCard";
import { FlatList } from "react-native";
import { ActivityIndicator } from "react-native";

// Define the content type
type ContentType = "EXERCISES" | "AUDIOS" | "STORIES";

type Category = {
  id: string;
  title: string;
  iconType: "heart" | "landscape" | "none" | "moon" | "cloud" | "sun" | "feather";
  count: number;
  contentType: ContentType;
  gradientColors: [string, string, ...string[]];
};

// Define the data for the cards
// const cardData: {
//   id: string;
//   title: string;
//   iconType: "heart" | "landscape" | "none" | "moon" | "cloud" | "sun" | "feather";
//   count: number;
//   contentType: ContentType;
//   gradientColors: [string, string, ...string[]];
// }[] = [
//   {
//     id: "favorites",
//     title: "My Favorites",
//     iconType: "heart",
//     count: 0,
//     contentType: "EXERCISES",
//     gradientColors: ["#4A6FE1", "#2C3E8C"],
//   },
//   {
//     id: "recent",
//     title: "Recently Used",
//     iconType: "landscape",
//     count: 1,
//     contentType: "EXERCISES",
//     gradientColors: ["#4A6FE1", "#00BCD4"],
//   },
//   // First screenshot cards
//   {
//     id: "1",
//     title: "Cope with Nightmares",
//     iconType: "cloud",
//     count: 5,
//     contentType: "EXERCISES",
//     gradientColors: ["#3949AB", "#5C6BC0", "#7986CB"],
//   },
//   {
//     id: "2",
//     title: "For Deep Sleep",
//     iconType: "moon",
//     count: 8,
//     contentType: "EXERCISES",
//     gradientColors: ["#303F9F", "#3F51B5", "#5C6BC0"],
//   },
//   {
//     id: "3",
//     title: "Sleep Habit Pack",
//     iconType: "cloud",
//     count: 8,
//     contentType: "EXERCISES",
//     gradientColors: ["#4527A0", "#00796B", "#009688"],
//   },
//   {
//     id: "4",
//     title: "For Fresh Mornings",
//     iconType: "sun",
//     count: 5,
//     contentType: "EXERCISES",
//     gradientColors: ["#00796B", "#009688", "#00ACC1"],
//   },
//   // Second screenshot cards
//   {
//     id: "5",
//     title: "Remote Wellness Pack",
//     iconType: "cloud",
//     count: 7,
//     contentType: "EXERCISES",
//     gradientColors: ["#3949AB", "#1976D2", "#0288D1"],
//   },
//   {
//     id: "6",
//     title: "Calm your Mind",
//     iconType: "feather",
//     count: 10,
//     contentType: "EXERCISES",
//     gradientColors: ["#4527A0", "#512DA8", "#5E35B1"],
//   },
//   {
//     id: "7",
//     title: "Sleep Sounds",
//     iconType: "cloud",
//     count: 18,
//     contentType: "AUDIOS",
//     gradientColors: ["#00796B", "#0097A7", "#0288D1"],
//   },
//   {
//     id: "8",
//     title: "Sleep Stories",
//     iconType: "cloud",
//     count: 33,
//     contentType: "STORIES",
//     gradientColors: ["#00796B", "#00838F", "#006064"],
//   },
//   {
//     id: "9",
//     title: "Essential Wellness Pack",
//     iconType: "cloud",
//     count: 12,
//     contentType: "EXERCISES",
//     gradientColors: ["#3949AB", "#303F9F", "#1A237E"],
//   },
//   {
//     id: "10",
//     title: "Put Your Mind to Ease",
//     iconType: "feather",
//     count: 8,
//     contentType: "EXERCISES",
//     gradientColors: ["#303F9F", "#283593", "#1A237E"],
//   },
// ];

const SelfCare = () => {

  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true); // Set loading to true before fetching data
  
      try {
        const response = await fetch("https://crosscare-backends.onrender.com/api/categories", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        // const text = await response.text(); // Get the response as text
  
        // console.log("Raw response text:", text); // Log the raw response
  
        // Check if response is JSON
        try {
          const data = await response.json(); // Try parsing as JSON
        const flattenedCategories = data.flat(); // Flatten the response array
        setCategories(flattenedCategories); // Set the flattened data to state
        console.log("Fetched categories:", flattenedCategories); // Set the fetched data to state
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false); // Set loading to false after data is fetched
      }
    };
  
    fetchCategories(); // Call the function to fetch categories
  }, []);
  
  
  // Create pairs of cards for rendering in rows
  const cardPairs = categories.reduce((result, card, index) => {
    // If index is even, create a new pair
    if (index % 2 === 0) {
      result.push([card]);
    } else {
      // If index is odd, add to the last pair
      result[result.length - 1].push(card);
    }
    return result;
  }, [] as Category[][]);

  const renderItem = ({ item }: ListRenderItemInfo<Category>) => (
    <SelfCareCard
      id={item.id}
      title={item.title}
      iconType={item.iconType}
      count={item.count}
      contentType={item.contentType}
      gradientColors={item.gradientColors}
    />
  )// Log the pairs of cards

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Self Care</Text>
        {/* <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={18} color="#434343" />
        </TouchableOpacity> */}
      </View>

      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.premiumSection}>
            <Text style={styles.premiumTitle}>Unlock full library</Text>
            <Text style={styles.premiumSubtitle}>150+ therapeutic exercises to improve sleep and more</Text>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>UNLOCK PREMIUM</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A6FE1" />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default SelfCare;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    color: "black",
    textAlign:'center',
    fontSize: 16,
    fontFamily: "OpenSans700",
  },
  scrollView: {
    flex: 1,
  },
  premiumSection: {
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  premiumTitle: {
    fontSize: 24,
    fontFamily: "DMSans600",
  },
  premiumSubtitle: {
    fontSize: 18,
    fontFamily: "DMSans400",
    marginTop: 10,
    marginBottom: 30,
  },
  premiumButton: {
    backgroundColor: "#f06292",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "DMSans600",
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  emptyCard: {
    width: "48%", // Same width as a card
  },
});