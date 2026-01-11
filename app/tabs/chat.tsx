import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from 'react-native';
import ChatHome from "../screens/ChatScreen";
import ConversationScreen from "../screens/ConversationScreen";

export type RootStackParamList = {
  ChatHome: undefined;
 Conversation: { conversationId: string; user: { email: string; avatar?: string | null } };};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
    initialRouteName="ChatHome" screenOptions={{ headerShown: true }}>
      
      <Stack.Screen 
        name="ChatHome"
        component={ChatHome}
        options={({ navigation }) => ({
          headerTitle: "Messages",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'Shrikhand_400Regular',
            fontSize: 28,
            color: "#FF8C42",
          },
          // C'EST ICI QUE TU AJOUTES TON BOUTON RETOUR PERSONNALISÉ
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={{ marginLeft: 16 }} // Ajuste si nécessaire
            >
              <Ionicons 
                name="arrow-back" 
                size={25}        // ✅ Taille 40px demandée
                color="#6DDB31"  // ✅ Couleur verte (Ton vert habituel)
              />
            </TouchableOpacity>
          ),
        })}
      />
      
      <Stack.Screen 
      name="Conversation" 
      component={ConversationScreen} 
      options={({ navigation }) => ({
          headerTitle: "Conversation",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: 'Shrikhand_400Regular',
            fontSize: 24,
            color: "#FF8C42",
          },
          // C'EST ICI QUE TU AJOUTES TON BOUTON RETOUR PERSONNALISÉ
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={{ marginLeft: 16 }} // Ajuste si nécessaire
            >
              <Ionicons 
                name="arrow-back" 
                size={25}        // ✅ Taille 40px demandée
                color="#6DDB31"  // ✅ Couleur verte (Ton vert habituel)
              />
            </TouchableOpacity> 
          ),
        })}
      />
    </Stack.Navigator>
  );
}