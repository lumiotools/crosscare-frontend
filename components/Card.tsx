import { height } from "@/constants/helper";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

interface CardProps {
  title: string;
  bg1: string;
  bg2: string;
  description: string;
  image1: any;
  id:string;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  bg1,
  bg2,
  image1,
  id,
  onPress,
}) => {
  const user = useSelector((state: any) => state.user);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={[bg1, bg2]} style={styles.card}>
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
          <Image
            source={parseInt(id) === 1 ? { uri: user?.avatar_url}: image1} // Use user avatar if id is 1
            style={{ width: 84, height: 84, borderRadius: 100, borderWidth:0, }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: height * 0.15, // Adjust height as needed
    justifyContent: "center",
    borderRadius: 20,
    // overflow: "hidden",
    marginBottom: 10,
    // Ensure the gradient fills the container completely
    flex: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 1, // Ensure card content is above the gradient
  },
  cardTitle: {
    fontSize: 18,
    color: "white",
    fontFamily: "DMSans700",
  },
  cardDescription: {
    fontSize: 12,
    color: "white",
    fontFamily: "DMSans400",
  },
});

export default Card;
