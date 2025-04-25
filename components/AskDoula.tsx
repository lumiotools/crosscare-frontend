import type React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
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
            router.push({
              pathname: "/patient/askdoula",
              params: { from_modal: "true" },
            }); // Then navigate
          }}
        >
          <Feather name="maximize-2" size={20} color="#7B7B7B" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={closeModal}
          style={{
            height: 32,
            justifyContent: "center",
            alignItems: "center",
            // backgroundColor: "black",

            width: 32,
            zIndex: 10,
          }}
        >
          <Ionicons name="close" size={20} color="#7B7B7B" />
        </TouchableOpacity>
      </View>

      {/* Add padding to the top to account for the absolute header */}
      <View style={{
        flex:1,
        marginTop:5,
      }}>

      <AskDoulaContent />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    position: "relative",
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
    paddingHorizontal: 10,

    paddingVertical: 10,
    borderTopLeftRadius: 20, // Match container border radius
    borderTopRightRadius: 20, // Match container border radius
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerButton: {
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "black",

    width: 32,
    zIndex: 10,
  },
});

export default AskDoula;
