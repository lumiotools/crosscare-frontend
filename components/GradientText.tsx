import React from "react";
import { Text, View } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from 'expo-linear-gradient';

const GradientText = ({ text, colors, style }) => {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }}  // Start point (top-left)
        end={{ x: 1, y: 0 }}  >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;