import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import Home from "./Home";
import Rappels from "./Rappels";
import Recompense from "./Recompense";
import ToDo from "./ToDo";
import chat from "./chat";
import popUpRac from "./popUpRac";




export type TabMenuParamList = {
  Home: undefined;
  Rappels: undefined;
  ToDo: undefined;
  Recompense: undefined;
  chat: undefined;
  popUpRac: undefined;
 
};

const Tab = createBottomTabNavigator<TabMenuParamList>();
export default function Acceuil () {
  return (
    <Tab.Navigator screenOptions={{headerShown: false, }}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Rappels" component={Rappels} />
      <Tab.Screen name="ToDo" component={ToDo} />
      <Tab.Screen name="Recompense" component={Recompense} />
      <Tab.Screen name="chat" component={chat} />
      <Tab.Screen name="popUpRac" component={popUpRac} />

    </Tab.Navigator>
  );
}