import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatHome from "../screens/ChatScreen";
import ConversationScreen from "../screens/ConversationScreen";

export type RootStackParamList = {
  ChatHome: undefined;
 Conversation: { conversationId: string; user: { email: string; avatar?: string | null } };};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="ChatHome" screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="ChatHome"
        component={ChatHome}
        options={{ title: "Chat" }}
      />
       <Stack.Screen name="Conversation" component={ConversationScreen} />
    </Stack.Navigator>
  );
}