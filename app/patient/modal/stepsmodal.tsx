import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from "react-native"
import { useSelector } from "react-redux"

interface StepGoalModalProps {
  visible: boolean
  onClose: () => void
  onSave: (steps: string) => void;
  reload: ()=>void;
}

const StepsModal = ({ visible, onClose, onSave, reload }: StepGoalModalProps) => {
  const [steps, setSteps] = useState("")
  const [loading, setLoading] = useState(false);
  const user = useSelector((state:any)=>state.user);

  // const handleSave = () => {
  //   onSave(steps)
  //   setSteps("")
  // }

  const handleSave = async () => {
    if (!steps) {
      Alert.alert("Error", "Please enter your weight.");
      return;
    }

    setLoading(true);

    const stepsData = {
      stepsGoal: parseInt(steps),
    };

    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/steps`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(stepsData),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save weight.");
      }

      console.log("API Response:", responseData);
      onSave(steps);
      setSteps("");
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
    setSteps("")
    onClose()
  }

  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Set New Goal</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={steps}
              onChangeText={setSteps}
              keyboardType="numeric"
              placeholder="-- Steps"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

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
    color: "#5E4FA2",
    marginBottom: 20,
  },
  inputContainer: {
    width: "60%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal:32,
    paddingVertical:12,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: "#7B7B7B",
    fontSize: 14,
    fontFamily: "Inter500",
  },
  saveButton: {
    backgroundColor: "#5E4FA2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth:2,
    boxShadow:'0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);',
    borderColor:'#7E72B5'
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter500",
  },
})

export default StepsModal

