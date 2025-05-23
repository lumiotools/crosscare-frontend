import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, Camera } from "expo-camera";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'react-native';

// USDA Food Data Central API key
const API_KEY = 'snfzY15agSASht2DEL9fJF5HhAxRntErPycnZvYq';

interface Nutrient {
  id: number;
  name: string;
  number: string;
  rank: number;
  unitName: string;
}

interface FoodNutrient {
  id: number;
  amount: number;
  type: string;
  nutrient: Nutrient;
  foodNutrientDerivation?: any;
}

interface LabelNutrients {
  calories?: { value: number };
  fat?: { value: number };
  saturatedFat?: { value: number };
  transFat?: { value: number };
  cholesterol?: { value: number };
  sodium?: { value: number };
  carbohydrates?: { value: number };
  fiber?: { value: number };
  sugars?: { value: number };
  protein?: { value: number };
  calcium?: { value: number };
  iron?: { value: number };
}

interface FoodData {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients: FoodNutrient[];
  labelNutrients?: LabelNutrients;
  servingSize?: number;
  servingSizeUnit?: string;
  gtinUpc?: string;
  dataSource?: string; // Added to track which API provided the data
}

interface FoodApiResponse {
  foods: FoodData[];
}

interface NutrientComponent {
  id: string
  points: number
  points_max: number
  unit: string
  value: number | null
}

interface NutriscoreData {
  components?: {
    negative: NutrientComponent[]
    positive: NutrientComponent[]
  }
  grade?: string
  score?: number
}

interface OpenFoodFactsProduct {
  product_name: string
  brands?: string
  ingredients_text?: string
  nutriscore_data?: NutriscoreData
  nutriments?: {
    energy?: number
    proteins?: number
    fat?: number
    carbohydrates?: number
    fiber?: number
    sugars?: number
    sodium?: number
    [key: string]: any
  }
  selected_images?: {
    front?: {
      display?: {
        [key: string]: string
      }
    }
  }
  image_front_url?: string
  image_url?: string
  product_quantity?: string
  product_quantity_unit?: string
  [key: string]: any
}

interface OpenFoodFactsResponse {
  status: number;
  product: OpenFoodFactsProduct;
}

interface NutrientScore {
  name: string;
  value: string | number;
  description: string;
  score: 'good' | 'medium' | 'bad';
  icon: string;
  points?: number; // Points for Nutri-Score calculation
}

// High-risk additives list (simplified)
const HIGH_RISK_ADDITIVES = [
  'e102', 'e104', 'e110', 'e120', 'e122', 'e123', 'e124', 'e127', 'e129', 'e131', 'e132', 'e133', 
  'e142', 'e151', 'e154', 'e155', 'e180', 'e210', 'e211', 'e212', 'e213', 'e214', 'e215', 'e216', 
  'e217', 'e218', 'e219', 'e220', 'e221', 'e222', 'e223', 'e224', 'e226', 'e227', 'e228', 'e249', 
  'e250', 'e251', 'e252', 'e310', 'e311', 'e312', 'e320', 'e321', 'e338', 'e339', 'e340', 'e341', 
  'e407', 'e407a', 'e450', 'e451', 'e452', 'e621', 'e950', 'e951', 'e954', 'e955', 'e962', 'e1201'
];

