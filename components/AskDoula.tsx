import type React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AskDoulaContent from "@/app/patient/askdoula";
import { useFloating } from "@/context/FloatingContext";
import { router } from "expo-router";

const AskDoula: React.FC = () => {
  const { closeModal } = useFloating();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            closeModal(); // Close the modal first
            router.push("/patient/askdoula"); // Then navigate
          }}
        >
          <MaterialIcons name="open-in-full" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeIconButton} onPress={closeModal}>
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Add padding to the top to account for the absolute header */}
      <AskDoulaContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    // borderRadius: 20,
  },
  closeIconButton: {
    width: 24,
    height: 24,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0, // Make sure it spans the full width
    zIndex: 10, // Ensure it's above other content
    backgroundColor: "white", // Add background color
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20, // Match container border radius
    borderTopRightRadius: 20, // Match container border radius
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
});

export default AskDoula;
