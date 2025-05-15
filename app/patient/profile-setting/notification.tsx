"use client";

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Image,
  ScrollView,
  Alert,
  Keyboard,
  Linking,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { StatusBar } from "react-native";
import { TextInput } from "react-native";
import * as Notifications from "expo-notifications";
import { requestNotificationPermissions } from "../../../utils/NotificationManager";
import { router } from "expo-router";
import { removeToken, setToken, setUser } from "@/store/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const notification = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState();
  const user = useSelector((state: any) => state.user);
  const [name, setName] = useState(user?.user_name);
  const [age, setAge] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState(user?.user_email);
  const [pregnancyWeek, setPregnancyWeek] = useState(0);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const token = useSelector((state: any) => state.user.token);
  console.log("token", token);
  console.log("userData1", user);
  const dispatch = useDispatch();

  // State for edit modes
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAge, setIsEditingAge] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPregnancyWeek, setIsEditingPregnancyWeek] = useState(false);

  const getProfile = async () => {
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

    const data = await response.json();
    console.log("Profile data:", data.name);
    setAge(data.age || 0);
    setName(data.name || "");
    setEmail(data.email || "");
    setPregnancyWeek(data.week || 0);

    // Extract and log question responses
    setProfile(data);
  };

  useEffect(() => {
    if (user?.user_id) {
      getProfile();
    }
  }, [user?.user_id]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
        setNotificationsEnabled(status === "granted");
      } catch (error) {
        console.error("Error checking notification permissions:", error);
      }
    };

    checkPermissions();
  }, []);

  const toggleNotifications = async () => {
    try {
      if (!notificationsEnabled) {
        // Request permissions if notifications are being enabled
        const permissionGranted = await requestNotificationPermissions();
        setPermissionStatus(
          permissionGranted
            ? Notifications.PermissionStatus.GRANTED
            : Notifications.PermissionStatus.DENIED
        );
  
        if (permissionGranted) {
          setNotificationsEnabled(true);
          Alert.alert(
            t('profile.notificationsEnabled'),
            t('profile.notificationsMessage'),
            [{ text: "OK" }]
          );
        } else {
          // If permission is denied, prompt the user to go to settings
          Alert.alert(
            t('profile.permissionRequired'),
            t('profile.permissionMessage'),
            [
              {
                text: t('profile.goToSettings'),
                onPress: () => Linking.openSettings(),
              },
              { text: t('profile.cancel') }
            ]
          );
        }
      } else {
        // Simply disable notifications in the app
        setNotificationsEnabled(false);
        Alert.alert(
          t('profile.notificationsDisabled'),
        t('profile.notificationsDisabledMessage'),
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      Alert.alert(
         t('profile.error'),
      t('profile.errorMessage'),
        [{ text: "OK" }]
      );
    }
  };
  
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} color="black" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('profile.notifications')}</Text>
              <View
                style={{
                  width: 20,
                }}
              />
            </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>{t('allowNotification')}</Text>
            <Switch
              trackColor={{ false: "#E5E5E5", true: "#F76CCF" }}
              thumbColor={"#fff"}
              ios_backgroundColor="#E5E5E5"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>

         
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent:'space-between',
    flexDirection: 'row',
    alignItems:'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldContainer: {
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  fieldContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#7B7B7B",
    fontFamily: "DMSans500",
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#7B7B7B29",
    marginBottom: 12,
  },
  fieldInput: {
    fontSize: 16,
    color: "#373737",
    fontFamily: "DMSans600",
    padding: 0,
  },
  fieldValue: {
    fontSize: 16,
    color: "#373737",
    fontFamily: "DMSans600",
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    alignItems: "center",
    height: 53,
    marginBottom: 24,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  avatarText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "DMSans600",
  },
  avatarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 25,
  },
  ageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ageInput: {
    fontSize: 16,
    color: "#373737",
    fontFamily: "DMSans600",
    padding: 0,
    // minWidth: 30,
  },
  notificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    borderRadius: 12,
    height: 53,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  notificationText: {
    fontSize: 15,
    color: "#333",
    fontFamily: "DMSans600",
  },
  termsContainer: {
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    height: 53,
    marginBottom: 20,
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  termsText: {
    fontSize: 16,
    color: "#E162BC",
    fontFamily: "DMSans600",
  },
});
