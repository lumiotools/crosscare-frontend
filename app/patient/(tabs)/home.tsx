import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useDispatch, useSelector } from "react-redux";
import { removeToken, setUser } from "@/store/userSlice";
import { useFocusEffect, useRouter } from "expo-router";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { height, width } from "@/constants/helper";
import { StatusBar, Platform } from "react-native";
import Card from "@/components/Card";
import { cardData as originalCardData } from "@/constants/constant";

// Ensure all items have a valid onPress function
const cardData = originalCardData.map((item) => ({
  ...item,
  id: String(item.id), // Ensure id is a number
  onPress: item.onPress || (() => {}),
}));

import ProgressCircle from "@/components/ProgressCircle";
import { Image } from "react-native";
import FoodIcon from "@/assets/images/Svg/FoodIcon";
import WaterIcon from "@/assets/images/Svg/WaterIcon";
import StepsIcon from "@/assets/images/Svg/StepsIcon";
import Calendar from "@/assets/images/Svg/Calendar";
import { useWaterStore } from "@/zustandStore/waterStore";
import {
  useStepsStore,
  useStepsWithAutoRefresh,
} from "@/zustandStore/useStepsStore";
import * as ImagePicker from "expo-image-picker";
import { useBadge } from "@/context/BadgeContext";
import User from "@/assets/images/Svg/User";

interface Progress {
  progressPercentage: number;
  remainingDays: number;
  dueDate: string;
}

const calculatePregnancyProgress = (weeksComplete: number): Progress => {
  const totalWeeks = 40; // Standard pregnancy duration (40 weeks)

  // Calculate progress percentage
  const progressPercentage = (weeksComplete / totalWeeks) * 100;

  // Calculate remaining weeks and days
  const remainingWeeks = totalWeeks - weeksComplete;
  const remainingDays = remainingWeeks * 7;

  // Calculate due date based on current date and remaining days
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + remainingDays);

  // Format due date as "Month DD, YYYY"
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDueDate = dueDate.toLocaleDateString("en-US", options);

  return {
    progressPercentage,
    remainingDays,
    dueDate: formattedDueDate,
  };
};

// GoogleSignin.configure({
//   webClientId:
//     "457085426884-5aboj03hndd1l6teed5hl85vq2ba9t1b.apps.googleusercontent.com",
// });

// Define prop types for the components
interface UserProfile {
  name?: string;
  email?: string;
  age?: number;
  week?: number;
  profileImage?: string;
  questionnaires?: { isCompleted: boolean }[];
  questionResponses?: { questionnaireId: string }[];
}

