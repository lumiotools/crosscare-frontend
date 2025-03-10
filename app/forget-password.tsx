import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { FC, useLayoutEffect, useState } from "react";
import CustomTextInput from "@/components/ui/CustomTextInput";
import { fontSize } from "@/constants/helper";
import { Colors } from "@/constants/Colors";
import { useNavigation, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgetScreen: FC = () => {
  const [email, setEmail] = useState("");

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "",
      headerStyle: {
        backgroundColor: "white",
      },
      headerTintColor: "#545454",
      headerShadowVisible: false,
      headerBackTitleVisible: false,
    });
  }, [navigation]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 40 }}
      >
        <View style={{}}>
          <Text
            style={{
              fontFamily: "Poppins500",
              fontSize: 18,
              color: "#545454",
              marginBottom: 10,
            }}
          >
            Enter Email
          </Text>
          <CustomTextInput
            placeholder="Email"
            icon={"user"}
            value={email}
            onChangeText={setEmail}
            type="email"
          />
        </View>
      </ScrollView>
      <View
        style={{
          marginHorizontal: 40,
          marginVertical: 10,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: Colors.primaryColor_600,
            borderRadius: 10,
            marginTop: 10,
            width: "100%",
            alignItems: "center",
            paddingVertical: 16,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: fontSize * 18,
              fontFamily: "Poppins600",
              lineHeight: 24,
            }}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ForgetScreen;

const styles = StyleSheet.create({});
