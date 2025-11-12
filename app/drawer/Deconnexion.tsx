import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function Deconnexion () {

    const router = useRouter();

    const handleSignOut = async () => {
      await signOut(auth);
      router.replace("/auth");
}
return(
  <View>
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Se deconnecter</Text>
    </TouchableOpacity>
  </View>
)
}