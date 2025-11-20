import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type ThemedButtonProps = ({
    label? : string;
    onPress : () => void;
    style? : any ; // le ? ca veut dire optionnelle 
    children?: React.ReactNode; 
    disabled ?: any;          // on autorise des children

});


export default function ThemedButton({label , onPress, style, children }: ThemedButtonProps){
    return (
     <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create ({
    button : { flex: 1,
      fontSize: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 21,
    backgroundColor: "#eda771ff",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    //paddingBlock: 12,
    },
    text : { fontSize: 16, fontFamily: "RobotoCondensed_400Regular_Italic", color: "rgba(255, 255, 255, 0.94)"},
});
//ceci
//je retente 
