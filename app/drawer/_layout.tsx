import { createDrawerNavigator } from "@react-navigation/drawer";
import React from "react";

import Acceuil from "./Acceuil";
import Avantages from "./Avantages";
import Budget from "./Budget";
import Carnetfamiliale from "./Carnetfamiliale";
import Déconnexion from "./Déconnexion";
import Invitation from "./Invitation";
import ListeCourse from "./ListeCourse";
import MonProfil from "./MonProfil";
import Paramètres from "./Paramètres";



export type DrawerMenuParamList = {
  Acceuil: undefined;
  Carnetfamiliale: undefined;
  ListeCourse: undefined;
  Budget: undefined;
  Invitation: undefined;
  MonProfil: undefined;
  Paramètres: undefined;
  Avantages: undefined;
  Déconnexion: undefined;

};

const Drawer = createDrawerNavigator<DrawerMenuParamList>();
export default function DrawerNav() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Acceuil" component={Acceuil} />
      <Drawer.Screen name="Carnetfamiliale" component={Carnetfamiliale} />
      <Drawer.Screen name="ListeCourse" component={ListeCourse} />
      <Drawer.Screen name="Budget" component={Budget} />
      <Drawer.Screen name="Invitation" component={Invitation} />
      <Drawer.Screen name="MonProfil" component={MonProfil} />
      <Drawer.Screen name="Paramètres" component={Paramètres} />
      <Drawer.Screen name="Avantages" component={Avantages} />
      <Drawer.Screen name="Déconnexion" component={Déconnexion} />
    </Drawer.Navigator>
  );
}

