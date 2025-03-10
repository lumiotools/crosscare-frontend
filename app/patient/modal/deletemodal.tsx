// DeleteMenu.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { Feather } from '@expo/vector-icons';

interface DeleteMenuProps {
  onDelete: () => void;
}

const DeleteMenu: React.FC<DeleteMenuProps> = ({ onDelete }) => {
  return (
    <Menu>
      <MenuTrigger>
        <Feather name="more-vertical" size={14} color="#E5E5E5" />
      </MenuTrigger>
      <MenuOptions customStyles={optionsStyles}>
        <MenuOption onSelect={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </MenuOption>
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Inter500',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

const optionsStyles = {
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    // padding: 5,
    width: 100,
  },
};

export default DeleteMenu;