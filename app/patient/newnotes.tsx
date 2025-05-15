import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useSelector } from "react-redux";

export default function NewNotes() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const user = useSelector((state: any) => state.user);

  const handleSave = async () => {
    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/note`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: title, description: content }),
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to save note: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log("Note saved successfully:", data);
      if(data.success){
        setTitle("");
        setContent("");
        router.back();
      }
  
    } catch (error:any) {
      console.error("Error saving note:", error.message);
      alert("Failed to save the note. Please try again.");
    }
  };
  

  const handleCancel = () => {
    setTitle("");
    setContent("");
    console.log("Cancelled Entry");
    router.back();
  };

  const { t }  = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>{t('new_entry')}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView>
          <TextInput
            style={styles.titleInput}
            placeholder={t('journal.title')}
            multiline
            autoFocus
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8B8B8B"
          />
          <TextInput
            style={styles.contentInput}
            placeholder={t('journal.start_writing')}
            value={content}
            onChangeText={setContent}
            placeholderTextColor="#E5E5E5"
            multiline
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
    // paddingBottom: 10,
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
    minHeight: 100, // This will give an initial height
    maxHeight: 300, // Max height for the content input
    flex: 1,
  },
});
