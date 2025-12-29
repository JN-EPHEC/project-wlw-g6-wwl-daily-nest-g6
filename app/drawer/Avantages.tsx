import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from "react";
import { FlatList, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Avantage = {
  id: string;
  title: string;
  article: string;
  partnerLink: string;
  discount: string;
};


const avantages = [
 {
    id: '1',
    title: 'Communication Parents-Enfants',
    article: `Comprendre les émotions de votre enfant est essentiel pour améliorer la relation familiale. 
Grâce à des conseils pratiques et des exercices simples, vous pourrez mieux écouter votre enfant, reconnaître ses sentiments et répondre de manière adaptée. 
Ces petites actions quotidiennes favorisent un climat de confiance et réduisent les conflits.`,
    partnerLink: 'https://www.pedagogue-exemple.com',
    discount: 'Bénéficiez de -15% chez PsychéFamille',
  },
  {
    id: '2',
    title: 'Sorties et Activités Familiales',
    article: `Organiser des sorties régulières avec vos enfants favorise leur développement et renforce les liens familiaux. 
Découvrez des idées d’activités adaptées à chaque âge, que ce soit des sorties culturelles, sportives ou créatives. 
En suivant ces suggestions, vous offrez à votre enfant des expériences enrichissantes et mémorables.`,
    partnerLink: 'https://www.waibi.com',
    discount: 'Bénéficiez de -20% chez Waibi',
  },
  {
    id: '3',
    title: 'Bien-être Émotionnel',
    article: `Apprendre à gérer ses émotions est important pour toute la famille. 
Cette section vous propose des techniques simples de relaxation, de respiration et de gestion du stress adaptées aux parents et aux enfants. 
Ces outils permettent de créer un environnement familial serein et équilibré.`,
    partnerLink: 'https://www.psychofamille.com',
    discount: 'Consultation découverte offerte',
  },
  {
    id: '4',
    title: 'Gestion des Écrans',
    article: `Les écrans font partie du quotidien, mais leur utilisation excessive peut nuire au développement des enfants. 
Découvrez des stratégies pour limiter le temps d’écran, favoriser des contenus éducatifs et organiser des moments sans technologie. 
Ces conseils permettent de mieux équilibrer loisirs numériques et activités réelles.`,
    partnerLink: 'https://www.parentaliteconsciente.com',
    discount: 'Guide gratuit sur la gestion des écrans',
  },
  {
    id: '5',
    title: 'Soutien Parental',
    article: `Être parent peut être difficile et parfois stressant. 
Cette section vous met en relation avec des professionnels qualifiés : psychologues, coachs parentaux, pédagogues. 
Ils peuvent vous conseiller sur des situations concrètes, renforcer vos compétences parentales et améliorer la dynamique familiale.`,
    partnerLink: 'https://www.soutien-parental.com',
    discount: 'Première session à moitié prix',
  },
  {
    id: '6',
    title: 'Activités Créatives à la Maison',
    article: `Stimuler la créativité des enfants à la maison permet de développer leur imagination et leurs compétences cognitives. 
Découvrez des activités simples comme le bricolage, la peinture, ou des expériences scientifiques adaptées à leur âge. 
Ces moments ludiques renforcent également la complicité entre parents et enfants.`,
    partnerLink: 'https://www.creatif-family.com',
    discount: 'Kit créatif offert pour votre première activité',
  },
  {
    id: '7',
    title: 'Alimentation et Nutrition',
    article: `Une alimentation équilibrée est essentielle pour la santé et le développement des enfants. 
Retrouvez des conseils pratiques, des idées de repas faciles à préparer et des recettes gourmandes et saines. 
Apprenez à impliquer vos enfants dans la préparation des repas pour qu’ils adoptent de bonnes habitudes alimentaires.`,
    partnerLink: 'https://www.nutrifamille.com',
    discount: 'E-book gratuit sur la nutrition familiale',
  },
  {
   id: '8',
    title: 'Développement Cognitif',
    article: `Encourager le développement cognitif des enfants dès le plus jeune âge est essentiel pour leur réussite future. 
Cette section propose des jeux éducatifs, des puzzles et des activités de logique adaptés à chaque tranche d'âge. 
Ces activités stimulent la mémoire, la concentration et la capacité à résoudre des problèmes tout en restant amusantes.`,
    partnerLink: 'https://www.jeuxeducatifs.com',
    discount: 'Accès gratuit au premier module éducatif',
  },
  {
    id: '9',
    title: 'Lecture et Littérature',
    article: `La lecture régulière développe le langage, l'imagination et la curiosité des enfants. 
Découvrez des listes de livres adaptés à chaque âge, des conseils pour instaurer un rituel de lecture quotidien et des activités liées aux histoires. 
Ces moments favorisent la complicité parent-enfant tout en enrichissant le vocabulaire des enfants.`,
    partnerLink: 'https://www.lireaveclesenfants.com',
    discount: '10% de réduction sur le premier achat de livres',
  },
  {
    id: '10',
    title: 'Activité Physique et Santé',
    article: `L'activité physique régulière est essentielle pour la santé et le bien-être des enfants. 
Découvrez des idées d'exercices à faire à la maison ou en extérieur, des jeux sportifs adaptés aux différentes tranches d'âge et des conseils pour intégrer le sport dans la vie quotidienne. 
Bouger ensemble renforce les liens familiaux et favorise un mode de vie sain.`,
    partnerLink: 'https://www.sportfamille.com',
    discount: 'Séance d’essai gratuite chez un coach partenaire',
  },
];


export function AvantagesScreen() {
  const [selected, setSelected] = useState<Avantage | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avantages</Text>

      <FlatList
        data={avantages}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selected?.title}</Text>
              <Text style={styles.modalArticle}>{selected?.article}</Text>
              <Text style={styles.modalDiscount}>{selected?.discount}</Text>
              <TouchableOpacity onPress={() => selected?.partnerLink && Linking.openURL(selected.partnerLink)}>
                <Text style={styles.modalLink}>Voir le partenaire</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
              <Text style={{ color: 'white' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const Stack = createNativeStackNavigator();
export default function Avantages() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AvantagesMain"
        component={AvantagesScreen}
        options={({ navigation }) => ({
          headerTitle: "Mes avantages",
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
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, textAlign: 'center' },
  card: {
    flex: 1,
    backgroundColor: '#ffbf00',
    margin: 5,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalArticle: {
    fontSize: 16,
    marginBottom: 15,
  },
  modalDiscount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ff6600',
  },
  modalLink: {
    color: '#007bff',
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#ff6600',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});