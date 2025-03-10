import { Alert, Button, StatusBar, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useDispatch, useSelector } from 'react-redux';
import { removeToken } from '@/store/userSlice';
import { useRouter } from 'expo-router';

// GoogleSignin.configure({
//   webClientId:
//     "457085426884-5aboj03hndd1l6teed5hl85vq2ba9t1b.apps.googleusercontent.com",
// });

const Home = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const token = useSelector((state: any) => state.user.token);
  const user = useSelector((state: any) => state.user);
  console.log("token", token);
  console.log("userData", user);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const parsedUserData = JSON.parse(userDataString);
          setUserData(parsedUserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    getUserData();
  }, [token]);

  console.log("Auth providers:", user);

  const onLogout = async () => {
    try {
      // Sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw new Error("Error signing out from Supabase");
      }

      // Check if user signed in with Google
      // const providers = userData?.app_metadata?.providers;
      console.log("Auth providers:", user?.provider);
      if (user?.provider?.[0] === 'google') {
        try {
          console.log("Signing out from Google...");
          // Remove Google sign out since it requires being signed in
          // await GoogleSignin.revokeAccess();
          // await GoogleSignin.signOut();
          // console.log("Skipping Google sign out as it requires being signed in");
        } catch (googleError) {
          console.error("Google Sign-Out error:", googleError);
          console.warn("Failed to log out from Google, continuing with app logout");
        }
      }

      // Dispatch logout action
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('role');
      await AsyncStorage.removeItem("hasOnboarded");
      dispatch(removeToken());
      // console.log("user", user);
      const token = await AsyncStorage.getItem('token');
      console.log("Token after removal:", token); // Should show null
      
      // Navigate to login screen
      router.replace('/login');

    } catch (err: any) {
      console.error("Logout error:", err);
      Alert.alert("Error", err.message || "An error occurred during logout.");
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <StatusBar barStyle={'dark-content'} />
      <Text
        style={{
          color: "black",
        }}
      >
        {userData?.email || "No email available"}
      </Text>
      <Text style={{ color: "black", marginVertical: 10 }}>
        Name: {userData?.name || "Not available"}
      </Text>
      <Text style={{ color: "black", marginVertical: 10 }}>
        Role: {userData?.role || "Not available"}
      </Text>

      <Button title="Logout" onPress={onLogout} />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({});
