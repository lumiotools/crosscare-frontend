import Pen from "@/assets/images/Svg/Pen";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OpenNote() {
  const params = useLocalSearchParams();

  // Parse the params.item (which is likely a string)
  const item = typeof params.item === "string" ? JSON.parse(params.item) : null;

  console.log("Parsed Note Data:", item);

  const [title, setTitle] = useState(
    item?.title || "This is the title of your note"
  );
  const [content, setContent] = useState(
    item?.description || "This is the content of your note"
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    console.log("Saved Entry:", { title, content });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(""); // Clear title
    setContent(""); // Clear content
    console.log("Cancelled Entry");
    router.back(); // Navigate back
  };

  const [datePart, timePart] = item?.date.split(", ");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>New Entry</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView>
          {/* Title */}
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              multiline
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#8B8B8B"
            />
          ) : (
            <Text style={styles.titleInput}>{title}</Text>
          )}
          <Text>On {datePart}</Text>
          <Text>At {timePart}</Text>

          {/* Content */}
          {isEditing ? (
            <TextInput
              style={styles.contentInput}
              placeholder="Start writing ..."
              value={content}
              onChangeText={setContent}
              placeholderTextColor="#E5E5E5"
              multiline
            />
          ) : (
            <Text style={styles.contentInput}>{content}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Icon */}
      {!isEditing && (
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={styles.editIcon}
        >
          <Pen />
        </TouchableOpacity>
      )}
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
  saveText: {
    color: "#F76CCF",
    fontSize: 16,
    fontFamily: "OpenSans600",
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleInput: {
    fontSize: 20,
    marginBottom: 10,
    fontFamily: "Inter700",
    color: "#000",
  },
  contentInput: {
    fontSize: 14,
    color: "#434343",
    textAlignVertical: "top",
    minHeight: 100, // Initial height for the content
    maxHeight: 300, // Max height for the content input
    flex: 1,
  },
  editIcon: {
    position: "absolute",
    bottom: 20,
    right: 20,
    marginTop: 20,
  },
});
