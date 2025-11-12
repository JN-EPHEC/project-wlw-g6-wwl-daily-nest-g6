import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import Rappels from "../tabs/Rappels";
import Recompense from "../tabs/Recompense";
import ToDo from "../tabs/ToDo";
import chat from "../tabs/chat";
import popUpRac from "../tabs/popUpRac";
export type TabMenuParamList = {
  Rappels: undefined;
  ToDo: undefined;
  Recompense: undefined;
  chat: undefined;
  popUpRac: undefined;
  Accueil: undefined
};

const Tab = createBottomTabNavigator<TabMenuParamList>();

export default function Acceuil() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Rappels" component={Rappels} />
      <Tab.Screen name="ToDo" component={ToDo} />
      <Tab.Screen name="Recompense" component={Recompense} />
      <Tab.Screen name="chat" component={chat} />
      <Tab.Screen name="popUpRac" component={popUpRac} />
    </Tab.Navigator>
  );
}