const Home = () => {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const token = useSelector((state: any) => state.user.token);
  const user = useSelector((state: any) => state.user);
  // console.log("token", token);
  // console.log("userData1", user);

  const [weeksComplete, setWeeksComplete] = useState(0);
  const { progressPercentage, remainingDays, dueDate } =
    calculatePregnancyProgress(weeksComplete);
  // const [name, setName] = useState<string>("");
  // const [age, setAge] = useState<number>(0);
  // const [email, setEmail] = useState<string>("");
  // const [pregnancyWeek, setPregnancyWeek] = useState<number>(0)

  const { maxGlasses, glassCount, setGlassCount } = useWaterStore();
  // const { stepsWalked, stepGoal, fetchStepData } = useStepsStore();
  const { stepsWalked, stepGoal } = useStepsWithAutoRefresh(user?.user_id);

  const [foodQualityScore, setFoodQualityScore] = useState(9);
  // const [steps, setSteps] = useState(null);

  const userId = user?.user_id;

  useEffect(() => {
      const setAllVisited = async () => {
        if (userId) {
          checkAndAwardExplorerBadge(userId);
        }
      };
      
      setAllVisited();
    }, [userId]);
  
    const checkAndAwardExplorerBadge = async (userId) => {
      try {
        // Get visited status for all areas
        const healthVisited = await AsyncStorage.getItem('health');
        const journalVisited = await AsyncStorage.getItem('journal');
        const selfCareVisited = await AsyncStorage.getItem('self-care');
        const heartVisited = await AsyncStorage.getItem('heart_2');
        const mealVisited = await AsyncStorage.getItem('meal_1');
        const medicationVisited = await AsyncStorage.getItem('medication_3');
        const weightVisited = await AsyncStorage.getItem('weight_4');
        const waterVisited = await AsyncStorage.getItem('water_5');
        const stepVisited = await AsyncStorage.getItem('step_6');
        const sleepVisited = await AsyncStorage.getItem('sleep_7');
        
        console.log('Visited areas:', {
          health: healthVisited,
          journal: journalVisited,
          selfCare: selfCareVisited,
          heart: heartVisited,
          meal: mealVisited,
          medication: medicationVisited,
          weight: weightVisited,
          water: waterVisited,
          step: stepVisited,
          sleep: sleepVisited
        });
        
        // Check if all required areas have been visited
        // Main sections: health tracking, journal, and self-care
        const mainSectionsVisited = healthVisited === 'true' && 
                                   journalVisited === 'true' && 
                                   selfCareVisited === 'true';
        
        // Optional: Check if at least one specific health tracker has been visited
        // You can adjust this requirement based on your needs
        const atLeastOneHealthTrackerVisited = 
          heartVisited === 'true' &&
          mealVisited === 'true' &&
          medicationVisited === 'true' && 
          weightVisited === 'true' && 
          waterVisited === 'true' && 
          stepVisited === 'true' && 
          sleepVisited === 'true';
        
        if (mainSectionsVisited && atLeastOneHealthTrackerVisited) {
          // Check if badge has already been awarded to prevent duplicate awards
          const badgeAwarded = await AsyncStorage.getItem('explorerBadgeAwarded');
          
          if (badgeAwarded !== 'true') {
            // Award the badge
            await awardExplorerBadge(userId);
            
            // Mark badge as awarded
            await AsyncStorage.setItem('explorerBadgeAwarded', 'true');
            console.log('Explorer badge awarded and marked as awarded in storage');
          } else {
            console.log('Explorer badge already awarded previously');
          }
        } else {
          console.log('Not all areas have been visited yet');
          if (!mainSectionsVisited) {
            console.log('Missing main sections');
          }
          if (!atLeastOneHealthTrackerVisited) {
            console.log('No health trackers visited');
          }
        }
      } catch (error) {
        console.error('Error checking and awarding Explorer badge:', error);
      }
    };
  
    // Function to make API call to award the Explorer badge
    const awardExplorerBadge = async (userId) => {
      try {
        const badgeType = "EXPLORER";
        
        // Prepare the data payload for the Explorer badge
        const payload = {
          badgeType: badgeType,
          title: "EXPLORER",
          description: "First time having explored all features of the app (should have navigated at least once to all habit trackers, self care, journal)"
        };
        
        console.log('Making API call to award Explorer badge to user:', userId);
        
        // Make API call using fetch with error handling
        const response = await fetch(
          `https://crosscare-backends.onrender.com/api/user/${userId}/badges/award`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Explorer badge awarded successfully!', data);
        } else {
          console.error('Failed to award Explorer badge:', data.message);
        }
        
        return data.success;
      } catch (error) {
        console.error('Error awarding Explorer badge:', error);
        return false;
      }
    };

  const fetchWaterData = useCallback(async () => {
    try {
      // Check if user ID is available before making the request
      if (!user?.user_id) {
        console.log("Cannot fetch water data: user ID is undefined");
        return;
      }

      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterstatus`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch water data");
      }

      const data = await response.json();
      // console.log("Refreshed water data:", data);

      // Process the water data array to get the latest entry
      if (data && data && Array.isArray(data)) {
        // Sort by date (newest first)
        const sortedData = [...data].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // Find the latest entry with a valid waterMl value
        const latestEntry = sortedData.find((entry) => entry.waterMl !== null);

        if (latestEntry) {
          // console.log("Latest water entry:", latestEntry);
          // Update the glass count with the latest waterMl value
          setGlassCount(latestEntry.waterMl);
        }
      }
    } catch (error) {
      console.error("Error fetching water data:", error);
    }
  }, [user?.user_id, setGlassCount]);

  // Add this useFocusEffect instead:
  useFocusEffect(
    useCallback(() => {
      // console.log("Home screen in focus, fetching water data...");

      // Fetch immediately when screen comes into focus
      fetchWaterData();

      // Set up polling interval
      const syncInterval = setInterval(() => {
        fetchWaterData();
      }, 5000); // Check every 10 seconds

      // Clean up interval when screen loses focus
      return () => {
        // console.log("Home screen lost focus, clearing water data interval");
        clearInterval(syncInterval);
      };
    }, [fetchWaterData])
  );

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("user");
        if (userDataString) {
          const parsedUserData = JSON.parse(userDataString);
          setUserData(parsedUserData);
          console.log("User data:", parsedUserData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    getUserData();
  }, [token]);

  const getProfile = async () => {

    // Then fetch fresh data from API
    const response = await fetch(
      `https://crosscare-backends.onrender.com/api/user/${user?.user_id}/profile`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();
    // console.log("Profile data:", data.week);

    // Save the fresh profile data to AsyncStorage

    // Extract and log question responses

    // setProfile(data);
    dispatch(
      setUser({
        ...user,
        user_name: data.name,
        user_email: data.email,
        avatar_url: data.avatarUrl,
      })
    );
    setWeeksComplete(data.week || 0);

    // If profile has an image and we don't have one loaded yet, use it
    if (data.profileImage && !image) {
      setImage(data.profileImage);

      // Save to AsyncStorage for persistence
      // await AsyncStorage.setItem("profileImage", data.profileImage);

      // Update Redux state
      dispatch(
        setUser({
          ...user,
          user_photo: data.profileImage,
        })
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      // console.log("Home screen in focus, fetching profile data...")
      if (user?.user_id) {
        getProfile()
      }

      return () => {
        // console.log("Home screen lost focus")
      }
    }, [user?.user_id, getProfile]),
  )

  // // Updated useEffect to handle questionnaire navigation based on responses
  // useEffect(() => {
  //   // Get questionResponses from either profile.user.questionResponses or profile.questionResponses
  //   const questionResponses = profile?.questionResponses;

  //   // Check if profile is loaded
  //   if (profile) {
  //     // Check if there are any question responses
  //     if (!questionResponses || questionResponses.length === 0) {
  //       // No responses yet, navigate to AskDoula
  //       console.log("No question responses found, redirecting to AskDoula");
  //       router.push("/patient/askdoula");
  //     } else {
  //       console.log("Found question responses:", questionResponses.length);
  //       // You can add additional logic here if needed
  //     }
  //   }
  // }, [profile, router]);

  // console.log("Auth providers:", user);

  // const onLogout = async () => {
  //   try {
  //     // Sign out from Supabase
  //     const { error: signOutError } = await supabase.auth.signOut();
  //     if (signOutError) {
  //       throw new Error("Error signing out from Supabase");
  //     }

  //     // Check if user signed in with Google
  //     // const providers = userData?.app_metadata?.providers;
  //     console.log("Auth providers:", user?.provider);
  //     if (user?.provider?.[0] === "google") {
  //       try {
  //         console.log("Signing out from Google...");
  //         // Remove Google sign out since it requires being signed in
  //         // await GoogleSignin.revokeAccess();
  //         // await GoogleSignin.signOut();
  //         // console.log("Skipping Google sign out as it requires being signed in");
  //       } catch (googleError) {
  //         console.error("Google Sign-Out error:", googleError);
  //         console.warn(
  //           "Failed to log out from Google, continuing with app logout"
  //         );
  //       }
  //     }

  //     // Dispatch logout action
  //     await AsyncStorage.removeItem("token");
  //     await AsyncStorage.removeItem("user");
  //     await AsyncStorage.removeItem("role");
  //     await AsyncStorage.removeItem("hasOnboarded");
  //     dispatch(removeToken());
  //     // console.log("user", user);
  //     const token = await AsyncStorage.getItem("token");
  //     console.log("Token after removal:", token); // Should show null

  //     // Navigate to login screen
  //     router.replace("/login");
  //   } catch (err: any) {
  //     console.error("Logout error:", err);
  //     Alert.alert("Error", err.message || "An error occurred during logout.");
  //   }
  // };

  const Header = () => {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "ios" ? 10 : 10,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "#F76CCF",
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 30,
            borderWidth: 2,
            borderColor: "#E162BC",
          }}
        >
          <Text
            style={{
              color: "white",
              fontFamily: "DMSans600",
              fontSize: 16,
            }}
          >
            SOS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 20,
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <Ionicons name="notifications-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderCard = ({
    item,
  }: {
    item: {
      title: string;
      description: string;
      bg1: string;
      bg2: string;
      image1: string;
      id: string;
      onPress: () => void;
    };
  }) => (
    <Card
      title={item.title}
      description={item.description}
      bg1={item.bg1} // Ensure bg1 is a valid color string
      bg2={item.bg2} // Ensure bg2 is a valid color string
      image1={item.image1}
      id={item.id}
      onPress={item.onPress}
    />
  );

  const [image, setImage] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // useEffect(() => {
  //   const loadSavedImage = async () => {
  //     try {
  //       const savedImage = await AsyncStorage.getItem('profileImage');
  //       if (savedImage) {
  //         setImage(savedImage);
  //       }
  //     } catch (error) {
  //       console.error("Error loading saved profile image:", error);
  //     }
  //   };

  //   loadSavedImage();
  // }, []);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to change your profile picture."
        );
        return;
      }

      setIsUploading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // Set the selected image locally
        setImage(selectedImage.uri);

        // Save to AsyncStorage for persistence between app sessions
        try {
          await AsyncStorage.setItem("profileImage", selectedImage.uri);
        } catch (error) {
          console.error("Error saving profile image to AsyncStorage:", error);
        }

        // Upload to server
        try {
          const formData = new FormData();
          formData.append("imageUrl", {
            uri: selectedImage.uri,
            type: "image/jpeg",
            name: "profile-image.jpg",
          });

          const response = await fetch(
            `https://crosscare-backends.onrender.com/api/user/${user?.user_id}/profile/image`,
            {
              method: "POST",
              body: formData,
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }

          // Update Redux state with the new image
          dispatch(
            setUser({
              ...user,
              user_photo: selectedImage.uri,
            })
          );

          const title = `Week ${weeksComplete} of Pregnancy`;

          // Add title to the FormData
          const formData1 = new FormData();
          formData1.append("title", title);

          // Add note if provided

          // Append the image to FormData
          formData1.append("imageUrl", {
            uri: selectedImage.uri,
            type: "image/jpeg",
            name: "upload.jpg",
          });

          const response1 = await fetch(
            `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/journal/upload`,
            {
              method: "POST",
              headers: {
                "Content-Type": "multipart/form-data", // Set correct content type for form data
              },
              body: formData1,
            }
          );

          if (!response1.ok) {
            throw new Error(`Failed to save note: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Note saved successfully:", data);

          // Optional: Get the response data if your API returns the updated image URL
          // const data = await response.json();
          // if (data && data.imageUrl) {
          //   const serverImageUrl = data.imageUrl;
          //   setImage(serverImageUrl);
          //   await AsyncStorage.setItem('profileImage', serverImageUrl);
          //   dispatch(setUser({...user, user_photo: serverImageUrl}));
          // }
        } catch (uploadError) {
          console.error("Error uploading image to server:", uploadError);
          // Don't show an alert here since the image is already saved locally
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      <StatusBar backgroundColor="#FAB5E8" barStyle="dark-content" />

      {/* <LinearGradient
        colors={["#FAB5E8", "#F76CCFFF"]}
        start={{ x: 0.027, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: Platform.OS === 'android' ? "43%" : '48%',
          borderBottomLeftRadius:30,
          borderBottomRightRadius:30,
        }}
      >
        {Header()}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <Text style={{ fontSize: 18, color: "white" }}>{`${progressPercentage.toFixed(1)}%`}</Text>
            <Text
              style={{
                fontSize: 8,
                color: "white",
                fontFamily: "Inter_18pt-Regular",
              }}
            >
              DONE
            </Text>
          </View>

          <ProgressCircle weeksComplete={weeksComplete} />

          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-end",
              gap: 2,
            }}
          >
            <Text style={{ fontSize: 18, color: "white" }}>{remainingDays}</Text>
            <Text
              style={{
                fontSize: 8,
                color: "white",
                fontFamily: "Inter_18pt-Regular",
              }}
            >
              DAYS TO GO
            </Text>
          </View>
        </View>

        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/patient/track")}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: Platform.OS === "ios" ? 10 : 30,
              paddingHorizontal: 8,
              paddingVertical: 6,
              gap: 6,
              borderRadius: 18,
              backgroundColor: "rgba(232, 222, 248, 0.22)",
              zIndex: 10, // Ensure it’s clickable
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter600",
                color: "#f8dede",
              }}
            >
              More
            </Text>
            <AntDesign name="arrowright" size={12} color="#F8DEDE" />
          </TouchableOpacity>
        </View>
      </LinearGradient> */}
      <ScrollView
        style={{
          flex: 1,
          // paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundCurve} />

        <Header />

        <View
          style={{
            alignItems: "center",
            marginTop: -35,
          }}
        >
          <TouchableOpacity activeOpacity={0.9} onPress={pickImage}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 4,
                borderColor: "white",
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                overflow: "hidden",
              }}
            >
              {image ? (
                <Image
                  source={{ uri: image }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 50,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <User width='100%' height='100%' color="#888" /> {/* Replace with your icon component */}
                </>
              )}
            </View>
            {isUploading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: 50,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#F76CCF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={{
            alignItems: "center",
            marginTop: 10,
            paddingBottom: 10,
          }}
        >
          <Text style={styles.userName}>{user.user_name}</Text>
          <Text style={styles.weekText}>Week {weeksComplete}</Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 15,
            justifyContent: "space-between",
            paddingHorizontal: 20,
          }}
        >
          {/* Water Intake Card */}
          <TouchableOpacity
            style={styles.statCard1}
            onPress={() => router.push("/patient/water")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#67B6FF3D",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <WaterIcon width={14} height={14} />
              </View>
              <Text style={styles.statTitle}>Water Intake</Text>
            </View>

            <View style={styles.waterProgressBar}>
                <View
                  style={[
                    styles.waterProgress,
                    {
                      width:
                        maxGlasses > 0
                          ? `${(glassCount / maxGlasses) * 100}%` // Only calculate width if maxGlasses > 0
                          : "0%", // Set width to 0% if maxGlasses is 0
                    },
                  ]}
              />
            </View>

            <View style={styles.statValueContainer}>
              <Text style={styles.statSuffix}>
                {" "}
                <Text style={styles.statValue}>{glassCount}</Text> /{" "}
                {maxGlasses} Glasses
              </Text>
            </View>
          </TouchableOpacity>

          {/* Food Card */}
          <TouchableOpacity
            style={styles.statCard2}
            onPress={() => router.push("/patient/meals")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#38C47229",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <FoodIcon width={14} height={14} />
              </View>
              <Text style={styles.statTitle}>Food</Text>
            </View>

            <View style={styles.foodQualityContainer}>
              <View
                style={[
                  styles.qualityIndicator,
                  {
                    backgroundColor: "#22C8009E",
                    flex: 0.6,
                    borderWidth: 0.5,
                    borderColor: "#22C8009E",
                  },
                ]}
              />
              <View
                style={[
                  styles.qualityIndicator,
                  {
                    backgroundColor: "#E79E00A6",
                    flex: 0.2,
                    borderWidth: 0.5,
                    borderColor: "#C68700CC",
                  },
                ]}
              />
              <View
                style={[
                  styles.qualityIndicator,
                  {
                    backgroundColor: "#FF000099",
                    flex: 0.2,
                    borderWidth: 0.5,
                    borderColor: "#FF0000CC",
                  },
                ]}
              />
            </View>

            <Text style={styles.qualityScoreLabel}>
              Quality Score:{" "}
              <Text style={styles.qualityScoreValue}>{foodQualityScore}</Text>{" "}
              /10
            </Text>
          </TouchableOpacity>

          {/* Steps Card */}
          <TouchableOpacity
            style={styles.statCard3}
            onPress={() => router.push("/patient/steps")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#5E4FA233",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <StepsIcon width={14} height={14} />
              </View>
              <Text style={styles.statTitle}>Steps</Text>
            </View>

            <Text style={styles.stepsValue}>{stepsWalked}</Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans400",
                marginTop: 5,
              }}
            >
              <Text style={styles.stepsGoal}>Goal:</Text> {stepGoal}
            </Text>
          </TouchableOpacity>

          {/* Due Date Card */}
          <TouchableOpacity
            style={styles.statCard4}
            onPress={() => router.push("/patient/track")}
          >
            <View style={styles.statHeader}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#A855F71A",
                  borderRadius: 12,
                  marginRight: 6,
                }}
              >
                <Calendar width={14} height={14} />
              </View>
              <Text style={styles.statTitle}>Due Date</Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "DMSans500",
                color: "#434343",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "DMSans600",
                  color: "#A855F7",
                }}
              >
                {remainingDays}
              </Text>{" "}
              days left
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "DMSans500",
                color: "#434343",
              }}
            >
              {dueDate}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={cardData}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.cardContainer}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  cardContainer: {
    // padding: 20,
    marginTop: 10,
    marginHorizontal: 20,
    marginVertical: Platform.OS === "ios" ? 10 : 0,
    paddingBottom: Platform.OS === "android" ? 10 : 40,
  },
  statCard1: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(35, 149, 255, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statCard2: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(21, 135, 68, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statCard3: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(168, 85, 247, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statCard4: {
    width: "48%",
    height: 103, // Fixed height for all cards
    backgroundColor: "rgba(168, 85, 247, 0.05)",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 20,
    fontFamily: "DMSans600",
    color: "#87247D",
  },
  weekText: {
    fontSize: 14,
    color: "#F76CCF",
    marginTop: 2,
    fontFamily: "DMSans600",
  },
  backgroundCurve: {
    backgroundColor: "#FAB5E8",
    height: 2000,
    position: "absolute",
    top: -1 * (2000 - 70),
    width: 2000,
    borderRadius: 2000,
    alignSelf: "center",
    zIndex: -1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    // marginTop: 5,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#2395FF",
  },
  statSuffix: {
    fontSize: 12,
    color: "#373737",
    fontFamily: "DMSans500",
  },
  waterProgressBar: {
    height: 8,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#E1EEFF",
    borderRadius: 4,
    marginVertical: 10,
  },
  waterProgress: {
    height: 8,
    backgroundColor: "#4A9CFF",
    borderRadius: 4,
  },
  foodQualityContainer: {
    flexDirection: "row",
    marginVertical: 8,
  },
  qualityIndicator: {
    height: 12,
    marginHorizontal: 1,
    borderRadius: 10,
  },
  qualityScoreLabel: {
    fontSize: 12,
    color: "#373737",
    fontFamily: "DMSans500",
  },
  qualityScoreValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22C800",
    // marginLeft: 5,
  },
  qualityScoreSuffix: {
    fontSize: 14,
    color: "#666",
    marginLeft: 2,
  },
  stepsValue: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#5E4FA2",
    marginTop: 5,
  },
  stepsGoal: {
    fontSize: 12,
    color: "#373737",
    fontFamily: "DMSans600",
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 10,
  },
  daysLeftValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#9966CC",
  },
  daysLeftLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  dueDateText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
});
