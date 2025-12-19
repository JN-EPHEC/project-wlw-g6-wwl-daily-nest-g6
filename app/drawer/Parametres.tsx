import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
  const [role, setRole] = useState<"parents" | "children">("parents");

  // modals
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  // privacy & notif
  const [privacyShare, setPrivacyShare] = useState(false);
  const [notifOptions, setNotifOptions] = useState({ tasks: false, chat: false, reminders: false });

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
      setRole(data.role === "children" ? "children" : "parents");
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
    const unsub = onSnapshot(q, (snap) => {
      setFamilies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.email]);

  // save settings
  const saveBasicSettings = async () => {
    if (!uid) return;
    try {
      await updateDoc(userRef(uid), {
        role,
        privacy: { shareData: privacyShare },
        notif: notifOptions,
      });
      Alert.alert("Succès", "Paramètres sauvegardés");
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de sauvegarder");
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

        {/* Role Picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rôle dans la famille</Text>
          <Text style={styles.smallText}>Choisis un rôle pour ton profil</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={role} onValueChange={(v) => setRole(v as any)}>
              <Picker.Item label="Parents" value="parents" />
              <Picker.Item label="Enfants" value="children" />
            </Picker>
          </View>
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
});