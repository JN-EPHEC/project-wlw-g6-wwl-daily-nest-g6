import ThemedText from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import Mascotte_Happy from "assets/images/Mascotte_happy.png";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useRootNavigationState, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import fond_etoile_app from "../assets/images/fond_etoile_app.png";
import { auth, db } from "../firebaseConfig";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_14AcN64ndaKbcOLful8EM00";

export default function OnboardingPremium() {
  const router = useRouter();
  const rootNavState = useRootNavigationState(); // ✅ NEW
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!rootNavState?.key) return; // ✅ attendre que la navigation soit prête

    const u = auth.currentUser;
    if (!u) {
      router.replace("/auth");
      return;
    }

    (async () => {
      try {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(
            userRef,
            {
              email: u.email ?? "",
              createdAt: Date.now(),
              onboardingPremiumSeen: false,
              isPremium: false,
            },
            { merge: true }
          );
        } else {
          const seen = !!snap.data()?.onboardingPremiumSeen;
          if (seen) router.replace("/drawer/Acceuil");
        }
      } catch (e) {
        console.log("OnboardingPremium check error:", e);
      } finally {
        setChecking(false);
      }
    })();
  }, [rootNavState?.key]); // ✅ NEW

  const markSeen = async () => {
    const u = auth.currentUser;
    if (!u) return;
    await updateDoc(doc(db, "users", u.uid), { onboardingPremiumSeen: true });
  };

  const skip = async () => {
    try {
      await markSeen();
    } catch {}
    router.replace("/drawer/Acceuil");
  };

  const startTrial = async () => {
  console.log("✅ startTrial pressed");
  setLoading(true);

  try {
    // (optionnel) tu marques vu direct
    await markSeen();

    // ouverture la + fiable possible
    const can = await Linking.canOpenURL(STRIPE_PAYMENT_LINK);

    if (can) {
      await Linking.openURL(STRIPE_PAYMENT_LINK);
    } else {
      // fallback
      if (Platform.OS !== "web") {
        await WebBrowser.openBrowserAsync(STRIPE_PAYMENT_LINK);
      } else {
        window.location.href = STRIPE_PAYMENT_LINK;
      }
    }

    // ✅ si tu veux aller DIRECT à l'accueil après clic:
    router.replace("/drawer/Acceuil");
  } catch (e: any) {
    console.log("❌ open stripe error:", e?.message || e);
    Alert.alert("Erreur", "Impossible d'ouvrir Stripe.");
  } finally {
    setLoading(false);
  }
};


  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="absolute inset-0 overflow-hidden">
        <ImageBackground
          source={fond_etoile_app}
          resizeMode="cover"
          className="w-[120%] h-full -ml-20"
        />
      </View>

      <View className="flex-1 justify-center px-6">
        <Image source={Mascotte_Happy} className="w-32 h-32 self-center" contentFit="contain" />

        <ThemedText type="title" className="text-4xl text-[#FF914D] text-center mb-2 mt-2">
          Daily Nest Premium
        </ThemedText>

        <ThemedText type="subtitle" className="text-sm text-neutral-600 text-center mb-5">
          1 mois gratuit, puis 6€/mois — annulable à tout moment.
        </ThemedText>

        <View className="bg-white/90 border border-black/10 rounded-2xl p-5">
          <Text className="text-base font-semibold text-neutral-900 mb-4">
            Ce que tu débloques :
          </Text>

          <View className="flex-row items-center mb-3">
            <Ionicons name="people" size={18} color="#FF914D" />
            <Text className="ml-3 text-sm text-neutral-800 flex-1">
              Multi-familles (utile familles séparées)
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="trophy" size={18} color="#FF914D" />
            <Text className="ml-3 text-sm text-neutral-800 flex-1">
              Gamification avancée (badges, niveaux…)
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="time" size={18} color="#FF914D" />
            <Text className="ml-3 text-sm text-neutral-800 flex-1">
              Historique & statistiques (qui fait quoi)
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="repeat" size={18} color="#FF914D" />
            <Text className="ml-3 text-sm text-neutral-800 flex-1">
              Routines + rappels intelligents
            </Text>
          </View>
        </View>

        <View className="mt-4 bg-white/90 border border-[#FF914D]/40 rounded-2xl p-4">
          <Text className="text-sm text-neutral-800 text-center">
            <Text className="font-extrabold text-[#FF914D]">Gratuit</Text> pendant 30 jours
          </Text>
          <Text className="text-sm text-neutral-800 text-center mt-1">
            Ensuite <Text className="font-extrabold text-[#FF914D]">6€ / mois</Text>
          </Text>
        </View>

        <View className="w-full mt-6 space-y-3">
          <TouchableOpacity
            onPress={startTrial}
            disabled={loading}
            className={`h-12 rounded-full bg-[#F2A167] items-center justify-center flex-row ${
              loading ? "opacity-70" : ""
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Commencer l’essai gratuit
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={skip} className="items-center">
            <Text className="text-sm text-neutral-700 font-semibold">Plus tard</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-neutral-500 text-center mt-4">
          🔒 Paiement sécurisé par Stripe (mode test) — aucun débit réel.
        </Text>
      </View>
    </View>
  );
}
