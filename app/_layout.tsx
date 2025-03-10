import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Slot, Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { Provider, useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColorScheme } from "@/hooks/useColorScheme";
import { supabase } from "@/supabase/supabase";
import { store } from "../store/store";
import { setToken, setUser } from "../store/userSlice";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayoutNav = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const token = useSelector((state: any) => state.user.token);
  console.log(token);
  const [loaded] = useFonts({
    DMSans300: require("../assets/fonts/DMSans-Light.ttf"),
    DMSans400: require("../assets/fonts/DMSans-Regular.ttf"),
    DMSans500: require("../assets/fonts/DMSans-Medium.ttf"),
    DMSans600: require("../assets/fonts/DMSans-SemiBold.ttf"),
    DMSans700: require("../assets/fonts/DMSans-Bold.ttf"),
    Inter300: require("../assets/fonts/Inter_18pt-Light.ttf"),
    Inter400: require("../assets/fonts/Inter_18pt-Regular.ttf"),
    Inter500: require("../assets/fonts/Inter_18pt-Medium.ttf"),
    Inter600: require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    Inter700: require("../assets/fonts/Inter_18pt-Bold.ttf"),
    Inter800: require("../assets/fonts/Inter_18pt-ExtraBold.ttf"),
    OpenSans300: require("../assets/fonts/OpenSans-Light.ttf"),
    OpenSans400: require("../assets/fonts/OpenSans-Regular.ttf"),
    OpenSans500: require("../assets/fonts/OpenSans-Medium.ttf"),
    OpenSans600: require("../assets/fonts/OpenSans-SemiBold.ttf"),
    OpenSans700: require("../assets/fonts/OpenSans-Bold.ttf"),
  });

  // Check for existing token on app load
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const storedUser = await AsyncStorage.getItem("user");
        if (token) {
          dispatch(setToken(token));
        }

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser) {
            dispatch(setUser(parsedUser));
          }
        }
      } catch (error) {
        console.error("Error checking token:", error);
      }
    };
    checkToken();
  }, [dispatch]);

  // Hide the splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Wait until fonts are loaded
  if (!loaded) {
    return null;
  }

  if (!user) return <Redirect href="/login" />;

  return (
    // <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
    <>
      <StatusBar style="dark" backgroundColor="white" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation:'ios_from_right'
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ title: "Onboarding" }} />
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
        <Stack.Screen
          name="forget-password"
          options={{ title: "Forgot Password" }}
        />
        <Stack.Screen name='avatar'/>
        <Stack.Screen name='/patient/(tabs)/home'/>
      </Stack>
    </>
    // </ThemeProvider>
  );
};

export default function RootLayout() {
  return (
    <Provider store={store}>
        <RootLayoutNav />
    </Provider>
  );
}
