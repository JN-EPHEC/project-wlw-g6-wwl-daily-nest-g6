import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import Home from "../tabs/Home";
import popUpRac from "../tabs/popUpRac";
import Budget from "./Budget";
import ListeCourse from "./ListeCourse";
import profil from "./profil";

export type TabMenuParamList = {

  Home: undefined;
  Budget: undefined; 
  popUpRac: undefined;
  ListeCourse: undefined;
  profil: undefined;


 
};

const Tab = createBottomTabNavigator<TabMenuParamList>();
export default function Acceuil () {
  return (
    <Tab.Navigator screenOptions={{headerShown: false, }}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Budget" component={Budget} />
       <Tab.Screen name="popUpRac" component={popUpRac} />
      <Tab.Screen name="ListeCourse" component={ListeCourse} />
      <Tab.Screen name="profil" component={profil} />

     

    </Tab.Navigator>
  );
}