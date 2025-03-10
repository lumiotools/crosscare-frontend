import React, { FC, useLayoutEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  View,
  StatusBar,
} from "react-native";
import { supabase } from "@/supabase/supabase";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { makeRedirectUri } from "expo-auth-session";
import { fontSize, height, width } from "@/constants/helper";
import CustomTextInput from "@/components/ui/CustomTextInput";
import LogoSvg from "@/assets/images/Svg/LogoSvg";
import { LinearGradient } from "expo-linear-gradient";

const SignUp: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("patient");
  const navigation = useNavigation();
  const router = useRouter();
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const redirectTo = makeRedirectUri();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const openEmail = () => {
    Linking.openURL("mailto:");
  };

  const handleSignUp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newError: any = {};

    if (!email) {
      newError.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newError.email = "Invalid email format.";
    }

    if (!password) {
      newError.password = "Password is required.";
    }

    // router.replace(
    //   role === "doctor" ? "/patient/(tabs)/home" : "/doctor/(tabs)/home"
    // );

    if (Object.keys(newError).length > 0) {
      setEmailError(newError.email || "");
      setPasswordError(newError.password || "");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Check if user exists in either patient or doctor table
      const { data: existingPatient } = await supabase
        .from("patient")
        .select()
        .eq("email", email)
        .single();

      const { data: existingDoctor } = await supabase
        .from("doctor")
        .select()
        .eq("email", email)
        .single();

      if (existingPatient || existingDoctor) {
        Alert.alert(
          "Error",
          "This email is already registered. Please use a different email."
        );
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: "doctor",
          },
          // emailRedirectTo: redirectTo,
        },
      });

      console.log(authData);

      if (authError) {
        Alert.alert("Signup Failed", authError.message);
        setLoading(false);
        return;
      }
      const auth_id = authData.user?.id;

      // Insert into appropriate table based on role
      const tableName = "doctor";
      const { error: dbError } = await supabase.from(tableName).insert([
        {
          name,
          email,
          auth_id,
          role,
        },
      ]);

      if (dbError) {
        console.log(dbError.message);
        Alert.alert("Error Saving User", dbError.message);
        setLoading(false);
      } else {
        setLoading(false);
        setEmail("");
        setPassword("");
        setName("");
        Alert.alert(
          "Email Verification Required",
          "Please check your email and verify your account to continue.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
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
      <StatusBar barStyle={'dark-content'}/>
      <View
        style={{
          justifyContent: "center",
          marginTop: Platform.OS === "ios" ? height * 0.12 : height * 0.19,
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
            onPress={handleSignUp}
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
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/*<View style={{
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      width: "100%",
      marginBottom: 20,
    }}>  
      <TouchableOpacity 
        onPress={() => setRole("patient")}
        style={[
          styles.roleButton,
          role === "patient" && styles.selectedRole
        ]}
      >
        <Text style={[
          styles.roleText,
          role === "patient" && styles.selectedRoleText
        ]}>Patient</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setRole("doctor")}
        style={[
          styles.roleButton,
          role === "doctor" && styles.selectedRole
        ]}
      >
        <Text style={[
          styles.roleText,
          role === "doctor" && styles.selectedRoleText
        ]}>Doctor</Text>
      </TouchableOpacity>
    </View> */}

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
              fontFamily: "DMSans400",

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
              onPress={() => router.push("/login")}
            >
              Patient
            </Text>
          </Text>
        </View>
      </View>
      {/* <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={handleGoogleSignin}
    /> */}
      {/* <Text style={styles.footerText}>
      Don't have an account?{" "}
      <Text style={styles.link} onPress={() => router.push("/signup")}>
        Sign Up
      </Text>
    </Text> */}
      <Text style={styles.footerText}>
        Terms & Conditions | Privacy Policy | Contact Us
      </Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: width * 18,
    textAlign: "center",
    fontFamily: "Satoshi500",
    color: "#545454",
  },
  gradient: {
    width: "100%",  // Make the gradient fill the entire button
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
    fontFamily: "Satoshi700",
  },
  footerText: {
    textAlign: "center",
    fontFamily: "DMSans400",
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

export default SignUp;