import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export function Parametres() {
  const navigation = useNavigation() as any;

  const [families, setFamilies] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // user data
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "" });
  const [familyRoles, setFamilyRoles] = useState<{ [familyId: string]: "parents" | "children" }>({});

  // modals
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // privacy & notif
  const [privacyShare, setPrivacyShare] = useState(false);
  const [notifOptions, setNotifOptions] = useState({ tasks: false, chat: false, reminders: false });

  // password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const userRef = (id: string) => doc(db, "users", id);

  // auth + load user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUid(null);
        setUser(null);
        setLoading(false);
        return;
      }
      setUid(u.uid);
      setUser(u);
      await loadUser(u.uid);
    });
    return () => unsub();
  }, []);

  const loadUser = async (id: string) => {
    setLoading(true);
    try {
      const snap = await getDoc(userRef(id));
      if (!snap.exists()) {
        await setDoc(userRef(id), { createdAt: new Date().toISOString() });
        setProfile({ firstName: "", lastName: "", email: auth.currentUser?.email || "" });
        setLoading(false);
        return;
      }
      const data = snap.data();
      setProfile({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || auth.currentUser?.email || "",
      });
      setPrivacyShare(!!data?.privacy?.shareData);
      setNotifOptions({
        tasks: !!data?.notif?.tasks,
        chat: !!data?.notif?.chat,
        reminders: !!data?.notif?.reminders,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // load families
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "families"), where("members", "array-contains", user.email));
    const unsub = onSnapshot(q, async (snap) => {
      const familiesData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFamilies(familiesData);
      
      // Load roles for each family
      const roles: { [familyId: string]: "parents" | "children" } = {};
      for (const family of familiesData) {
        const familyDoc = await getDoc(doc(db, "families", family.id));
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          const memberRole = familyData?.memberRoles?.[user.email];
          roles[family.id] = memberRole === "children" ? "children" : "parents";
        }
      }
      setFamilyRoles(roles);
    });
    return () => unsub();
  }, [user?.email]);

  // save settings
  const saveBasicSettings = async () => {
    if (!uid || !user?.email) return;
    try {
      // Save roles for each family
      for (const familyId in familyRoles) {
        const familyRef = doc(db, "families", familyId);
        await updateDoc(familyRef, {
          [`memberRoles.${user.email.replace(/\./g, '_')}`]: familyRoles[familyId]
        });
      }
      
      await updateDoc(userRef(uid), {
        privacy: { shareData: privacyShare },
        notif: notifOptions,
      });
      Alert.alert("Succès", "Paramètres sauvegardés");
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de sauvegarder");
    }
  };

  const handleChangePassword = async () => {
    if (!uid || !user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erreur", "Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    try {
      // Réauthentifier l'utilisateur
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Mettre à jour le mot de passe
      await updatePassword(user, newPassword);

      Alert.alert("Succès", "Mot de passe modifié avec succès");
      setPasswordVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        Alert.alert("Erreur", "Mot de passe actuel incorrect");
      } else if (err.code === "auth/requires-recent-login") {
        Alert.alert("Erreur", "Pour des raisons de sécurité, veuillez vous reconnecter avant de changer votre mot de passe");
      } else {
        Alert.alert("Erreur", "Impossible de modifier le mot de passe");
      }
    }
  };


  const goToProfile = () => navigation.navigate("profil");
  const goToFamily = () => navigation.navigate("Famille");

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.screen}>
        {/* Profile */}
        <TouchableOpacity style={styles.cardRow} onPress={goToProfile}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="person-circle" size={80} color="#00b7ff9a" />
            <Text style={styles.title}>Mon Profil</Text>
          </View>
        </TouchableOpacity>

        {/* Familles */}
        <TouchableOpacity style={styles.cardRow} onPress={goToFamily}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Familles</Text>
            <Text style={styles.rowSub}>Gérer les familles et membres</Text>
            <View style={{ flexDirection: "row", marginTop: 6, gap: 6 }}>
              {families.map((f) => (
                <Ionicons key={f.id} name="people-circle" size={30} color="#00b7ff9a" />
              ))}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Role per Family */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rôle dans chaque famille</Text>
          <Text style={styles.smallText}>Choisis ton rôle pour chaque famille</Text>
          
          {families.length === 0 ? (
            <Text style={styles.noFamilyText}>Tu n'appartiens à aucune famille pour le moment</Text>
          ) : (
            families.map((family) => (
              <View key={family.id} style={styles.familyRoleCard}>
                <Text style={styles.familyName}>{family.name || "Famille"}</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={familyRoles[family.id] || "parents"}
                    onValueChange={(v) => setFamilyRoles(prev => ({ ...prev, [family.id]: v as any }))}
                  >
                    <Picker.Item label="Parents" value="parents" />
                    <Picker.Item label="Enfants" value="children" />
                  </Picker>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Notifications */}
        <TouchableOpacity style={styles.cardRow} onPress={() => setNotifVisible(true)}>
          <View>
            <Text style={styles.rowTitle}>Notifications</Text>
            <Text style={styles.rowSub}>Gérer les alertes et rappels</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Privacy */}
        <TouchableOpacity style={styles.cardRow} onPress={() => setPrivacyVisible(true)}>
          <View>
            <Text style={styles.rowTitle}>Confidentialité</Text>
            <Text style={styles.rowSub}>Gérer la visibilité et le partage des données</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Mot de passe */}
        <TouchableOpacity style={styles.cardRow} onPress={() => setPasswordVisible(true)}>
          <View>
            <Text style={styles.rowTitle}>Mot de passe</Text>
            <Text style={styles.rowSub}>Modifier votre mot de passe</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Save button */}
        <View style={{ marginTop: 18, alignItems: "flex-end" }}>
          <TouchableOpacity style={styles.saveSmallBtn} onPress={saveBasicSettings}>
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.saveSmallText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Modal */}
        <Modal visible={privacyVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Confidentialité</Text>
                <TouchableOpacity onPress={() => setPrivacyVisible(false)}>
                  <Ionicons name="close" size={22} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalText}>
                Nous respectons votre vie privée. Les données de base (nom, email, rôle) sont utilisées pour
                personnaliser l'expérience. En activant le partage, d'autres membres de la famille pourront voir
                certaines informations de votre profil (prénom, rôle).
              </Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Partager mon profil avec la famille</Text>
                <Switch value={privacyShare} onValueChange={setPrivacyShare} />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.iconClose} onPress={() => setPrivacyVisible(false)}>
                  <Ionicons name="close" size={18} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={async () => {
                    if (!uid) return;
                    try {
                      await updateDoc(userRef(uid), { privacy: { shareData: privacyShare } });
                      setPrivacyVisible(false);
                      Alert.alert("Succès", "Confidentialité sauvegardée");
                    } catch (err) {
                      console.error(err);
                      Alert.alert("Erreur", "Impossible de sauvegarder");
                    }
                  }}
                >
                  <Text style={styles.modalSaveText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Notifications Modal */}
        <Modal visible={notifVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setNotifVisible(false)}>
                  <Ionicons name="close" size={22} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalText}>
                Activez les notifications que vous souhaitez recevoir : tâches assignées, messages de la famille,
                et rappels importants.
              </Text>
              {["tasks", "chat", "reminders"].map((key) => (
                <View key={key} style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    {key === "tasks" ? "Tâches assignées" : key === "chat" ? "Messages (chat)" : "Rappels"}
                  </Text>
                  <Switch
                    value={notifOptions[key as keyof typeof notifOptions]}
                    onValueChange={(v) => setNotifOptions((s) => ({ ...s, [key]: v }))}
                  />
                </View>
              ))}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.iconClose} onPress={() => setNotifVisible(false)}>
                  <Ionicons name="close" size={18} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={async () => {
                    if (!uid) return;
                    try {
                      await updateDoc(userRef(uid), { notif: notifOptions }); 
                      setNotifVisible(false);
                      Alert.alert("Succès", "Notifications sauvegardées");
                    } catch (err) {
                      console.error(err);
                      Alert.alert("Erreur", "Impossible de sauvegarder");
                    }
                  }}
                >
                  <Text style={styles.modalSaveText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Password Modal */}
        <Modal visible={passwordVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modifier le mot de passe</Text>
                <TouchableOpacity onPress={() => {
                  setPasswordVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}>
                  <Ionicons name="close" size={22} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalText}>
                Pour des raisons de sécurité, vous devez entrer votre mot de passe actuel.
              </Text>
              <View style={{ marginTop: 15 }}>
                <Text style={styles.inputLabel}>Mot de passe actuel</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mot de passe actuel"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
                <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirmer le nouveau mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.iconClose} onPress={() => {
                  setPasswordVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}>
                  <Ionicons name="close" size={18} color="#444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.modalSaveText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}

const Stack = createNativeStackNavigator();
export default function () {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfilMain"
        component={Parametres}
        options={({ navigation }) => ({
          headerTitle: "Mes paramètres",
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={26} style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f8fa", paddingBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16 },

  cardRow: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  title: { fontSize: 20, fontWeight: "700", color: "#222" },
  rowTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  rowSub: { fontSize: 13, color: "#666", marginTop: 4 },
  sectionTitle: { fontWeight: "700", marginBottom: 6 },
  smallText: { color: "#666", fontSize: 12, marginBottom: 8 },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
  },

  familyRoleCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  familyName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  noFamilyText: {
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
    fontSize: 13,
  },

  saveSmallBtn: {
    backgroundColor: "#2d9cdb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveSmallText: { color: "white", fontWeight: "600", fontSize: 14 },

  // modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "95%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalText: { color: "#555", marginTop: 12, lineHeight: 22 },

  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  switchLabel: { color: "#333" },

  modalActions: { marginTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconClose: {
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 10,
  },
  modalSaveBtn: {
    backgroundColor: "#ffb700",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalSaveText: { color: "#222", fontWeight: "700" },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#f9f9f9",
  },
});