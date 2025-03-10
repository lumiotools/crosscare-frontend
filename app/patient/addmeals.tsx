import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, router } from 'expo-router';

// Define types for the API response
interface FoodNutrient {
  nutrientId: number;
  value: number;
  nutrientName?: string;
  nutrient?: {
    name: string;
  };
}

interface FoodItem {
  fdcId: number;
  description: string;
  name?: string; // Add name field
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FoodNutrient[];
}

interface FoodApiResponse {
  foods: FoodItem[];
  totalHits: number;
}

const API_KEY = "snfzY15agSASht2DEL9fJF5HhAxRntErPycnZvYq";

const addmeals = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = params.mealType as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Initial API call to get some default foods
  useEffect(() => {
    searchFood("common foods");
  }, []);

  const searchFood = async (query: string) => {
    if (!query.trim()) {
      setIsSearchMode(false);
      setDisplayData([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearchMode(true);

    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
          query
        )}&api_key=${API_KEY}`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.foods)) {
        const processedResults = processSearchResults(data.foods);
        setSearchResults(processedResults);
        setDisplayData(processedResults);
      } else {
        setSearchResults([]);
        setDisplayData([]);
        setError("No results found");
      }
    } catch (error) {
      console.error("Error searching for food:", error);
      setSearchResults([]);
      setDisplayData([]);
      setError(
        `Error searching for food: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const processSearchResults = (foods: FoodItem[]) => {
    const uniqueFoods = new Map();

    foods.forEach((food) => {
      const normalizedName = food.description.toLowerCase().trim();
      if (!uniqueFoods.has(normalizedName)) {
        // Extract a cleaner name from the description
        const cleanName = getCleanName(food.description);

        uniqueFoods.set(normalizedName, {
          ...food,
          // Add a name field derived from description
          name: cleanName,
          // Add default serving size if not present
          servingSize:
            food.servingSize || getDefaultServingSize(food.description),
          servingSizeUnit:
            food.servingSizeUnit || getDefaultServingUnit(food.description),
        });
      }
    });

    return Array.from(uniqueFoods.values()).slice(0, 50); // Return top 10 results
  };

  // Function to extract a cleaner name from the description
  const getCleanName = (description: string) => {
    // Remove brand names, UPC codes, and other unnecessary information
    let name = description;

    // Remove text in parentheses
    name = name.replace(/$$[^)]*$$/g, "");

    // Remove text after comma, colon, or dash
    name = name.split(/[,:-]/)[0];

    // Capitalize first letter of each word
    name = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Trim extra spaces
    name = name.trim();

    // If the name is too long, truncate it
    if (name.length > 25) {
      name = name.substring(0, 22) + "...";
    }

    return name;
  };

  const getDefaultServingSize = (description: string) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("coffee") || lowerDesc.includes("tea")) return 1;
    if (
      lowerDesc.includes("apple") ||
      lowerDesc.includes("banana") ||
      lowerDesc.includes("orange") ||
      lowerDesc.includes("guava")
    )
      return 1;
    if (lowerDesc.includes("almond")) return 5;
    if (lowerDesc.includes("egg")) return 1;
    if (lowerDesc.includes("milk")) return 0.75;
    if (lowerDesc.includes("walnut")) return 4;
    return 1;
  };

  const getDefaultServingUnit = (description: string) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("coffee") || lowerDesc.includes("tea"))
      return "Tea cup";
    if (lowerDesc.includes("apple")) return 'Small (2-3/4" dia)';
    if (lowerDesc.includes("banana")) return 'Small (4.5" long)';
    if (lowerDesc.includes("orange")) return 'fruit (2-5/8" dia)';
    if (lowerDesc.includes("almond")) return "almond";
    if (lowerDesc.includes("guava")) return "fruit, with refuse";
    if (lowerDesc.includes("egg")) return "large";
    if (lowerDesc.includes("milk")) return "glass";
    if (lowerDesc.includes("walnut")) return "piece (half of one)";
    return "serving";
  };

  const getCalories = (foodItem: any) => {
    if (foodItem.calories) {
      return foodItem.calories;
    }

    if (foodItem.foodNutrients) {
      const calories = foodItem.foodNutrients.find(
        (nutrient: FoodNutrient) =>
          (nutrient.nutrientName &&
            nutrient.nutrientName.toLowerCase().includes("energy")) ||
          (nutrient.nutrient &&
            nutrient.nutrient.name &&
            nutrient.nutrient.name.toLowerCase().includes("energy"))
      );
      return calories ? Math.round(calories.value) : 0;
    }

    return 0;
  };

  const toggleSelection = (item: any) => {
    const newSelected = new Set(selectedItems);
    if (selectedItems.has(item.fdcId)) {
      newSelected.delete(item.fdcId);
      setSelectedItems(newSelected);
    } else {
      newSelected.add(item.fdcId);
      setSelectedItems(newSelected);

      if (mealType) {
        // Prepare the food item to send back
        const calories = getCalories(item);
        const selectedFood = {
          name: item.name || item.description,
          portion: `${item.servingSize} ${item.servingSizeUnit}`,
          calories: calories,
        };

        // Navigate back to meals screen with the selected food
        router.push({
          pathname: "/patient/meals",
          params: {
            mealType,
            selectedFood: JSON.stringify(selectedFood),
          },
        });
      }
    }
  };

  // Update the renderFoodItem to use the new toggleSelection
  const renderFoodItem = ({ item }: { item: any }) => {
    const calories = getCalories(item);
    const isSelected = selectedItems.has(item.fdcId);

    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item)}
        style={styles.foodItem}
      >
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name || item.description}</Text>
          <Text style={styles.servingSize}>
            {item.servingSize} {item.servingSizeUnit}
          </Text>
        </View>
        <View style={styles.rightContent}>
          <Text style={styles.calories}>{calories} Cal</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => toggleSelection(item)}
          >
            {isSelected ? (
              <View
                style={{
                  width: 20,
                  height: 20,
                  padding: 2,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#EBF9F1",
                  borderRadius: 50,
                }}
              >
                <Feather name="check" size={15} color="#38C472" />
              </View>
            ) : (
              <Feather name="plus" size={18} color="#38C472" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#434343" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#666666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food"
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 2) {
                searchFood(text);
              } else if (text.length === 0) {
                searchFood("common foods");
              }
            }}
          />
          <TouchableOpacity onPress={()=>router.push('/patient/upccode')}>
            <AntDesign name="qrcode" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#00A991" />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.fdcId.toString()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Frequently Tracked Foods</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: "#fff",
    height: 56,
  },
  backButton: {
    // width: 44,
    // height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 50,
    paddingVertical: 12,
    marginLeft: 10,
    // height: 36,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#000",
  },
  loader: {
    marginTop: 50,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter600",
    color: "#373737",
    marginTop: 20,
    marginBottom: 10,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontFamily: "Inter500",
    color: "#434343",
    marginBottom: 4,
  },
  servingSize: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  calories: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "#434343",
    marginRight: 6,
  },
  addButton: {
    padding: 4,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#666666",
    textAlign: "center",
    fontFamily: "Inter400",
  },
});

export default addmeals;