// Low-risk additives list (simplified)
const LOW_RISK_ADDITIVES = [
  'e100', 'e101', 'e140', 'e150', 'e153', 'e160', 'e161', 'e162', 'e163', 'e170', 'e171', 'e172', 
  'e173', 'e174', 'e175', 'e260', 'e261', 'e262', 'e263', 'e270', 'e290', 'e296', 'e297', 'e300', 
  'e301', 'e302', 'e304', 'e306', 'e307', 'e308', 'e309', 'e322', 'e325', 'e326', 'e327', 'e330', 
  'e331', 'e332', 'e333', 'e334', 'e335', 'e336', 'e337', 'e350', 'e351', 'e352', 'e353', 'e354', 
  'e355', 'e356', 'e357', 'e363', 'e380', 'e385', 'e400', 'e401', 'e402', 'e403', 'e404', 'e405', 
  'e406', 'e408', 'e410', 'e412', 'e413', 'e414', 'e415', 'e417', 'e418', 'e422', 'e440', 'e460', 
  'e461', 'e462', 'e463', 'e464', 'e465', 'e466', 'e470', 'e471', 'e472', 'e473', 'e474', 'e475', 
  'e476', 'e477', 'e481', 'e482', 'e483', 'e491', 'e492', 'e493', 'e494', 'e495', 'e500', 'e501', 
  'e503', 'e504', 'e507', 'e508', 'e509', 'e511', 'e513', 'e514', 'e515', 'e516', 'e517', 'e520', 
  'e521', 'e522', 'e523', 'e524', 'e525', 'e526', 'e527', 'e528', 'e529', 'e530', 'e535', 'e536', 
  'e538', 'e541', 'e551', 'e552', 'e553', 'e554', 'e555', 'e556', 'e558', 'e559', 'e570', 'e574', 
  'e575', 'e576', 'e577', 'e578', 'e579', 'e585', 'e620', 'e622', 'e623', 'e624', 'e625', 'e626', 
  'e627', 'e628', 'e629', 'e630', 'e631', 'e632', 'e633', 'e634', 'e635', 'e640', 'e900', 'e901', 
  'e902', 'e903', 'e904', 'e905', 'e907', 'e914', 'e920', 'e927', 'e938', 'e939', 'e941', 'e942', 
  'e943', 'e944', 'e948', 'e949', 'e953', 'e957', 'e959', 'e965', 'e966', 'e967', 'e968', 'e999', 
  'e1200', 'e1202', 'e1204', 'e1205', 'e1404', 'e1410', 'e1412', 'e1413', 'e1414', 'e1420', 'e1422', 
  'e1440', 'e1442', 'e1450', 'e1451', 'e1505', 'e1518', 'e1520'
];

