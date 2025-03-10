import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator, ScrollView } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { SafeAreaView } from 'react-native-safe-area-context';

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

interface OpenFoodFactsProduct {
  product_name: string;
  brands?: string;
  ingredients_text?: string;
  nutriments?: {
    energy?: number;
    proteins?: number;
    fat?: number;
    carbohydrates?: number;
    fiber?: number;
    sugars?: number;
    sodium?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface OpenFoodFactsResponse {
  status: number;
  product: OpenFoodFactsProduct;
}

export default function upccode() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foodData, setFoodData] = useState<FoodData | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [fdcId, setFdcId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const askForCameraPermission = useCallback(async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  }, []);

  // Request Camera Permission
  useEffect(() => {
    askForCameraPermission();
  }, [askForCameraPermission]);

  // Fetch product name from OpenFoodFacts API
  const fetchProductFromUPC = async (upcCode: string): Promise<string | null> => {
    try {
      console.log(`Fetching product info from OpenFoodFacts for UPC: ${upcCode}`);
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${upcCode}.json`);
      const data: OpenFoodFactsResponse = await response.json();

      if (data.status === 1 && data.product && data.product.product_name) {
        console.log(`Found product: ${data.product.product_name}`);
        return data.product.product_name;
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
      
      console.log('Label nutrients:', detailedData.labelNutrients);
      
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
      const usdaData = await fetchFoodDataByUPC(upcCode);
      
      // If we found data directly from USDA, use it and we're done
      if (usdaData) {
        setFoodData(usdaData);
        setIsLoading(false);
        return;
      }
      
      // If no USDA data found, try OpenFoodFacts
      console.log("No USDA data found, trying OpenFoodFacts instead");
      
      // Step 2: Try OpenFoodFacts to get product name
      const name = await fetchProductFromUPC(upcCode);
      setProductName(name);
      
      if (name) {
        // Step 3: Use product name to find FDC ID
        const id = await fetchFDCID(name);
        
        if (id) {
          setFdcId(id);
          // Step 4: Get detailed food data with FDC ID
          const detailedData = await fetchFoodDataByFdcId(id);
          if (detailedData) {
            setFoodData(detailedData);
          } else {
            setError('Failed to fetch detailed food information');
          }
        } else {
          // Try a generic search with first 8 digits of UPC as fallback
          const genericSearch = upcCode.substring(0, 8);
          console.log(`Trying generic search with: ${genericSearch}`);
          
          const response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${genericSearch}&api_key=${API_KEY}`,
            {
              headers: {
                'accept': 'application/json',
              },
            }
          );
          
          const fallbackData: FoodApiResponse = await response.json();
          
          if (fallbackData.foods && fallbackData.foods.length > 0) {
            console.log(`Found fallback food: ${fallbackData.foods[0].description}`);
            const fallbackId = fallbackData.foods[0].fdcId;
            setFdcId(fallbackId);
            const detailedFallbackData = await fetchFoodDataByFdcId(fallbackId);
            if (detailedFallbackData) {
              setFoodData(detailedFallbackData);
            } else {
              setError('Failed to fetch detailed food information');
            }
          } else {
            setError('No food information found for this product');
          }
        }
      } else {
        // If no product name found, try generic search with UPC prefix
        const genericSearch = upcCode.substring(0, 8);
        console.log(`No product name found, trying generic search with: ${genericSearch}`);
        
        const response = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${genericSearch}&api_key=${API_KEY}`,
          {
            headers: {
              'accept': 'application/json',
            },
          }
        );
        
        const fallbackData: FoodApiResponse = await response.json();
        
        if (fallbackData.foods && fallbackData.foods.length > 0) {
          console.log(`Found fallback food: ${fallbackData.foods[0].description}`);
          const fallbackId = fallbackData.foods[0].fdcId;
          setFdcId(fallbackId);
          const detailedFallbackData = await fetchFoodDataByFdcId(fallbackId);
          if (detailedFallbackData) {
            setFoodData(detailedFallbackData);
          } else {
            setError('Failed to fetch detailed food information');
          }
        } else {
          setError('No food information found for this product');
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
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={{ height: 400, width: 400 }}
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
              <Text style={styles.foodTitle}>{foodData.description}</Text>
              <Text style={styles.brandText}>
                {foodData.brandName || foodData.brandOwner || 'Generic'}
              </Text>
              
              {/* Display lookup process information */}
              <View style={styles.lookupInfoContainer}>
                {foodData.dataSource && (
                  <Text style={styles.lookupInfoText}>Data Source: {foodData.dataSource}</Text>
                )}
                {productName && (
                  <Text style={styles.lookupInfoText}>Product Name: {productName}</Text>
                )}
                {fdcId && (
                  <Text style={styles.lookupInfoText}>FDC ID: {fdcId}</Text>
                )}
                {foodData.gtinUpc && (
                  <Text style={styles.lookupInfoText}>UPC: {foodData.gtinUpc}</Text>
                )}
              </View>
              
              {/* Display ingredients if available */}
              {foodData.ingredients && (
                <View style={styles.ingredientsContainer}>
                  <Text style={styles.sectionHeader}>Ingredients:</Text>
                  <Text style={styles.ingredientsText}>{foodData.ingredients}</Text>
                </View>
              )}
              
              <View style={styles.nutrientContainer}>
                <Text style={styles.sectionHeader}>Nutritional Information:</Text>
                
                {/* Highlight calories */}
                <View style={styles.calorieRow}>
                  <Text style={styles.calorieLabel}>Calories:</Text>
                  <Text style={styles.calorieValue}>{getCalories()}</Text>
                </View>
                
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Total Fat:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('fat')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Saturated Fat:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('saturated')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Trans Fat:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('trans')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Cholesterol:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('cholesterol')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Sodium:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('sodium')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Total Carbohydrates:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('carbohydrate')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Dietary Fiber:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('fiber')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Sugars:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('sugar')}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Protein:</Text>
                  <Text style={styles.nutrientValue}>
                    {getNutrientValue('protein')}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.servingText}>
                Serving size: {foodData.servingSize || 'Not specified'} 
                {foodData.servingSizeUnit ? ` ${foodData.servingSizeUnit}` : ''}
              </Text>
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
    backgroundColor: '#f5f5f5',
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
    marginBottom: 15,
    fontWeight: 'bold',
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
  servingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 15,
  },
});