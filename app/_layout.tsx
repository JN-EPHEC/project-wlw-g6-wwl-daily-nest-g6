import { createDrawerNavigator } from "@react-navigation/drawer";
import React from "react";
import Avantages from "./drawer/Avantages";
import Budget from "./drawer/Budget";
import Carnetfamiliale from "./drawer/Carnetfamiliale";
import Deconnexion from "./drawer/Deconnexion";
import Invitation from "./drawer/Invitation";
import ListeCourse from "./drawer/ListeCourse";
import Parametres from "./drawer/Parametres";
import profil from "./drawer/profil";
import Acceuil from "./tabs/_layout";

export type DrawerMenuParamList = {
  Accueil: undefined;
  Carnetfamiliale: undefined;
  ListeCourse: undefined;
  Budget: undefined;
  Invitation: undefined;
  profil: undefined;
  Parametres: undefined;
  Avantages: undefined;
  Deconnexion: undefined;
};

const Drawer = createDrawerNavigator<DrawerMenuParamList>();

export default function DrawerNav() {
  return (
  <Drawer.Navigator>
      <Drawer.Screen name="Accueil" component={Acceuil} options={{title: "Accueil"}}/>

      <Drawer.Screen name="Carnetfamiliale" component={Carnetfamiliale}
        options={{title: "Carnet Familial"}}/>

      <Drawer.Screen name="ListeCourse" component={ListeCourse}
        options={{title: "Liste de Courses"}}/>

      <Drawer.Screen name="Budget" component={Budget} 
      options={{title: "Budget",}}/>

      <Drawer.Screen name="Invitation" component={Invitation}
        options={{title: "Invitations"}}/>
    
      <Drawer.Screen name="profil" component={profil}
        options={{title:"Profil" }}/>  

       <Drawer.Screen name="Parametres" component={Parametres}
        options={{title:"Parametres" }}/>  

      <Drawer.Screen name="Avantages" component={Avantages}
        options={{title:"Avantges" }}/>  
      
      <Drawer.Screen name="Deconnexion" component={Deconnexion}
        options={{title:"Deconnexion" }}/>
    </Drawer.Navigator>
  );
}


