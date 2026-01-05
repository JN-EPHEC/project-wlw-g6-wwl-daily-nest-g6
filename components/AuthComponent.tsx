import Mascotte_Happy from "assets/images/Mascotte_happy.png";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Checkbox from "expo-checkbox";
import { Image } from "expo-image";
import { useRootNavigationState, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import fond_etoile_app from "../assets/images/fond_etoile_app.png";
import { auth, db } from "../firebaseConfig";
import ThemedText from "./themed-text";



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
  const [resetError, setResetError] = useState("");

 WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "dailynest",
});

const [request, response, promptAsync] = Google.useAuthRequest({
  iosClientId: "TON_IOS_CLIENT_ID.apps.googleusercontent.com",
  webClientId: "353116805631-u804rsqhscj016kvovaqfjj7eo5icp0u.apps.googleusercontent.com",
  scopes: ["profile", "email"],
  redirectUri,
});
 

  console.log('🔗 Redirect URI:', redirectUri);



  const rootNavState = useRootNavigationState();

useEffect(() => {
  if (!rootNavState?.key) return; // ✅ attendre que la navigation soit prête

  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    setIsLoggedIn(!!currentUser);

    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      // ✅ Si le doc n’existe pas encore (cas inscription), on le crée
      if (!snap.exists()) {
        await setDoc(
          userRef,
          {
            email: currentUser.email ?? "",
            createdAt: Date.now(),
            onboardingPremiumSeen: false,
            isPremium: false,
          },
          { merge: true }
        );
        router.replace("/OnboardingPremium");
        return;
      }

      const seen = !!snap.data()?.onboardingPremiumSeen;

      if (!seen) {
        router.replace("/OnboardingPremium");
      } else {
        router.replace("/drawer/Acceuil");
      }
    } catch (e) {
      console.log("❌ auth redirect error:", e);
      // fallback
      router.replace("/drawer/Acceuil");
    }
  });

  return () => unsubscribe();
}, [rootNavState?.key]);

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
      if (error.code == 'auth/invalid-email') {
        setErrorMessage("Email ou mot de passe incorrect");
      } else {
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetPassword = async () => {
    setResetError("");
    if (!resetEmail.trim()) {
      setResetError("Merci d'entrer votre email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      Alert.alert("Email envoyé", "Un lien de réinitialisation vous a été envoyé.");
      setResetPasswordModalVisible(false);
      setResetEmail("");
    } catch (error: any) {
      setResetError("Impossible d'envoyer l'email. Vérifiez l'adresse.");
      console.error("reset password error", error);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      console.log('✅ Google auth response success');
      const { authentication } = response;

      const idToken = authentication?.idToken;

      if (idToken) {
        console.log('🔑 ID Token received');
        const credential = GoogleAuthProvider.credential(idToken);
        (async () => {
          try {
            console.log('🔄 Signing in with credential...');
            const result = await signInWithCredential(auth, credential);
            const user = result.user;
            const uid = user.uid;

            // Extraire le prénom et nom du displayName
            const displayName = user.displayName || '';
            const nameParts = displayName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            console.log('💾 Saving user to Firestore...');
            await setDoc(doc(db, "users", uid), {
              email: user.email,
              firstName: firstName,
              lastName: lastName,
              birthDate: '',
              createdAt: new Date(),
              familyId: null,
            }, { merge: true });

            console.log("✅ Connexion Google réussie");
          } catch (error) {
            console.error('❌ Google sign-in error:', error);
            Alert.alert('Erreur', 'Impossible de finaliser la connexion. Veuillez réessayer.');
          }
        })();
      } else {
        console.log('❌ No ID token in response');
        Alert.alert('Erreur', 'Aucun token reçu de Google.');
      }
    } else if (response?.type === 'error') {
      console.error('❌ Google auth error:', response.error);
      Alert.alert('Erreur', 'Échec de la connexion Google. Veuillez réessayer.');
    } else if (response?.type === 'cancel') {
      console.log('⚠️ Google auth cancelled');
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
       // Sur le web, utiliser signInWithPopup directement
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const uid = user.uid;

        // Extraire le prénom et nom du displayName
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        console.log('💾 Saving user to Firestore...');
        await setDoc(doc(db, "users", uid), {
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          birthDate: '',
          createdAt: new Date(),
          familyId: null,
        }, { merge: true });

        console.log("✅ Connexion Google réussie");
      } catch (err: any) {
        console.error('❌ Google sign-in error:', err);
        Alert.alert('Erreur', 'Impossible de finaliser la connexion. Veuillez réessayer.');
      }
    } else {
      // Sur mobile, utiliser expo-auth-session
      try {
        await promptAsync();
      } catch (err: any) {
        console.warn('Google sign-in error', err);
        Alert.alert('Erreur', err.message || String(err));
      }
    }
  };

  return (
    <View className="flex-1">
      {/* BACKGROUND uniquement (plus large + décalé, sans bouger l'écran) */}
      <View className="absolute inset-0 overflow-hidden">
        <ImageBackground
          source={fond_etoile_app}
          resizeMode="cover"
          className="w-[120%] h-full -ml-20"
        />
      </View>

      {/* CONTENU (centré comme avant) */}
      <View className="flex-1 justify-center px-6">
        <Image source={Mascotte_Happy} className="w-36 h-36 self-center" contentFit="contain" />

        <ThemedText
          type="title"
          className="text-5xl text-[#FF914D] text-center mb-2 mt-2"
        >
          Daily Nest
        </ThemedText>

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

        <View className="mt-3 space-y-2 pl-1">
          <View className="flex-row items-center">
            <Checkbox
              value={rememberMe}
              onValueChange={setRememberMe}
              color={rememberMe ? "#FF914D" : undefined}
            />
            <Text className="ml-2 text-sm text-neutral-700">Se souvenir de moi</Text>
          </View>

          <TouchableOpacity onPress={() => setResetPasswordModalVisible(true)}>
            <Text className="text-sm text-[#FF914D] font-semibold">Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

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
      <Modal
        transparent
        animationType="fade"
        visible={resetPasswordModalVisible}
        onRequestClose={() => setResetPasswordModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-2xl p-6 space-y-4">
            <ThemedText type="title" className="text-2xl text-center">Réinitialiser</ThemedText>
            <Text className="text-sm text-neutral-700">
              Entrez l'email associé à votre compte pour recevoir un lien de réinitialisation.
            </Text>
            <TextInput
              className="h-12 rounded-2xl border px-4 text-base bg-white text-neutral-900 border-black/10 focus:border-[#FF914D]"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={resetEmail}
              onChangeText={(text) => {
                setResetEmail(text);
                setResetError("");
              }}
              autoCapitalize="none"
            />
            {resetError ? (
              <Text className="text-red-500 text-xs">{resetError}</Text>
            ) : null}
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={() => setResetPasswordModalVisible(false)}>
                <Text className="text-sm text-neutral-600">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendResetPassword}>
                <Text className="text-sm text-[#FF914D] font-semibold">Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
