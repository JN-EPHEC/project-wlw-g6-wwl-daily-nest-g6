import { auth, db } from '@/firebaseConfig';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import {
  // FacebookAuthProvider, // Décommenté quand Facebook Login sera prêt
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


export default function AuthComponent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
   const [passwordControle, setPasswordControle] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState ("");
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
    if (error.code == 'auth/invalid-email') {
      setErrorMessage("Email ou mot de passe incorrect");
    } else {
      setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  } finally {
    setLoading(false);
  }
};

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre adresse email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      Alert.alert(
        "Email envoyé",
        "Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception."
      );
      setResetPasswordModalVisible(false);
      setResetEmail("");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/user-not-found") {
        Alert.alert("Erreur", "Aucun compte n'existe avec cette adresse email");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Erreur", "Adresse email invalide");
      } else {
        Alert.alert("Erreur", "Impossible d'envoyer l'email de réinitialisation");
      }
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
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenu sur Daily Nest !</Text>
      <TextInput
        style={[styles.input, emailError && { borderColor: "red" }]}
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text); 
          setEmailError(false);
        }}
        autoCapitalize="none"
      />
      {emailError && (
        <Text style={styles.fieldError}>Cette case doit être remplie</Text>
      )}
      <TextInput
        style={[styles.input, passwordError && { borderColor: "red" }]}
        placeholder="Mot de passe"
        value={password}
        onChangeText={(text) => {
          setPassword(text); 
          setPasswordError(false);
        }}
        secureTextEntry
      />
      {passwordError && (
        <Text style={styles.fieldError}>Le mot de passe doit contenir au moins 6 caractères</Text>
      )}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {/* Checkbox Se souvenir de moi */}
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => setRememberMe(!rememberMe)}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Se souvenir de moi</Text>
      </TouchableOpacity>

      {/* Lien Mot de passe oublié */}
      <TouchableOpacity onPress={() => setResetPasswordModalVisible(true)}>
        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSignIn} style={styles.signUpButton}>
          <Text style={styles.signUpText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/Inscription")} style={styles.signUpButton}>
          <Text style={styles.signUpText}>S'inscrire</Text>
          </TouchableOpacity> 
        <TouchableOpacity onPress={handleGoogleSignIn} style={[styles.signUpButton, { backgroundColor: "#DB4437" }]}>
          <Text style={styles.signUpText}>Google</Text>
        </TouchableOpacity>
        {/* Bouton Facebook - Décommenté quand Facebook Login sera prêt */}
        {/* <TouchableOpacity onPress={handleFacebookSignIn} style={[styles.signUpButton, { backgroundColor: "#1877F2" }]}>
          <Text style={styles.signUpText}>Facebook</Text>
        </TouchableOpacity> */}
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

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, borderRadius: 20},
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
 
   input: {
  height: 40,
  borderColor: "gray",
  borderWidth: 1,
  marginBottom: 10,
  paddingHorizontal: 10,
  fontStyle: "italic", 
  color: "rgba(100, 100, 100, 0.7)",
  borderRadius: 15

},

  buttonContainer: { flexDirection: "row", justifyContent: "space-around", marginTop: 20, alignItems: "center"},
  signUpText: { color: "white", fontWeight: "bold" },
  signUpButton: { backgroundColor: "#00b7ff9a", padding: 10, borderRadius: 5 },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
    
  },
  fieldError: {
    color: "red",
    marginTop: -5,
    marginBottom: 8,
    textAlign: "left",
    fontSize: 13,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#00b7ff9a",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#00b7ff9a",
  },
  checkmark: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
  },
  forgotPasswordText: {
    color: "#00b7ff9a",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  confirmButton: {
    backgroundColor: "#00b7ff9a",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
