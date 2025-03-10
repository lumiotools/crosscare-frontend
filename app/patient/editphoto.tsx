import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // import expo-image-picker
import { Camera } from "expo-camera";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function editphoto() {
  const [title, setTitle] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null); // To store the selected image URI
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // For camera permission

  // Request permission to use the camera and image picker
  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      setHasPermission(
        cameraPermission.status === "granted" &&
          mediaPermission.status === "granted"
      );
    };

    requestPermissions();
  }, []);

  const handleSave = () => {
    console.log("Entry Created:", { title, imageUri });
  };

  const handleCancel = () => {
    setTitle("");
    setImageUri(null); // Reset image on cancel
    router.back();
    console.log("Cancelled Entry");
  };

  // Function to pick an image from the gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Updated usage
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      console.log(result.assets[0].uri);
      setImageUri(result.assets[0].uri);
    }
  };

  // Function to take a photo with the camera
//   const takePhoto = async () => {
//     if (!hasPermission) {
//       Alert.alert("Permission required", "Camera permission is needed");
//       return;
//     }

//     const photo = await Camera.takePictureAsync();
//     setImageUri(photo.uri);
//   };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>New Entry</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.imageContainer}>
            {/* Display the selected image or a placeholder */}
            {imageUri ? (
              <View style={{ position: "relative" }}>
                <Ionicons
                  onPress={() => setImageUri(null)}
                  name="close"
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    zIndex: 1,
                  }}
                  size={24}
                  color="white"
                />
                <Image source={{ uri: imageUri }} style={styles.image} />
              </View>
            ) : (
              <View
                style={{
                  width: 200,
                  height: 200,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 193, 237, 0.25)",
                }}
              >
                <Feather name="image" size={24} color="#F76CCF" />
              </View>
            )}

            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Text style={styles.addPhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Add a title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#E5E5E5"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 15,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(247, 108, 207, 0.80)",
    fontFamily: "OpenSans600",
    fontSize: 16,
  },
  headerText: {
    fontSize: 16,
    fontFamily: "OpenSans700",
    color: "#373737",
  },
  createText: {
    color: "#F76CCF",
    fontSize: 16,
    fontFamily: "OpenSans600",
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  addPhotoButton: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderColor: "#F76CCF",
    borderWidth: 1,
    marginTop: 20,
  },
  addPhotoText: {
    color: "#F76CCF",
    fontFamily: "Inter700",
    fontSize: 14,
  },
  titleInput: {
    fontSize: 16,
    height: 48,
    marginBottom: 20,
    marginHorizontal: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Inter700",
    color: "#000",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  scrollView: {
    flexGrow: 1,
  },
});
