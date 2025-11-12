import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    createUserWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import { Alert, Button, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function SignUp() {

    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showWelcome, setshowWelcome] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthdate, setBirthdate] = useState("");

    const handleSignUp = async () => {
        try {
            await createUserWithEmailAndPassword(
                auth,
                email, 
                password,
            );
            setshowWelcome(true);
        } catch (error: any) {
            Alert.alert("Erreur Inscription", error.message);
        };
    }

    const handleCloseModal = () => {
        setshowWelcome(false);
        router.replace("/drawer/Acceuil");
    } 
    const isFormValid = firstName && lastName && birthdate && email && password.length >= 6;
    return (

        <View style={{flex: 1, padding: 20}}>
            <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
        <View>
            <Text>Inscription</Text>

            <TextInput
            placeholder="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            />

            <TextInput
            placeholder="Nom"
            value={lastName}
            onChangeText={setLastName}
            />
            <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            />
            <TextInput
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            />
            <TextInput
            placeholder="Date de naissance (JJ/MM/AAAA)"
            value={birthdate}
            onChangeText={setBirthdate}
            />
            <Button
            title="S'inscrire"
            onPress={handleSignUp}
            disabled={!isFormValid}
            />

        </View> 
        <View>
            <TouchableOpacity onPress={() => router.push("/auth")} >
                <Text>Déjà un compte ? Connectez-vous</Text>
            </TouchableOpacity>
        </View>
        <Modal visible={showWelcome} animationType="slide" >
            <View style={{flex: 1, justifyContent: "center", alignItems: "center", padding: 20}}>
                <Text style={{fontSize: 24, fontWeight: "bold", marginBottom: 20}}>Bienvenue, {firstName} !</Text>
                <Text style={{fontSize: 16, textAlign: "center", marginBottom: 20}}>Votre compte a été créé avec succès.</Text>
                <Button title="Commencer" onPress={handleCloseModal} />
            </View>
        </Modal>
        </View>
    );
}
