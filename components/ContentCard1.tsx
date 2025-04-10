import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import React from "react";
import { router } from "expo-router";

interface ContentCard1Props {
  id: number;
  title: string;
  imageSource: {
    uri: string;
  }; // Replace 'any' with the appropriate type if known
  date?: string;
}

const ContentCard1: React.FC<ContentCard1Props> = ({ id, title, imageSource, date }) => {
  console.log("Rendering title:", title); // Add this for debugging
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/patient/openphoto",
          params: {
            item: JSON.stringify({
              id,
              title,
              imageSource,
              date,
            }),
          },
        })
      }
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        {/* Make sure imageSource is properly formatted */}
        <Image source={imageSource} style={styles.cardImage} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBot
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardTitle: {
    fontSize: 16,
    maxWidth:"70%",
    fontFamily: "Inter700",
    color: "#434343",
    // marginBottom: 4,
  },
  card: {
    backgroundColor: "#fff",
    // padding: 16,
    // paddingVertical: 20,
    // marginBottom: 16,

    borderRadius: 8,
  },

  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
});
export default ContentCard1;
