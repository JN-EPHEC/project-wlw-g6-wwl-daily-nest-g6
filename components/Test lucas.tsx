import { StyleSheet, Text, View } from "react-native";

export default function BonjourNoel() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Bonjour Mr Noël</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignContent: "center",
        backgroundColor : "#FFF",
    },
    text:{
        fontFamily: "gliker",
        fontSize: "25px",
        textAlign: "center",
        color: "#AAA",
    }
});