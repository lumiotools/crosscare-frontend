import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

interface FloatingMenuProps {
  visible: boolean;
  onClose: () => void;
  buttonPosition?: { x: number, y: number }; // Add position prop
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ 
  visible, 
  onClose, 
  buttonPosition = { x: 0, y: 0 } // Default position
}) => {
  const router = useRouter();
  const { width } = Dimensions.get('window');

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  // Calculate menu position based on button position
  const isOnRightSide = buttonPosition.x > width / 2;
  
  // Position menu to the left of the button if button is on right side,
  // otherwise position to the right of the button
  const menuPosition = {
    top: buttonPosition.y - 100, // Position menu above the button
    left: isOnRightSide ? buttonPosition.x - 220 : buttonPosition.x + 60
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.menuContainer, menuPosition]}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('/')}
          >
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('/patient/(tabs)/home')}
          >
            <Text style={styles.menuText}>Patient Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateTo('/avatar')}
          >
            <Text style={styles.menuText}>Avatar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={onClose}
          >
            <Text style={styles.menuText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute', // Position absolutely
    width: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'DMSans500',
  }
});

export default FloatingMenu;