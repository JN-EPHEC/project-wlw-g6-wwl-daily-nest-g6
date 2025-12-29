import Mascotte_Happy from "assets/images/Mascotte_happy.png";
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { Image } from 'expo-image';
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import {
  // FacebookAuthProvider, // Décommenté quand Facebook Login sera prêt
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ImageBackground, Text, TextInput, TouchableOpacity, View } from "react-native";
import fond_étoile_app from "../assets/images/fond_étoile_app.png";
import { auth, db } from "../firebaseConfig";
import ThemedText from './themed-text';


export default function AuthComponent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordControle, setPasswordControle] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [passwordControleError, setPasswordControleError] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = makeRedirectUri({
    scheme: 'dailynest'
  });
  
  console.log('🔗 Redirect URI:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '353116805631-u804rsqhscj016kvovaqfjj7eo5icp0u.apps.googleusercontent.com',
    androidClientId: '353116805631-u804rsqhscj016kvovaqfjj7eo5icp0u.apps.googleusercontent.com',
    iosClientId: '353116805631-u804rsqhscj016kvovaqfjj7eo5icp0u.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri: redirectUri,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);
      if (currentUser) {
        router.replace("/drawer/Acceuil");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setErrorMessage("");
    setEmailError(false);
    setPasswordError(false);

    let hasError = false;
    if (!email) {
      setEmailError(true);
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        email: userCredential.user.email,
        createdAt: new Date(),
        familyId: null,
      }, { merge: true });

    } catch (error: any) {
      if (error.code == 'auth/invalid-email' ||error.code === 'auth/wrong-password' ) {
        setErrorMessage("Email ou mot de passe incorrect");
      } else {
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = authentication?.idToken;

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        (async () => {
          const result = await signInWithCredential(auth, credential);
          const user = result.user;
          const uid = user.uid;

           // Extraire le prénom et nom du displayName
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

          await setDoc(doc(db, "users", uid), {
            email: user.email,
            firstName: firstName,
            lastName: lastName,
            birthDate: '', // À compléter par l'utilisateur
            createdAt: new Date(),
          }, { merge: true });

          console.log("Connexion Google réussie");
        })();
      }
    } else if (response?.type === 'error') {
      Alert.alert('Erreur', 'Échec de la connexion Google. Veuillez réessayer.');
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential ? credential.accessToken : null;
          const user = result.user;
        }).catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          const email = error.customData.email;
          const credential = GoogleAuthProvider.credentialFromError(error);
        });
      //  await promptAsync();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const uid = user.uid;

      // Extraire le prénom et nom du displayName
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await setDoc(doc(db, "users", uid), {
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        birthDate: '', // À compléter par l'utilisateur dans son profil
        createdAt: new Date(),
      }, { merge: true });

      console.log("Connexion Google réussie");
    } catch (err: any) {
      console.warn('Google sign-in error', err);
      Alert.alert('Erreur', err.message || String(err));
    }
  };

  return (
    <View className="flex-1">
      {/* BACKGROUND uniquement (plus large + décalé, sans bouger l'écran) */}
      <View className="absolute inset-0 overflow-hidden">
        <ImageBackground
          source={fond_étoile_app}
          resizeMode="cover"
          className="w-[120%] h-full -ml-20"
        />
      </View>

      {/* CONTENU (inchangé) */}
      <View className="flex-1 justify-center px-6">
        <Image source={Mascotte_Happy} className="w-36 h-36 self-center" contentFit="contain" />

        <ThemedText type="title"
          className="text-5xl text-[#FF914D] text-center mb-2 mt-2">Daily Nest</ThemedText>

       <ThemedText type="subtitle" className="text-sm text-neutral-600 text-center mb-1">
  Organize simply
</ThemedText>

<ThemedText type="subtitle" className="text-sm text-neutral-600 text-center mb-8">
  manage your family
</ThemedText>

        {/* l'email */}
        <TextInput
          className={`h-12 rounded-2xl border px-4 text-base bg-white text-neutral-900 ${
            emailError ? "border-red-500" : "border-black/10"
          } focus:border-[#FF914D]`}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(false);
          }}
          autoCapitalize="none"
        />
        {emailError && (
          <Text className="text-red-500 text-xs mt-2">
            Cette case doit être remplie
          </Text>
        )}

        {/* Mdp */}
        <TextInput
          className={`h-12 rounded-2xl border px-4 text-base bg-white text-neutral-900 mt-4 ${
            passwordError ? "border-red-500" : "border-black/10"
          } focus:border-[#FF914D]`}
          placeholder="Mot de passe"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError(false);
          }}
          secureTextEntry
        />
        {passwordError && (
          <Text className="text-red-500 text-xs mt-2">
            Le mot de passe doit contenir au moins 6 caractères
          </Text>
        )}

        {errorMessage ? (
          <Text className="text-red-500 text-sm text-center mt-4">
            {errorMessage}
          </Text>
        ) : null}

        <View className="w-full mt-7 space-y-3">
          {/* CTA principal */}
          <TouchableOpacity
            onPress={handleSignIn}
            className="h-12 rounded-full bg-[#F2A167] items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">Se connecter</Text>
          </TouchableOpacity>

          {/* Séparateur */}
          <View className="flex-row items-center mt-5">
            <View className="flex-1 h-px bg-black/10" />
            <Text className="mx-3 text-xs text-neutral-500">ou</Text>
            <View className="flex-1 h-px bg-black/10" />
          </View>

          {/* Google */}
          <View>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              className="w-full h-12 rounded-full bg-white border border-black/10 justify-center"
            >
              <View className="flex-row items-center w-full px-4">
                <Image
                  source={require("../assets/images/Google_icon_v2.png")}
                  className="w-5 h-5"
                />

                <Text className="flex-1 text-center text-neutral-900 font-semibold text-base">
                  Continuer avec Google
                </Text>

                <View className="w-5" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Lien d'inscription */}
          <View className="w-full flex-row justify-center mt-4">
            <Text className="text-sm text-neutral-600">Pas de compte ?</Text>
            <Text
              onPress={() => router.push("/Inscription")}
              className="text-sm text-[#FF914D] font-semibold ml-1"
            >
              Créer un compte
            </Text>
          </View>
        </View>
      </View>

      {/* Modal de réinitialisation de mot de passe */}
      <Modal
        visible={resetPasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetPasswordModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Réinitialiser le mot de passe</Text>
            <Text style={styles.modalDescription}>
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setResetPasswordModalVisible(false);
                  setResetEmail("");
                }}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleResetPassword}
              >
                <Text style={styles.modalButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
