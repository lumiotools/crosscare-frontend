import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";

interface WeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: string) => void;
  reload: () => void;
}

const WeightModal = ({ visible, onClose, onSave, reload }: WeightModalProps) => {
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useSelector((state: any) => state.user);
  // console.log(user.user_id);

  const handleSave = async () => {
    if (!weight) {
      Alert.alert("Error", "Please enter your weight.");
      return;
    }

    setLoading(true);

    const weightData = {
      weight: parseFloat(weight),
      weight_unit: "kg",
    };

    try {
      const response = await fetch(
        `https://87f0-45-117-109-34.ngrok-free.app/api/user/activity/${user.user_id}/weight`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(weightData),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save weight.");
      }

      console.log("API Response:", responseData);
      // onSave(weight);
      setWeight("");
      onClose();
      reload();
    } catch (error: any) {
      console.error("Error adding weight:", error);
      Alert.alert("Error", error.message || "Failed to save weight.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setWeight("");
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
          <Text style={styles.modalTitle}>Add New Weight Log</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="-- KG"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save & Continue</Text>
              )}
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
    color: "#FFA44C",
    marginBottom: 20,
  },
  inputContainer: {
    width: "60%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FFE3C8",
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
    backgroundColor: "#FFA44C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 32,
    boxShadow:
      "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
    borderWidth: 1,
    borderColor: "#FFC287",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter500",
  },
});

export default WeightModal;
