import React from "react";
import {View, Text, StyleSheet} from "react-native";


<View style = {StyleSheet.card}>
    <Text style = {StyleSheet.text}> 
        Hello World
        </Text>
</View>

const styles = StyleSheet.create ({

    card: {
        backgroundcolor: #FFF,
        borderRadius: 10,
        padding: 16,
    }

    text: {
        fontSize: 18,
        fontWeight: "600",
        color: #333,
    }
})