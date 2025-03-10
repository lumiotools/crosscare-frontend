import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import React from "react";
import { router } from "expo-router";

interface ContentCard1Props {
  title: string;
  imageSource: any; // Replace 'any' with the appropriate type if known
}

const ContentCard1: React.FC<ContentCard1Props> = ({ title, imageSource }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push("/patient/openphoto")}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Image source={{uri :'https://imgs.search.brave.com/zxTnRhQvhR728xt6dJpO_jmUUc_q1CSSOf-0bVtl9Rk/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQ3/MzU1OTQyNS9waG90/by9mZW1hbGUtbWVk/aWNhbC1wcmFjdGl0/aW9uZXItcmVhc3N1/cmluZy1hLXBhdGll/bnQuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPWtHYm0tVEU1/cWRwcHl5aXRleWlw/N19DektMa3R5UHJS/dVdENFp6MkVjcUU9'}} style={styles.cardImage} />
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
        paddingBottom:10,
        borderBottomWidth:1,
        borderBottomColor:"#f0f0f0",
      },
      cardTitle: {
        fontSize: 16,
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
})
export default ContentCard1;
