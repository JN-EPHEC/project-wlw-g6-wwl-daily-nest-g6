import { StyleSheet, Text, View } from "react-native";

const lol = () => {
    <View style={StyleSheet.card}>
    <Text style={StyleSheet.title}>
        Coucou les copaing
    </Text>
</View>

} ;

const styles = StyleSheet.create ({

card: {
        backgroundColor: #fff,
        borderRadius: 10,
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3, 
    },

title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },

}   

);

export default lol 
