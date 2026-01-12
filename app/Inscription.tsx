import { Ionicons } from "@expo/vector-icons";
import MascottePhoto from "assets/images/Mascotte_Photo_1.png";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../firebaseConfig";


export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [nameFormatError, setNameFormatError] = useState(false);
  const [lastNameFormatError, setLastNameFormatError] = useState(false);
  const [emailFormatError, setEmailFormatError] = useState(false);
  const [birthDateFormatError, setBirthDateFormatError] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [passwordFormatError, setPasswordFormatError] = useState(false);

  const handleSignUp = async () => {
    setErrorMessage("");
    setEmailError(false);
    setPasswordError(false);
    setNameError(false);
    setLastNameError(false);

    let hasError = false;
    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    }
    // Vérifier: min 6 caractères, 1 chiffre, 1 majuscule
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    if (password.length < 6 || !hasNumber || !hasUpperCase) {
      setPasswordError(true);
      hasError = true;
    }

    if (!firstName.trim()) {
      setNameError(true);
      hasError = true;
    }
    if (!lastName.trim()) {
      setLastNameError(true);
      hasError = true;
    }
    if (!termsAccepted) {
      setTermsError(true);
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(
        doc(db, "users", newUser.uid),
        {
          uid: newUser.uid,
          email: newUser.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthDate: birthDate || null,
          createdAt: Date.now(),

          // 👇 AJOUTS pour l’onboarding premium
          onboardingPremiumSeen: false,
          isPremium: false,
        },
        { merge: true }
      );

      console.log("Utilisateur créé dans Firestore avec UID:", newUser.uid);

      router.replace("/OnboardingPremium");
    } catch (error: any) {
      if (error.code == "auth/invalid-email") {
        setErrorMessage("Email ou mot de passe incorrect");
      } else if (error.code == "auth/email-already-in-use") {
        setErrorMessage("Cet email est déjà utilisé");
      } else {
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowWelcome(false);
    router.replace("/OnboardingPremium");
  };

return (
  <View className="flex-1 bg-white">
    {/* Header (back) */}
    <View className="pt-6 px-5">
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
       
      >
        <Ionicons name="arrow-back" size={22} color="#FF914D" />
      </TouchableOpacity>
    </View>
 <Text className="text-[28px] font-bold text-[#FF914D] text-center mb-2 mt-6"
      style ={{ fontFamily: "Shrikhand_400Regular" }}>
        Création de compte
      </Text>
    {/* Content */}
    <View className="flex-1 px-6 pt-2">
      {/* Mascotte (optionnel) */}
      {/* Si tu as une image mascotte, importe Image et remplace ce bloc */}
      <View className="items-center mb-6 mt-2">
        <View className="w-28 h-28 rounded-full bg-[#EEFAE6] self-center items-center justify-center">
           <Image
            source={MascottePhoto}
            className="w-24 h-24 self-center" contentFit="contain" 
      
    />
        </View>
      </View>

    

      {/* Inputs */}
      <View className="w-full">
        {/* Prénom */}
        <TextInput
          className={`h-12 rounded-full border px-5 text-[16px] bg-white text-[#111827] ${
            nameError || nameFormatError ? "border-red-500" : "border-[#FF914D]"
          }`}
          placeholder="Prénom..."
          placeholderTextColor="#9CA3AF"
          value={firstName}
          maxLength={50}
          onChangeText={(text) => {
            const filteredText = text.replace(/[^a-zA-ZÀ-ÿ\s-]/g, "");
            setNameFormatError(text !== filteredText);
            setFirstName(filteredText);
            setNameError(false);
          }}
        />
        {(nameError || nameFormatError) && (
          <Text className="text-red-500 text-[13px] mt-2 ml-2">
            {nameError ? "Cette case doit être remplie" : "Seules les lettres et accents sont autorisés"}
          </Text>
        )}

        {/* Nom */}
        <TextInput
          className={`h-12 rounded-full border px-5 text-[16px] bg-white text-[#111827] mt-4 ${
            lastNameError || lastNameFormatError ? "border-red-500" : "border-[#FF914D]"
          }`}
          placeholder="Nom de famille..."
          placeholderTextColor="#9CA3AF"
          value={lastName}
          maxLength={50}
          onChangeText={(text) => {
            const filteredText = text.replace(/[^a-zA-ZÀ-ÿ\s-]/g, "");
            setLastNameFormatError(text !== filteredText);
            setLastName(filteredText);
            setLastNameError(false);
          }}
        />
        {(lastNameError || lastNameFormatError) && (
          <Text className="text-red-500 text-[13px] mt-2 ml-2">
            {lastNameError ? "Cette case doit être remplie" : "Seules les lettres et accents sont autorisés"}
          </Text>
        )}

        {/* Email */}
        <TextInput
          className={`h-12 rounded-full border px-5 text-[16px] bg-white text-[#111827] mt-4 ${
            emailError || emailFormatError ? "border-red-500" : "border-[#FF914D]"
          }`}
          placeholder="Email..."
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(false);
            setEmailFormatError(text.length > 0 && !text.includes("@"));
          }}
          autoCapitalize="none"
        />
        {(emailError || emailFormatError) && (
          <Text className="text-red-500 text-[13px] mt-2 ml-2">
            {emailError ? "Cette case doit être remplie" : "L'email doit contenir un @xxx.xx"}
          </Text>
        )}

        {/* Mot de passe */}
        <TextInput
          className={`h-12 rounded-full border px-5 text-[16px] bg-white text-[#111827] mt-4 ${
            passwordError || passwordFormatError ? "border-red-500" : "border-[#FF914D]"
          }`}
          placeholder="Mot de passe..."
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError(false);

            const hasNumber = /\d/.test(text);
            const hasUpperCase = /[A-Z]/.test(text);
            setPasswordFormatError(text.length > 0 && (text.length < 6 || !hasNumber || !hasUpperCase));
          }}
          secureTextEntry
        />
        {(passwordError || passwordFormatError) && (
          <Text className="text-red-500 text-[13px] mt-2 ml-2">
            {passwordError
              ? "Le mot de passe doit contenir au moins 6 caractères, 1 chiffre et 1 majuscule"
              : "Min 6 caractères, 1 chiffre et 1 majuscule requis"}
          </Text>
        )}

        {/* Date */}
        <TextInput
          className={`h-12 rounded-full border px-5 text-[16px] bg-white text-[#111827] mt-4 ${
            birthDateFormatError ? "border-red-500" : "border-[#FF914D]"
          }`}
          placeholder="JJ/MM/AAAA"
          placeholderTextColor="#9CA3AF"
          value={birthDate}
          keyboardType="numeric"
          maxLength={10}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, "");
            let formatted = digits;

            if (digits.length > 2 && digits.length <= 4) {
              formatted = digits.slice(0, 2) + "/" + digits.slice(2);
            } else if (digits.length > 4) {
              formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8);
            }

            setBirthDate(formatted);

            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (formatted.length > 0 && formatted.length < 10) setBirthDateFormatError(true);
            else if (formatted.length === 10 && !dateRegex.test(formatted)) setBirthDateFormatError(true);
            else setBirthDateFormatError(false);
          }}
        />
        {birthDateFormatError && (
          <Text className="text-red-500 text-[13px] mt-2 ml-2">
            Format attendu: JJ/MM/AAAA
          </Text>
        )}
      </View>

      {/* Terms */}
      <View className="flex-row items-start mt-6">
        <TouchableOpacity
          onPress={() => {
            setTermsAccepted(!termsAccepted);
            setTermsError(false);
          }}
          activeOpacity={0.8}
          className="mr-3 mt-0.5"
        >
          <Ionicons
            name={termsAccepted ? "checkbox" : "square-outline"}
            size={26}
            color={termsError ? "red" : "#60AFDF"}
          />
        </TouchableOpacity>

        <Text className={`flex-1 text-[13px] leading-5 ${termsError ? "text-red-500" : "text-neutral-600"}`}>
          J'ai lu et j’accepte les{" "}
          <Text className="text-[#60AFDF] underline font-semibold" onPress={() => router.push("/ConditionsUtilisation")}>
            Conditions d'utilisation
          </Text>{" "}
          et la{" "}
          <Text className="text-[#60AFDF] underline font-semibold" onPress={() => router.push("/PolitiqueConfidentialite")}>
            Politique de confidentialité
          </Text>
          .
        </Text>
      </View>

      {termsError && (
        <Text className="text-red-500 text-[13px] mt-2">
          Vous devez accepter les conditions pour continuer
        </Text>
      )}

      {/* CTA */}
      {(() => {
        const hasNumber = /\d/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const isPasswordValid = password.length >= 6 && hasNumber && hasUpperCase;

        const isFormValid =
          firstName.trim() !== "" &&
          lastName.trim() !== "" &&
          email.trim() !== "" &&
          email.includes("@") &&
          isPasswordValid &&
          termsAccepted &&
          !nameFormatError &&
          !lastNameFormatError &&
          !emailFormatError &&
          !birthDateFormatError;

        return (
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading || !isFormValid}
            activeOpacity={0.9}
            className={`mt-7 h-12 rounded-full items-center justify-center ${
              !isFormValid ? "bg-[#F2A167]/40" : "bg-[#F2A167]"
            }`}
          >
            <Text className="text-white font-semibold text-[16px]">
              S’inscrire
            </Text>
          </TouchableOpacity>
        );
      })()}

      {/* Link */}
      <TouchableOpacity
        onPress={() => router.push("/auth")}
        className="items-center mt-5"
        activeOpacity={0.8}
      >
        <Text className="text-[13px] text-[#FF914D] underline text">
          Vous avez déjà un compte ?
        </Text>
      </TouchableOpacity>

      {!!errorMessage && (
        <Text className="text-red-500 text-center mt-4">{errorMessage}</Text>
      )}
    </View>
  </View>
);

}
