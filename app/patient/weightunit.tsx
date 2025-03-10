import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

const weightunit = () => {

    const [selectedUnit, setSelectedUnit] = useState('ml');

  const handleSave = () => {
    // Save the selected unit and go back
    router.back();
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Units & Measurements</Text>
        <TouchableOpacity onPress={handleSave}>
            <Text>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Weight</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => setSelectedUnit('ml')}
          >
            <Text style={styles.optionText}>Kilogrmas (kg)</Text>
            {selectedUnit === 'ml' && (
              <Ionicons name="checkmark" size={16} color="#E89545" />
            )}
          </TouchableOpacity>
          
          {/* <View style={styles.separator} /> */}
          
          <TouchableOpacity 
            style={styles.optionRow}
            onPress={() => setSelectedUnit('fl.oz')}
          >
            <Text style={styles.optionText}>Pounds (lbs)</Text>
            {selectedUnit === 'fl.oz' && (
              <Ionicons name="checkmark" size={16} color="#E89545" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default weightunit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily:'DMSans600',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal:10,
    // borderTopWidth: StyleSheet.hairlineWidth,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C8C7CC',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  optionText: {
    fontSize: 14,
    color: '#000',
    fontFamily:'Inter500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C8C7CC',
    marginLeft: 16,
  },
});
