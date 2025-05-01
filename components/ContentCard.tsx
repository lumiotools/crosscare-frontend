import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { router } from "expo-router";

interface ContentCardProps {
  id: number;
  title: string;
  description: string;
  date?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ id, title, description, date }) => {
  // console.log(id);
  return (
    <TouchableOpacity
      onPress={() =>  router.push({
        pathname: "/patient/opennote",
        params: {
          item: JSON.stringify({
            id,
            title,
            description,
            date,
          })
        }
      })}
      style={styles.card1}
    >
      <View style={styles.cardContent1}>
        <Text style={styles.cardTitle1} numberOfLines={1}>{title}</Text>
        <Text style={styles.cardDescription} numberOfLines={1}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ContentCard;

const styles = StyleSheet.create({
  cardTitle1: {
    fontSize: 16,
    fontFamily: "Inter700",
    color: "#434343",
    marginBottom: 5,
  },

  card1: {
    backgroundColor: "#fff",
    flexDirection: "column",
    gap: 5,
    // padding: 16,
    // paddingVertical: 20,
    // marginBottom: 16,
    borderRadius: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#757575",
  },
  cardContent1: {
    borderBottomWidth: 1,
    // marginBottom:
    paddingTop: 11,
    paddingBottom: 14,
    borderBottomColor: "#f0f0f0",
  },
});
