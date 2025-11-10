import { Redirect } from "expo-router";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../../firebaseConfig";

export default function Deconnexion() {
  useEffect(() => {
    signOut(auth);
  }, []);

  return <Redirect href="/auth" />;
}
