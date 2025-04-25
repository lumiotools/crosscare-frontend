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

const ProfileField = ({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) => {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Feather name="edit-2" size={16} color="#F76CCF" />
        </TouchableOpacity>
      </View>
      <View style={styles.separator} />
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
};

const EditableNameField = ({
  label,
  value,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) => {
  const [inputValue, setInputValue] = useState(value);

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.editActions}>
          {/* <TouchableOpacity
            onPress={() => onCancel()}
            style={styles.editButton}
          >
            <Text style={{
              color: '#E162BC',
              fontSize: 12,
              fontFamily:'DMSans600',
            }}>Cancel</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              onSave(inputValue);
            }}
            style={[styles.editButton, { marginLeft: 10 }]}
          >
            <Text
              style={{
                color: "#E162BC",
                fontSize: 14,
                fontFamily: "DMSans600",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <TextInput
        style={styles.fieldInput}
        value={inputValue}
        onChangeText={setInputValue}
        autoFocus
      />
    </View>
  );
};

// Editable age field component
const EditableAgeField = ({
  label,
  age,
  onSave,
  onCancel,
}: {
  label: string;
  age: number;
  onSave: (age: number) => void;
  onCancel: () => void;
}) => {
  const [inputValue, setInputValue] = useState(age.toString());

  const handleSave = () => {
    Keyboard.dismiss();
    const newAge = Number.parseInt(inputValue);
    if (!isNaN(newAge) && newAge > 0) {
      onSave(newAge);
    } else {
      onCancel();
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.editActions}>
          {/* <TouchableOpacity onPress={onCancel} style={styles.editButton}>
            <Text style={{
              color: '#E162BC',
              fontSize: 12,
              fontFamily:'DMSans600',
            }}>Cancel</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.editButton, { marginLeft: 10 }]}
          >
            <Text
              style={{
                color: "#E162BC",
                fontSize: 14,
                fontFamily: "DMSans600",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <View style={styles.ageInputContainer}>
        <TextInput
          style={styles.ageInput}
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="numeric"
          autoFocus
        />
        <Text style={styles.fieldValue}> Years</Text>
      </View>
    </View>
  );
};

const EditableEmailField = ({
  label,
  value,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) => {
  const [inputValue, setInputValue] = useState(value);

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.editActions}>
          {/* <TouchableOpacity
            onPress={() => onCancel()}
            style={styles.editButton}
          >
            <Text style={{
              color: '#E162BC',
              fontSize: 12,
              fontFamily:'DMSans600',
            }}>Cancel</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              onSave(inputValue);
            }}
            style={[styles.editButton, { marginLeft: 10 }]}
          >
            <Text
              style={{
                color: "#E162BC",
                fontSize: 14,
                fontFamily: "DMSans600",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <TextInput
        style={styles.fieldInput}
        value={inputValue}
        onChangeText={setInputValue}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />
    </View>
  );
};

const EditablePregnancyWeekField = ({
  label,
  week,
  onSave,
  onCancel,
}: {
  label: string;
  week: number;
  onSave: (week: number) => void;
  onCancel: () => void;
}) => {
  const [inputValue, setInputValue] = useState(week.toString());

  const handleSave = () => {
    Keyboard.dismiss()
    const newWeek = Number.parseInt(inputValue);
    if (!isNaN(newWeek) && newWeek > 0 && newWeek <= 42) {
      onSave(newWeek);
    } else {
      onCancel();
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.editActions}>
          {/* <TouchableOpacity onPress={onCancel} style={styles.editButton}>
            <Text style={{
              color: '#E162BC',
              fontSize: 12,
              fontFamily:'DMSans600',
            }}>Cancel</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.editButton, { marginLeft: 10 }]}
          >
            <Text
              style={{
                color: "#E162BC",
                fontSize: 14,
                fontFamily: "DMSans600",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <View style={styles.ageInputContainer}>
        <Text style={styles.fieldValue}>Week </Text>
        <TextInput
          style={styles.ageInput}
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="numeric"
          autoFocus
        />
      </View>
    </View>
  );
};

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

  const updateProfile = async (fieldName: string, value: string | number) => {
    if (!user?.user_id || !token) {
      Alert.alert("Error", "User ID or token not available");
      return;
    }

    setUpdating(true);

    try {
      // Create update payload
      const updateData: Record<string, any> = {};
      updateData[fieldName] = value;

      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/${user.user_id}/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update profile: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Profile updated:", data);

      // Refresh profile data
      getProfile();

      const updatedUserData = { ...user };

      // Update the specific fields in Redux based on what was changed
      if (fieldName === "name") {
        updatedUserData.user_name = value as string;
      } else if (fieldName === "email") {
        updatedUserData.user_email = value as string;
      }

      // Update Redux state with the updated user data
      dispatch(setUser(updatedUserData));

      // Alert.alert("Success", `Your ${fieldName} has been updated successfully.`)
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", `Failed to update ${fieldName}. Please try again.`);
    } finally {
      setUpdating(false);
    }
  };

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
          // Fixed: using permissionGranted instead of status
          setNotificationsEnabled(true);
          Alert.alert(
            "Notifications Enabled",
            "You will now receive notifications from the app.",
            [{ text: "OK" }]
          );
        } else {
          // Show alert if permission denied
          // Alert.alert(
          //   "Permission Required",
          //   "Notification permission is required. Please enable notifications in your device settings.",
          //   [{ text: "OK" }],
          // )
        }
      } else {
        // Simply disable notifications in the app
        setNotificationsEnabled(false);
        // Alert.alert("Notifications Disabled", "You will no longer receive notifications from the app.", [
        //   { text: "OK" },
        // ])
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      Alert.alert(
        "Error",
        "There was a problem updating your notification settings.",
        [{ text: "OK" }]
      );
    }
  };

  // Name handlers
  const handleSaveName = async (newName: string) => {
    if (newName.trim()) {
      setName(newName);
      await updateProfile("name", newName);
    }
    setIsEditingName(false);
  };

  // Pregnancy week handlers
  const handleSavePregnancyWeek = async (newWeek: number) => {
    setPregnancyWeek(newWeek);
    await updateProfile("week", newWeek);
    setIsEditingPregnancyWeek(false);
  };

  // Email handlers
  const handleSaveEmail = async (newEmail: string) => {
    if (newEmail.trim() && newEmail.includes("@")) {
      setEmail(newEmail);
      await updateProfile("email", newEmail);
    }
    setIsEditingEmail(false);
  };

  // Age handlers
  const handleSaveAge = async (newAge: number) => {
    setAge(newAge);
    await updateProfile("age", newAge);
    setIsEditingAge(false);
  };

  const logout = async()=>{
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    dispatch(removeToken());
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Notification</Text>
              <View
                style={{
                  width: 20,
                }}
              />
            </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => router.push("/avatar")}
          >
            <Text style={styles.avatarText}>Customize your Avatar</Text>
            <View style={styles.avatarRight}>
              <Image
                source={{
                  uri: user?.avatar_url
                }}
                style={styles.avatarImage}
              />
              <Ionicons name="chevron-forward" size={20} color="#E162BC" />
            </View>
          </TouchableOpacity> */}

          <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>Allow Notifications</Text>
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
