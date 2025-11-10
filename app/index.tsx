import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";

export default function Index() {
const [loading, setLoading] = useState(true);
const [user, setUser] = useState<any>(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setLoading(false);
  });
  
  return unsubscribe();
}, []);

if (loading) {
  return null;
}

if (user) {
  return <Redirect href="../drawer.Acceuil" />;
}
  return <Redirect href="./login" />;

};