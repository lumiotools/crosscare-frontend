import React, { FC, useLayoutEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as WebBrowser from "expo-web-browser";
// import * as AuthSession from "expo-auth-session";
// import {
//   GoogleSignin,
//   GoogleSigninButton,
//   statusCodes,
// } from "@react-native-google-signin/google-signin";
import { useDispatch } from "react-redux";
import { setToken, setUser } from "@/store/userSlice";
import LogoSvg from "@/assets/images/Svg/LogoSvg";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { width } from "@/constants/helper";
import { LinearGradient } from "expo-linear-gradient";

// WebBrowser.maybeCompleteAuthSession();
// GoogleSignin.configure({
//   webClientId:
//     "457085426884-5aboj03hndd1l6teed5hl85vq2ba9t1b.apps.googleusercontent.com",
// });
const height = Dimensions.get("window").height;

const Login: FC = () => {
  // console.log(Dimensions.get('window').width /430 * 12 , "font size")
  // console.log(Dimensions.get('window').height , "font size")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();
  const dispatch = useDispatch();
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleLogin = async () => {
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newError: any = {};

    if (!email) {
      newError.email = "Email is required.";
    }
    // else if (!emailRegex.test(email)) {
    //   newError.email = "Invalid email format.";
    // }

    if (!password) {
      newError.password = "Password is required.";
    }

    if (Object.keys(newError).length > 0) {
      setEmailError(newError.email || "");
      setPasswordError(newError.password || "");
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // console.log(`${process.env.DATABASE_URL}`);
      const response = await fetch(
        `http://10.0.2.2:8000/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email, password: password }),
        }
      );

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data) {
        console.log("Dispatching User Data to Redux:", data);
        dispatch(
          setUser({
            user_id: data.userId || data.patientId,  // ✅ Handle correct field name
            user_email: data.email,
            user_name: data.name,
            user_photo: data.profilePicture || "",  // ✅ Handle missing photo
            token: data.accessToken, // ✅ Store token inside setUser()
          })
        );
  
        dispatch(setToken(data.accessToken));
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            user_id: data.userId || data.patientId,
            user_email: data.email,
            user_name: data.name,
            user_photo: data.profilePicture || "",
            token: data.accessToken,
          })
        ); // ✅ Must be stringified

        await AsyncStorage.setItem("userToken", data.accessToken); // ✅ Save token persistently
  
        router.replace("/patient/(tabs)/home");
      }

      setLoading(false);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
      setEmailError("Invalid email or password");
      setPasswordError("Invalid email or password");
      setLoading(false);
    }
  };

  const handleChangeEmail = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError("");
    }
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError("");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={{
          justifyContent: "center",
          marginTop: 60,
        }}
      >
        <View
          style={{
            alignItems: "center",
          }}
        >
          <LogoSvg />
        </View>
        <Text style={styles.title}>Welcome, Get Started!</Text>
        <View
          style={{
            width: "100%",
            marginTop: width * 56,
            flexDirection: "column",
            gap: 20,
          }}
        >
          <CustomTextInput
            icon="user"
            type="email"
            value={email}
            onChangeText={handleChangeEmail}
            placeholder="Username"
            errorMessage={emailError}
          />
          <CustomTextInput
            icon="lock"
            type="password"
            value={password}
            onChangeText={handleChangePassword}
            placeholder="Password"
            secureTextEntry={true}
            errorMessage={passwordError}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={["#87247D", "#E05FA0"]} // Gradient colors
              start={{ x: 0, y: 0 }} // Start of the gradient (top-left)
              end={{ x: 1, y: 0 }} // End of the gradient (top-right)
              style={styles.gradient} // Apply gradient as background
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/forget-password")}>
          <Text
            style={{
              fontSize: width * 14,
              width: "100%",
              textAlign: "left",
              color: "#E05FA0",
              fontFamily: "DMSans400",
              marginTop: 17,
              textDecorationLine: "underline",
            }}
          >
            Forgot Password?
          </Text>
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "column",
            gap: 12,
            marginTop: 12,
          }}
        >
          <Text
            style={{
              fontSize: width * 14,
              color: "#1B2559",
              fontFamily: "DMSans400",
              marginTop: 0.017,
              textAlign: "center",
              // textDecorationLine: "underline",
            }}
          >
            -OR-
          </Text>
          <Text
            style={{
              fontSize: width * 14,
              color: "#545454",
              fontFamily: "Poppins400",

              textAlign: "center",
            }}
          >
            Login as{" "}
            <Text
              style={{
                fontFamily: "DMSans400",
                color: "#E05FA0",
                textDecorationLine: "underline",
              }}
              onPress={() => router.push("/signup")}
            >
              Administrator/Doctor
            </Text>
          </Text>
        </View>
      </View>
      <Text style={styles.footerText}>
        Terms & Conditions | Privacy Policy | Contact Us
      </Text>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: width * 18,
    // fontWeight: '600',
    textAlign: "center",
    // marginBottom: 16,
    fontFamily: "Satoshi500",
    color: "#545454",
  },
  subtitle: {
    // fontSize: ,
    color: "#555",
    // marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    // marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    color: "#333",
  },
  gradient: {
    width: "100%", // Make the gradient fill the entire button
    height: "100%", // Make the gradient fill the entire button
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  googleButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
  },
  googleButtonText: {
    fontSize: 18,
    color: "black",
    fontWeight: "bold",
  },
  button: {
    height: 56,
    backgroundColor: "#87247D",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: width * 18,
    color: "#fff",
    letterSpacing: 0.2,
    // fontWeight: "bold",
    fontFamily: "Satoshi700",
  },
  footerText: {
    textAlign: "center",
    fontFamily: "Poppins400",
    fontSize: width * 12,
    color: "#545454",
    paddingBottom: 20,
  },
  link: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: "48%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  selectedRole: {
    backgroundColor: "#4CAF50",
  },
  roleText: {
    fontSize: 16,
    color: "#4CAF50",
    textAlign: "center",
  },
  selectedRoleText: {
    color: "#fff",
  },
});
