import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

type Router = ReturnType<typeof useRouter>;

export async function performLogout(router: Router) {
  await signOut(auth);
  router.replace("/auth");
}

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function LogoutModal({ visible, onClose, onConfirm }: LogoutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm bg-white rounded-2xl p-6">

          <View className="w-32 h-32 overflow-hidden rounded-full  items-center justify-center self-center mb-4">
            <Image
              source={require("../../assets/images/Bonhomme_triste_deco.png")}
              style={{ width: "100%", height: "100%", resizeMode: "contain" }}
            />
          </View>

          <Text className="text-lg font-semibold text-gray-900 text-center">
            Voulez-vous vraiment vous déconnecter ?
          </Text>

          <Text className="text-sm text-gray-500 text-center mt-2 mb-6">
            Vous pourrez vous reconnecter à tout moment.
          </Text>

          <View className="gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full py-4 bg-[#F64040]"
            >
              <Text className="text-white text-center font-semibold">
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="rounded-full py-4 border border-gray-200 bg-white"
            >
              <Text className="text-[#F64040] text-center font-semibold">
                Se déconnecter
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

export default function Deconnexion() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = async () => {
    await performLogout(router);
    setShowModal(false);
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="rounded-full px-8 py-4 bg-gray-100 border border-gray-200"
      >
        <Text className="text-gray-800 font-semibold text-base">
          Se déconnecter
        </Text>
      </TouchableOpacity>

      <LogoutModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
}