export default function upccode() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foodData, setFoodData] = useState<FoodData | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [fdcId, setFdcId] = useState<number | null>(null);
  const [error, setError] = useState('');
   const [offProduct, setOffProduct] = useState<OpenFoodFactsProduct | null>(null)
   const [productImage, setProductImage] = useState<string | null>(null);
  const [nutritionScores, setNutritionScores] = useState<{
    negatives: NutrientScore[];
    positives: NutrientScore[];
    overallScore: number;
    nutritionScore: number;
    additivePenalty: number;
    scoreCategory: string;
    detectedAdditives: string[];
  }>({
    negatives: [],
    positives: [],
    overallScore: 0,
    nutritionScore: 0,
    additivePenalty: 0,
    scoreCategory: '',
    detectedAdditives: []
  });


  const askForCameraPermission = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  }, []);

  // Request Camera Permission
  useEffect(() => {
    askForCameraPermission();
  }, [askForCameraPermission]);
  

  const processNutritionData = (product: OpenFoodFactsProduct, data: FoodData) => {
    const negatives: NutrientScore[] = []
    const positives: NutrientScore[] = []
    const detectedAdditives: string[] = []
    let additivePenalty = 0
    let nutritionScore = 0
    let overallScore = 0
    let scoreCategory = ""

    // Check if we have nutriscore data from OpenFoodFacts
    if (product.nutriscore_data?.components) {
      // Process negative components
      product.nutriscore_data.components.negative.forEach((component) => {
        if (component.value !== null) {
          let score: "good" | "medium" | "bad" = "good"
          let description = ""
          let icon = ""

          // Determine score and description based on component id and points
          if (component.id === "energy") {
            icon = "flame-outline"
            if (component.points >= 8) {
              score = "bad"
              description = "High calorie content"
            } else if (component.points >= 4) {
              score = "medium"
              description = "A bit too caloric"
            } else {
              description = "Low calorie"
            }

            negatives.push({
              name: "Calories",
              value: `${Math.round(component.value)} ${component.unit === "kJ" ? "kJ" : "Cal"}`,
              description,
              score,
              icon,
              points: component.points,
            })
          } else if (component.id === "sugars") {
            icon = "coffee"
            if (component.points >= 8) {
              score = "bad"
              description = "High sugar content"
            } else if (component.points >= 4) {
              score = "medium"
              description = "Moderately sweet"
            } else {
              description = "Low sugar"
            }

            negatives.push({
              name: "Sugars",
              value: `${component.value}${component.unit}`,
              description,
              score,
              icon,
              points: component.points,
            })
          } else if (component.id === "saturated_fat") {
            icon = "droplet"
            if (component.points >= 8) {
              score = "bad"
              description = "High saturated fat"
            } else if (component.points >= 4) {
              score = "medium"
              description = "Moderate saturated fat"
            } else {
              description = "Low saturated fat"
            }

            negatives.push({
              name: "Saturated Fat",
              value: `${component.value}${component.unit}`,
              description,
              score,
              icon,
              points: component.points,
            })
          } else if (component.id === "salt") {
            icon = "droplet"
            if (component.points >= 8) {
              score = "bad"
              description = "Too salty"
            } else if (component.points >= 4) {
              score = "medium"
              description = "Moderately salty"
            } else {
              description = "Low sodium"
            }

            negatives.push({
              name: "Sodium",
              value: `${(component.value)}g`,
              description,
              score,
              icon,
              points: component.points,
            })
          }
        }
      })

      // Process positive components
      product.nutriscore_data.components.positive.forEach((component) => {
        if (component.value !== null) {
          let score: "good" | "medium" | "bad" = "good"
          let description = ""
          let icon = ""

          if (component.id === "fiber") {
            icon = "leaf"
            if (component.points >= 4) {
              score = "good"
              description = "High in fiber"
            } else if (component.points >= 2) {
              score = "medium"
              description = "Contains some fiber"
            } else {
              score = "bad"
              description = "Low fiber"
            }

            positives.push({
              name: "Fiber",
              value: `${component.value}${component.unit}`,
              description,
              score,
              icon,
              points: component.points,
            })
          } else if (component.id === "proteins") {
            icon = "fish"
            if (component.points >= 4) {
              score = "good"
              description = "Excellent amount of protein"
            } else if (component.points >= 2) {
              score = "medium"
              description = "Good amount of protein"
            } else {
              score = "bad"
              description = "Low protein"
            }

            positives.push({
              name: "Protein",
              value: `${component.value}${component.unit}`,
              description,
              score,
              icon,
              points: component.points,
            })
          } else if (component.id === "fruits_vegetables_legumes") {
            icon = "leaf"
            if (component.points >= 4) {
              score = "good"
              description = "High in fruits/vegetables"
            } else if (component.points >= 2) {
              score = "medium"
              description = "Contains some fruits/vegetables"
            } else {
              score = "bad"
              description = "Low in fruits/vegetables"
            }

            positives.push({
              name: "Fruits & Vegetables",
              value: `${component.value}${component.unit}`,
              description,
              score,
              icon,
              points: component.points,
            })
          }
        }
      })

      // Get nutrition score from API
      nutritionScore = product.nutriscore_data.score || 0

      // Check for additives in ingredients
      if (data.ingredients || product.ingredients_text) {
        // Convert to lowercase for case-insensitive matching
        const ingredientsLower = (data.ingredients || product.ingredients_text || "").toLowerCase()

        // Check for high-risk additives
        HIGH_RISK_ADDITIVES.forEach((additive) => {
          if (ingredientsLower.includes(additive)) {
            additivePenalty += 15 // -15 points per high-risk additive
            detectedAdditives.push(additive)
          }
        })

        // Check for low-risk additives
        LOW_RISK_ADDITIVES.forEach((additive) => {
          if (ingredientsLower.includes(additive)) {
            additivePenalty += 5 // -5 points per low-risk additive
            detectedAdditives.push(additive)
          }
        })

        // Cap the additive penalty at a reasonable value
        additivePenalty = Math.min(additivePenalty, 30)

        // Add additives to negatives if any found
        if (detectedAdditives.length > 0) {
          negatives.push({
            name: "Additives",
            value: detectedAdditives.length,
            description: detectedAdditives.length > 3 ? "Contains additives to avoid" : "Contains some additives",
            score: detectedAdditives.length > 3 ? "bad" : "medium",
            icon: "flask-outline",
          })
        }
      }

      // Calculate Final Score
      // Start with 100 points and subtract penalties
      overallScore = nutritionScore

      console.log("Nu", overallScore);

      // Ensure score is within 0-100 range
      overallScore = Math.max(0, Math.min(100, overallScore))

      // Determine Score Category
      if (overallScore >= 90) scoreCategory = "Excellent"
      else if (overallScore >= 70) scoreCategory = "Good"
      else if (overallScore >= 50) scoreCategory = "Moderate"
      else if (overallScore >= 30) scoreCategory = "Poor"
      else scoreCategory = "Very Poor"
    } else {
      // Fallback to basic scoring if no nutriscore data available
      // Get basic nutrient values
      const caloriesValue = data.labelNutrients?.calories?.value  || 0

      const sugarsValue = data.labelNutrients?.sugars?.value || getNutrientValueByName(data, "sugar") || 0

      const satFatValue = data.labelNutrients?.saturatedFat?.value || getNutrientValueByName(data, "saturated") || 0

      const sodiumValue = data.labelNutrients?.sodium?.value || getNutrientValueByName(data, "sodium") || 0

      const fiberValue = data.labelNutrients?.fiber?.value || getNutrientValueByName(data, "fiber") || 0

      const proteinValue = data.labelNutrients?.protein?.value || getNutrientValueByName(data, "protein") || 0

      // Simple scoring based on values
      if (caloriesValue > 0) {
        negatives.push({
          name: "Calories",
          value: `${Math.round(caloriesValue)} Cal`,
          description: caloriesValue > 500 ? "High calorie content" : "Moderate calories",
          score: caloriesValue > 500 ? "bad" : "medium",
          icon: "flame-outline",
        })
      }

      if (sugarsValue > 0) {
        negatives.push({
          name: "Sugars",
          value: `${sugarsValue}g`,
          description: sugarsValue > 15 ? "High sugar content" : "Moderate sugar",
          score: sugarsValue > 15 ? "bad" : "medium",
          icon: "coffee",
        })
      }

      if (satFatValue > 0) {
        negatives.push({
          name: "Saturated Fat",
          value: `${satFatValue}g`,
          description: satFatValue > 5 ? "High saturated fat" : "Moderate saturated fat",
          score: satFatValue > 5 ? "bad" : "medium",
          icon: "droplet",
        })
      }

      if (sodiumValue > 0) {
        negatives.push({
          name: "Sodium",
          value: `${Math.round(sodiumValue)}mg`,
          description: sodiumValue > 400 ? "High sodium" : "Moderate sodium",
          score: sodiumValue > 400 ? "bad" : "medium",
          icon: "droplet",
        })
      }

      if (fiberValue > 0) {
        positives.push({
          name: "Fiber",
          value: `${fiberValue}g`,
          description: fiberValue > 3 ? "Good source of fiber" : "Contains fiber",
          score: fiberValue > 3 ? "good" : "medium",
          icon: "leaf",
        })
      }

      if (proteinValue > 0) {
        positives.push({
          name: "Protein",
          value: `${proteinValue}g`,
          description: proteinValue > 5 ? "Good source of protein" : "Contains protein",
          score: proteinValue > 5 ? "good" : "medium",
          icon: "fish",
        })
      }

      // Simple overall score calculation
      const negativeCount = negatives.length
      const positiveCount = positives.length

      overallScore = 50 + positiveCount * 10 - negativeCount * 10
      overallScore = Math.max(0, Math.min(100, overallScore))

      console.log(overallScore);

      // Determine Score Category
      if (overallScore >= 90) scoreCategory = "Excellent"
      else if (overallScore >= 70) scoreCategory = "Good"
      else if (overallScore >= 50) scoreCategory = "Moderate"
      else if (overallScore >= 30) scoreCategory = "Poor"
      else scoreCategory = "Very Poor"
    }

    // Set the nutrition scores state
    setNutritionScores({
      negatives,
      positives,
      overallScore,
      nutritionScore,
      additivePenalty,
      scoreCategory,
      detectedAdditives,
    })
  }

  const getNutrientValueByName = (data: FoodData, name: string): number => {
    const nutrient = data.foodNutrients.find(
      n => n.nutrient && n.nutrient.name.toLowerCase().includes(name.toLowerCase())
    );
    
    return nutrient ? nutrient.amount : 0;
  };

   const extractProductImage = (product: OpenFoodFactsProduct): string | null => {
    // Try to get image from selected_images
    if (product.selected_images?.front?.display) {
      // Try to get English image first, then any available language
      const displayImages = product.selected_images.front.display;
      if (displayImages.en) return displayImages.en;
      
      // Get the first available image
      const firstLanguage = Object.keys(displayImages)[0];
      if (firstLanguage) return displayImages[firstLanguage];
    }
    
    // Fallback to direct image URLs
    if (product.image_front_url) return product.image_front_url;
    if (product.image_url) return product.image_url;
    
    // If no image found, return null
    return null;
  };

  // Fetch product name from OpenFoodFacts API
  const fetchProductFromUPC = async (upcCode: string): Promise<OpenFoodFactsProduct | null> => {
    try {
      console.log(`Fetching product info from OpenFoodFacts for UPC: ${upcCode}`);
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${upcCode}.json`);
      const data: OpenFoodFactsResponse = await response.json();

      if (data.status === 1 && data.product && data.product.product_name) {
       console.log(`Found product: ${JSON.stringify(data.product)}`);

       const imageUrl = extractProductImage(data.product);
        if (imageUrl) {
          console.log(`Found product image: ${imageUrl}`);
          setProductImage(imageUrl);
        }
        
        setProductName(data.product.product_name || null)
        setOffProduct(data.product)
        return data.product
      } else {
        console.log("Product not found in OpenFoodFacts");
        return null;
      }
    } catch (error) {
      console.error("Error fetching product data from OpenFoodFacts:", error);
      return null;
    }
  };

  // Fetch FDC ID from USDA API using product name
  const fetchFDCID = async (productName: string): Promise<number | null> => {
    try {
      console.log(`Searching for FDC ID with product name: ${productName}`);
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(productName)}&api_key=${API_KEY}`,
        {
          headers: {
            'accept': 'application/json',
          },
        }
      );
      
      const data: FoodApiResponse = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        const foundId = data.foods[0].fdcId;
        console.log(`Found FDC ID: ${foundId}`);
        return foundId;
      } else {
        console.log("No matching FDC ID found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching FDC ID:", error);
      return null;
    }
  };

  // Fetch detailed food data using FDC ID
  const fetchFoodDataByFdcId = async (fdcId: number): Promise<FoodData | null> => {
    try {
      console.log(`Fetching detailed data for FDC ID: ${fdcId}`);
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${API_KEY}`,
        {
          headers: {
            'accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const detailedData: FoodData = await response.json();
      console.log('Detailed food data retrieved successfully');
      
      // Ensure foodNutrients is defined
      if (!detailedData.foodNutrients) {
        detailedData.foodNutrients = [];
      }
      
      console.log('Label nutrients:', detailedData);
      
      // Add data source information
      detailedData.dataSource = 'USDA';
      
      return detailedData;
    } catch (err) {
      console.error('Error fetching detailed food data:', err);
      return null;
    }
  };

  // Fetch food data directly from USDA API using UPC
  const fetchFoodDataByUPC = async (upcCode: string): Promise<FoodData | null> => {
    try {
      console.log(`Searching USDA directly with UPC: ${upcCode}`);
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${upcCode}&api_key=${API_KEY}`,
        {
          headers: {
            'accept': 'application/json',
          },
        }
      );
      
      const data: FoodApiResponse = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        console.log(`Found food directly with UPC: ${data.foods[0].description}`);
        const foundId = data.foods[0].fdcId;
        setFdcId(foundId);
        
        // Get detailed data to ensure we have label nutrients
        const detailedData = await fetchFoodDataByFdcId(foundId);
        return detailedData;
      } else {
        console.log("No direct match with UPC in USDA database");
        return null;
      }
    } catch (err) {
      console.error('Error searching USDA with UPC:', err);
      return null;
    }
  };

  // Main function to handle UPC scanning and data fetching
  const handleUPCScan = async (upcCode: string): Promise<void> => {
    setIsLoading(true);
    setError('');
    setFoodData(null);
    setProductName(null);
    setFdcId(null);
    
    try {
      // Step 1: Try direct USDA search with UPC
      const offProductData = await fetchProductFromUPC(upcCode)

      const usdaData = await fetchFoodDataByUPC(upcCode);
      
      // If we found data directly from USDA, use it and we're done
      if (usdaData) {
        setFoodData(usdaData);
       if (offProductData) {
          processNutritionData(offProductData, usdaData)
        } else {
          // Create a minimal OpenFoodFacts product object for processing
          const minimalProduct: OpenFoodFactsProduct = {
            product_name: usdaData.description,
            ingredients_text: usdaData.ingredients,
          }
          processNutritionData(minimalProduct, usdaData)
        }
        setIsLoading(false);
        return;
      }
      
      // If no USDA data found, try OpenFoodFacts
      console.log("No USDA data found, trying OpenFoodFacts instead");
      
      // Step 2: Try OpenFoodFacts to get product name
      // If no USDA data found but we have OpenFoodFacts data
      if (offProductData && offProductData.product_name) {
        // Step 3: Use product name to find FDC ID
        const id = await fetchFDCID(offProductData.product_name)

        if (id) {
          setFdcId(id)
          // Step 4: Get detailed food data with FDC ID
          const detailedData = await fetchFoodDataByFdcId(id)
          if (detailedData) {
            setFoodData(detailedData)
            processNutritionData(offProductData, detailedData)
          } else {
            setError("Failed to fetch detailed food information")
          }
        } else {
          // Try a generic search with first 8 digits of UPC as fallback
          const genericSearch = upcCode.substring(0, 8)
          console.log(`Trying generic search with: ${genericSearch}`)

          const response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${genericSearch}&api_key=${API_KEY}`,
            {
              headers: {
                accept: "application/json",
              },
            },
          )

          const fallbackData: FoodApiResponse = await response.json()

          if (fallbackData.foods && fallbackData.foods.length > 0) {
            console.log(`Found fallback food: ${fallbackData.foods[0].description}`)
            const fallbackId = fallbackData.foods[0].fdcId
            setFdcId(fallbackId)
            const detailedFallbackData = await fetchFoodDataByFdcId(fallbackId)
            if (detailedFallbackData) {
              setFoodData(detailedFallbackData)
              processNutritionData(offProductData, detailedFallbackData)
            } else {
              setError("Failed to fetch detailed food information")
            }
          } else {
            setError("No food information found for this product")
          }
        }
      } else {
        // If no product name found, try generic search with UPC prefix
        const genericSearch = upcCode.substring(0, 8)
        console.log(`No product name found, trying generic search with: ${genericSearch}`)

        const response = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${genericSearch}&api_key=${API_KEY}`,
          {
            headers: {
              accept: "application/json",
            },
          },
        )

        const fallbackData: FoodApiResponse = await response.json()

        if (fallbackData.foods && fallbackData.foods.length > 0) {
          console.log(`Found fallback food: ${fallbackData.foods[0].description}`)
          const fallbackId = fallbackData.foods[0].fdcId
          setFdcId(fallbackId)
          const detailedFallbackData = await fetchFoodDataByFdcId(fallbackId)
          if (detailedFallbackData) {
            setFoodData(detailedFallbackData)
            // Create a minimal OpenFoodFacts product object for processing
            const minimalProduct: OpenFoodFactsProduct = {
              product_name: detailedFallbackData.description,
              ingredients_text: detailedFallbackData.ingredients,
            }
            processNutritionData(minimalProduct, detailedFallbackData)
          } else {
            setError("Failed to fetch detailed food information")
          }
        } else {
          setError("No food information found for this product")
        }
      }
    } catch (err) {
      console.error('Error in UPC scan process:', err);
      setError('Failed to fetch food information');
    } finally {
      setIsLoading(false);
    }
  };

  // What happens when we scan the bar code
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setScannedCode(data);
    console.log(`Type: ${type} \nData: ${data}`);
    
    // Process the scanned UPC
    handleUPCScan(data);
  };

  // Get calories from label nutrients or food nutrients
  const getCalories = (): string => {
    if (!foodData) return 'N/A';
    
    // First try to get calories from labelNutrients
    if (foodData.labelNutrients && foodData.labelNutrients.calories) {
      return `${foodData.labelNutrients.calories.value} kcal`;
    }
    
    // If not available, try to get from foodNutrients
    if (foodData.foodNutrients) {
      const energyNutrient = foodData.foodNutrients.find(
        n => n.nutrient && 
        (n.nutrient.name.toLowerCase().includes('energy') || 
         n.nutrient.name.toLowerCase().includes('calorie'))
      );
      
      if (energyNutrient) {
        return `${energyNutrient.amount} ${energyNutrient.nutrient.unitName}`;
      }
    }
    
    return 'N/A';
  };
  
  // Get nutrient value from label nutrients or food nutrients
  const getNutrientValue = (nutrientName: string): string => {
    if (!foodData) return 'N/A';
    
    // First try to get from labelNutrients
    if (foodData.labelNutrients) {
      const labelMap: { [key: string]: keyof LabelNutrients } = {
        'fat': 'fat',
        'saturated': 'saturatedFat',
        'trans': 'transFat',
        'cholesterol': 'cholesterol',
        'sodium': 'sodium',
        'carbohydrate': 'carbohydrates',
        'fiber': 'fiber',
        'sugar': 'sugars',
        'protein': 'protein',
        'calcium': 'calcium',
        'iron': 'iron'
      };
      
      for (const [key, prop] of Object.entries(labelMap)) {
        if (nutrientName.toLowerCase().includes(key) && 
            foodData.labelNutrients[prop]) {
          return `${foodData.labelNutrients[prop]?.value} g`;
        }
      }
    }
    
    // If not available, try to get from foodNutrients
    if (foodData.foodNutrients) {
      const nutrient = foodData.foodNutrients.find(
        n => n.nutrient && n.nutrient.name.toLowerCase().includes(nutrientName.toLowerCase())
      );
      
      if (nutrient) {
        return `${nutrient.amount} ${nutrient.nutrient.unitName}`;
      }
    }
    
    return 'N/A';
  };

   const getIconComponent = (iconName: string, size = 24, color = '#666') => {
    switch (iconName) {
      case 'flask-outline':
        return <MaterialCommunityIcons name="flask-outline" size={size} color={color} />;
      case 'droplet':
        return <Feather name="droplet" size={size} color={color} />;
      case 'flame-outline':
        return <Ionicons name="flame-outline" size={size} color={color} />;
      case 'fish':
        return <FontAwesome5 name="fish" size={size} color={color} />;
      case 'leaf':
        return <Feather name="coffee" size={size} color={color} />;
      case 'coffee':
        return <Feather name="coffee" size={size} color={color} />;
      default:
        return <Ionicons name="information-circle-outline" size={size} color={color} />;
    }
  };

  // Get indicator color based on score
  const getIndicatorColor = (score: 'good' | 'medium' | 'bad') => {
    switch (score) {
      case 'good':
        return '#4caf50'; // Green
      case 'medium':
        return '#ff9800'; // Orange
      case 'bad':
        return '#e53935'; // Red
      default:
        return '#e53935';
    }
  };


  // Check permissions and return the screens
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting for camera permission</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ margin: 10 }}>No access to camera</Text>
        <Button title={'Allow Camera'} onPress={() => askForCameraPermission()} />
      </View>
    );
  }

  // Return the View
  return (
    <SafeAreaView style={styles.container}>
      {!scanned ? (
        <View style={styles.scannerContainer}>
          <View style={styles.barcodebox}>
            <CameraView
              style={{ height: 400, width: 400 }}
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a"],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
          </View>
          <Text style={styles.instructionText}>Scan a food product barcode</Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
          <Text style={styles.scannedCodeText}>UPC: {scannedCode}</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text>Fetching nutritional information...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : foodData ? (
            <View style={styles.foodDataContainer}>
             <View style={styles.productHeader}>
                {productImage ? (
                  <Image source={{ uri: productImage }} style={styles.productImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="image-outline" size={40} color="#ccc" />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>
                    {offProduct?.product_name || productName || foodData.description}
                  </Text>
                  <Text style={styles.brandName}>{offProduct?.brands || foodData.brandName || "Generic"}</Text>
                  <View style={styles.scoreContainer}>
                    <View style={[styles.scoreCircle, { 
                      borderColor: nutritionScores.overallScore >= 70 ? '#4caf50' : 
                                  nutritionScores.overallScore >= 50 ? '#ff9800' : '#e53935' 
                    }]}>
                      <Text style={styles.scoreText}>{Math.round(nutritionScores.overallScore)}/100  </Text>
                    </View>
                    <Text style={[styles.scoreLabel, { 
                      color: nutritionScores.overallScore >= 70 ? '#4caf50' : 
                             nutritionScores.overallScore >= 50 ? '#ff9800' : '#e53935' 
                    }]}>
                      {nutritionScores.scoreCategory}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Display ingredients if available */}
              {nutritionScores.negatives.length > 0 && (
                <View style={styles.nutritionSection}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems:'center',
                    marginTop:5
                  }}>

                  <Text style={styles.sectionTitle}>Negatives</Text>
                  <Text style={styles.servingText}>
                    per serving ({offProduct?.product_quantity || foodData.servingSize}
                      {offProduct?.product_quantity_unit || foodData.servingSizeUnit || "g"})
                  </Text>
                  </View>
                  
                  {nutritionScores.negatives.map((item, index) => (
                    <View key={`negative-${index}`} style={styles.nutritionItem}>
                      <View style={styles.nutritionItemLeft}>
                        {getIconComponent(item.icon)}
                        <View style={styles.nutritionItemTextContainer}>
                          <Text style={styles.nutritionItemTitle}>{item.name}</Text>
                          <Text style={styles.nutritionItemSubtitle}>{item.description}</Text>
                        </View>
                      </View>
                      <View style={styles.nutritionItemRight}>
                        <Text style={styles.nutritionItemValue}>{item.value}</Text>
                        <View style={[styles.indicatorDot, { backgroundColor: getIndicatorColor(item.score) }]}></View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {nutritionScores.positives.length > 0 && (
                <View style={styles.nutritionSection}>
                  <Text style={styles.sectionTitle1}>Positives</Text>
                  
                  {nutritionScores.positives.map((item, index) => (
                    <View key={`positive-${index}`} style={styles.nutritionItem}>
                      <View style={styles.nutritionItemLeft}>
                        {getIconComponent(item.icon)}
                        <View style={styles.nutritionItemTextContainer}>
                          <Text style={styles.nutritionItemTitle}>{item.name}</Text>
                          <Text style={styles.nutritionItemSubtitle}>{item.description}</Text>
                        </View>
                      </View>
                      <View style={styles.nutritionItemRight}>
                        <Text style={styles.nutritionItemValue}>{item.value}</Text>
                        <View style={[styles.indicatorDot, { backgroundColor: getIndicatorColor(item.score) }]}></View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Score Breakdown Section */}
              <View style={styles.nutritionSection}>
                <Text style={styles.sectionTitle1}>Score Breakdown</Text>
                
                <View style={styles.scoreBreakdownItem}>
                  <Text style={styles.scoreBreakdownLabel}>Nutrition Score:</Text>
                  <Text style={styles.scoreBreakdownValue}>
                    {nutritionScores.nutritionScore || nutritionScores.overallScore } points
                  </Text>
                </View>
                
                {nutritionScores.detectedAdditives.length > 0 && (
                  <View style={styles.scoreBreakdownItem}>
                    <Text style={styles.scoreBreakdownLabel}>Additive Penalty:</Text>
                    <Text style={styles.scoreBreakdownValue}>
                      -{nutritionScores.additivePenalty} points
                    </Text>
                  </View>
                )}
                
                <View style={styles.scoreBreakdownItem}>
                  <Text style={styles.scoreBreakdownLabel}>Final Score:</Text>
                  <Text style={[styles.scoreBreakdownValue, { 
                    color: nutritionScores.overallScore >= 70 ? '#4caf50' : 
                           nutritionScores.overallScore >= 50 ? '#ff9800' : '#e53935',
                    fontFamily:'DMSans500',
                  }]}>
                    {Math.round(nutritionScores.overallScore)}/100 ({nutritionScores.scoreCategory})
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
          
          <Button 
            title="Scan Another Product" 
            onPress={() => {
              setScanned(false);
              setFoodData(null);
              setProductName(null);
              setFdcId(null);
              setError('');
              setNutritionScores({
                    negatives: [],
                    positives: [],
                    overallScore: 0,
                    nutritionScore: 0,
                    additivePenalty: 0,
                    scoreCategory: '',
                    detectedAdditives: []
                  });
            }} 
            color="#2196F3"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodebox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: '#000',
  },
  instructionText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsContent: {
    paddingBottom: 30,
  },
  scannedCodeText: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily:'DMSans500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  foodDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  foodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  brandText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lookupInfoContainer: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  lookupInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  ingredientsContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  ingredientsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  nutrientContainer: {
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#333',
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  newFoodDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom:10,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  scoreBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    // borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scoreBreakdownLabel: {
    fontSize: 14,
    fontFamily:'DMSans500',
    color: '#333',
  },
  scoreBreakdownValue: {
    fontSize: 14,
    fontFamily:'DMSans500',
    color: '#333',
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nutritionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily:'DMSans500',
    color: '#333',
  },
  sectionTitle1: {
    fontSize: 16,
    marginTop:10,
    fontFamily:'DMSans500',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#e53935',
    fontFamily:'DMSans500',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius:10,
    resizeMode: 'cover',
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 18,
    fontFamily:'DMSans600',
    color: '#333',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
    color: '#666',
    fontFamily:'DMSans500',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
   scoreCircle: {
    // width: 40,
    // height: 40,
    // borderRadius: 20,
    // backgroundColor: '#fff',
    // borderWidth: 2,
    // borderColor: '#e53935',
    // justifyContent: 'center',
    // alignItems: 'center',
    // marginRight: 8,
  },
  scoreText: {
    fontSize: 14,
     fontFamily:'DMSans500',
    color: '#333',
  },
  nutritionItemTextContainer: {
    marginLeft: 12,
  },
  nutritionItemTitle: {
    fontSize: 16,
    fontFamily:'DMSans500',
    color: '#333',
  },
  nutritionItemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily:'DMSans400',
  },
  nutritionItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionItemValue: {
    fontSize: 14,
    fontFamily:'DMSans500',
    color: '#333',
    marginRight: 10,
  },
  indicatorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e53935',
  },
  servingText: {
    fontSize: 14,
     fontFamily:'DMSans500',
    fontStyle: 'italic',
    color: '#666',
  },
  servingText1: {
    fontSize: 14,
    marginTop:5,
     fontFamily:'DMSans500',
    fontStyle: 'italic',
    color: '#666',
  },
});