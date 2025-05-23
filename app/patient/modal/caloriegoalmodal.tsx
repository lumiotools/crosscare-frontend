import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";

interface CalorieGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (calories: string) => void;
}

const CalorieGoalModal = ({ visible, onClose, onSave }: CalorieGoalModalProps) => {
  const [calories, setCalories] = useState("");

  const {t} = useTranslation();

  const handleSave = () => {
    onSave(calories);
    setCalories("");
  };

  const handleCancel = () => {
    setCalories("");
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('meals.setNewGoal')}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="-- Cal"
              placeholderTextColor="#ccc"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText} numberOfLines={1}>{t('meals.saveContinue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter600",
    color: "#38C472",
    marginBottom: 20,
  },
  inputContainer: {
    width: "60%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#A3E4BE",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Inter500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: "#7B7B7B",
    fontSize: 14,
    fontFamily: "Inter500",
  },
  saveButton: {
    backgroundColor: "#38C472",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#A3E4BE",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    maxWidth:120,
    fontFamily: "Inter500",
  },
});

export default CalorieGoalModal;