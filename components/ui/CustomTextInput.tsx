import { Colors } from '@/constants/Colors';
import { fontSize, height, width } from '@/constants/helper';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInputProps, TextInput, View, Text, TouchableOpacity, StyleSheet } from 'react-native';


interface CustomTextInputProps extends TextInputProps {
  icon: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  type: 'email' | 'password' | 'username'; // Add other types if necessary
  errorMessage?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  type,
  errorMessage,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Toggle password visibility
  const handlePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Icon */}
        <Feather name={icon} size={width * 16} color="#8A8A8A" style={styles.icon} />
        {/* TextInput */}
        <TextInput
          {...props}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor="#B0B0B0"
        />
        {/* Show/Hide Password Button */}
        {type === 'password' && (
          <TouchableOpacity onPress={handlePasswordVisibility}>
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={width * 18}
              color='#B0B0B0'
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      {/* Error message */}
      {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    // marginVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    // paddingVertical:16,
    // padding:14,
    height: 56,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    // height: '100%',
    // marginTop: 7,
    fontSize: width * 16,
    color: '#000',
    fontFamily: 'Satoshi400',
  },
  eyeIcon: {
    marginLeft:  10,
    marginTop: 7,
  },
  errorMessage: {
    color: 'red',
    fontSize:width * 12,
    marginTop: 2,
    fontFamily: 'Poppins400',
  },
});

export default CustomTextInput;
