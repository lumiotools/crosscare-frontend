import {
  Alert,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useDispatch, useSelector } from "react-redux";
import { removeToken } from "@/store/userSlice";
import { useRouter } from "expo-router";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { height, width } from "@/constants/helper";
import { StatusBar, Platform } from "react-native";
import Card from "@/components/Card";
import { cardData as originalCardData } from "@/constants/constant";

// Ensure all items have a valid onPress function
const cardData = originalCardData.map(item => ({
  ...item,
  onPress: item.onPress || (() => {}),
}));

import ProgressCircle from "@/components/ProgressCircle";

interface Progress {
  progressPercentage: number;
  remainingDays: number;
}

const calculateProgress = (weeksComplete: number): Progress => {
  const totalWeeks = 40; // 9 months pregnancy (40 weeks)
  const progressPercentage = (weeksComplete / totalWeeks) * 100;
  const remainingWeeks = totalWeeks - weeksComplete;
  const remainingDays = remainingWeeks * 7;

  return { progressPercentage, remainingDays };
};

// GoogleSignin.configure({
//   webClientId:
//     "457085426884-5aboj03hndd1l6teed5hl85vq2ba9t1b.apps.googleusercontent.com",
// });

// Define prop types for the components
interface UserProfile {
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
  console.log("token", token);
  console.log("userData1", user);

  const [weeksComplete, setWeeksComplete] = useState(29);
  const { progressPercentage, remainingDays } = calculateProgress(weeksComplete);

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
    const response = await fetch(`https://crosscare-backends.onrender.com/api/user/${user?.user_id}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  
    const data = await response.json();
    // console.log("Profile data:", data);
    
    // Extract and log question responses
    const questionResponses = data?.user?.questionResponses || data?.questionResponses;
    console.log("Question responses:", questionResponses);
    
    setProfile(data);
  };
  
  useEffect(() => {
    if (user?.user_id) {
      getProfile();
    }
  }, [user?.user_id]);
  
  // Updated useEffect to handle questionnaire navigation based on responses
  useEffect(() => {
    // Get questionResponses from either profile.user.questionResponses or profile.questionResponses
    const questionResponses = profile?.questionResponses;
    
    // Check if profile is loaded
    if (profile) {
      // Check if there are any question responses
      if (!questionResponses || questionResponses.length === 0) {
        // No responses yet, navigate to AskDoula
        console.log("No question responses found, redirecting to AskDoula");
        router.push("/patient/askdoula");
      } else {
        console.log("Found question responses:", questionResponses.length);
        // You can add additional logic here if needed
      }
    }
  }, [profile, router]);

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
          paddingVertical: 12,
        }}
      >
        <Feather name="search" size={24} color="white" />
        <View
          style={{
            paddingHorizontal: 25,
            paddingVertical: 5,
            borderWidth: 2,
            backgroundColor: "#F76ccF",
            borderColor: "#E162BC",
            borderRadius: 50,
            shadowColor: "rgba(0, 0, 0, 0.25)",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 4.65,
          }}
        >
          <Text
            style={{
              color: "white",
              fontFamily: "DMSans600",
              fontSize: width * 16,
            }}
          >
            SOS
          </Text>
        </View>
        <Ionicons name="notifications" size={24} color="white" />
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
      bg1={item.bg1}  // Ensure bg1 is a valid color string
      bg2={item.bg2}  // Ensure bg2 is a valid color string
      image1={item.image1}
      onPress={item.onPress}
    />
  );
  

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <LinearGradient
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
      </LinearGradient>

      <FlatList
        data={cardData}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.cardContainer}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: Platform.OS === 'android' ? 10 : 40,
  },
});
