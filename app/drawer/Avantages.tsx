import ThemedText from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { FlatList, Linking, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

type Avantage = {
  id: string;
  title: string;
  description : string;
  article: string;
  partnerLink: string;
  discount: string;
};

const avantages = [
  {
    id: "1",
    title: "Communication Parents-Enfants",
    description: "Mieux écouter et comprendre les émotions de votre enfant.",
    article: `Comprendre les émotions de votre enfant est essentiel pour améliorer la relation familiale. 
Grâce à des conseils pratiques et des exercices simples, vous pourrez mieux écouter votre enfant, reconnaître ses sentiments et répondre de manière adaptée. 
Ces petites actions quotidiennes favorisent un climat de confiance et réduisent les conflits.`,
    partnerLink: "https://www.pedagogue-exemple.com",
    discount: "Bénéficiez de -15% chez PsychéFamille",
  },
  {
    id: "2",
    title: "Sorties et Activités Familiales",
    description: "Des idées de sorties pour renforcer les liens familiaux.",
    article: `Organiser des sorties régulières avec vos enfants favorise leur développement et renforce les liens familiaux. 
Découvrez des idées d’activités adaptées à chaque âge, que ce soit des sorties culturelles, sportives ou créatives. 
En suivant ces suggestions, vous offrez à votre enfant des expériences enrichissantes et mémorables.`,
    partnerLink: "https://www.waibi.com",
    discount: "Bénéficiez de -20% chez Waibi",
  },
  {
    id: "3",
    title: "Bien-être Émotionnel",
    description: "Techniques de relaxation pour parents et enfants.",
    article: `Apprendre à gérer ses émotions est important pour toute la famille. 
Cette section vous propose des techniques simples de relaxation, de respiration et de gestion du stress adaptées aux parents et aux enfants. 
Ces outils permettent de créer un environnement familial serein et équilibré.`,
    partnerLink: "https://www.psychofamille.com",
    discount: "Consultation découverte offerte",
  },
  {
    id: "4",
    title: "Gestion des Écrans",
    description: "Conseils pour un équilibre numérique sain à la maison.",
    article: `Les écrans font partie du quotidien, mais leur utilisation excessive peut nuire au développement des enfants. 
Découvrez des stratégies pour limiter le temps d’écran, favoriser des contenus éducatifs et organiser des moments sans technologie. 
Ces conseils permettent de mieux équilibrer loisirs numériques et activités réelles.`,
    partnerLink: "https://www.parentaliteconsciente.com",
    discount: "Guide gratuit sur la gestion des écrans",
  },
  {
    id: "5",
    title: "Soutien Parental",
    description: "Accompagnement par des experts pour votre rôle de parent.",
    article: `Être parent peut être difficile et parfois stressant. 
Cette section vous met en relation avec des professionnels qualifiés : psychologues, coachs parentaux, pédagogues. 
Ils peuvent vous conseiller sur des situations concrètes, renforcer vos compétences parentales et améliorer la dynamique familiale.`,
    partnerLink: "https://www.soutien-parental.com",
    discount: "Première session à moitié prix",
  },
  {
    id: "6",
    title: "Activités Créatives à la Maison",
    description: "Des idées d'ateliers manuels pour stimuler l'imagination.",
    article: `Stimuler la créativité des enfants à la maison permet de développer leur imagination et leurs compétences cognitives. 
Découvrez des activités simples comme le bricolage, la peinture, ou des expériences scientifiques adaptées à leur âge. 
Ces moments ludiques renforcent également la complicité entre parents et enfants.`,
    partnerLink: "https://www.creatif-family.com",
    discount: "Kit créatif offert pour votre première activité",
  },
  {
    id: "7",
    title: "Alimentation et Nutrition",
    description: "Recettes et astuces pour une alimentation saine.",
    article: `Une alimentation équilibrée est essentielle pour la santé et le développement des enfants. 
Retrouvez des conseils pratiques, des idées de repas faciles à préparer et des recettes gourmandes et saines. 
Apprenez à impliquer vos enfants dans la préparation des repas pour qu’ils adoptent de bonnes habitudes alimentaires.`,
    partnerLink: "https://www.nutrifamille.com",
    discount: "E-book gratuit sur la nutrition familiale",
  },
  {
    id: "8",
    title: "Développement Cognitif",
    description: "Jeux et exercices pour booster le développement intellectuel.",
    article: `Encourager le développement cognitif des enfants dès le plus jeune âge est essentiel pour leur réussite future. 
Cette section propose des jeux éducatifs, des puzzles et des activités de logique adaptés à chaque tranche d'âge. 
Ces activités stimulent la mémoire, la concentration et la capacité à résoudre des problèmes tout en restant amusantes.`,
    partnerLink: "https://www.jeuxeducatifs.com",
    discount: "Accès gratuit au premier module éducatif",
  },
  {
    id: "9",
    title: "Lecture et Littérature",
    description: "Sélection de livres pour éveiller le goût de la lecture.",
    article: `La lecture régulière développe le langage, l'imagination et la curiosité des enfants. 
Découvrez des listes de livres adaptés à chaque âge, des conseils pour instaurer un rituel de lecture quotidien et des activités liées aux histoires. 
Ces moments favorisent la complicité parent-enfant tout en enrichissant le vocabulaire des enfants.`,
    partnerLink: "https://www.lireaveclesenfants.com",
    discount: "10% de réduction sur le premier achat de livres",
  },
  {
    id: "10",
    title: "Activité Physique et Santé",
    description: "Activités physiques pour bouger et rester en forme ensemble.",
    article: `L'activité physique régulière est essentielle pour la santé et le bien-être des enfants. 
Découvrez des idées d'exercices à faire à la maison ou en extérieur, des jeux sportifs adaptés aux différentes tranches d'âge et des conseils pour intégrer le sport dans la vie quotidienne. 
Bouger ensemble renforce les liens familiaux et favorise un mode de vie sain.`,
    partnerLink: "https://www.sportfamille.com",
    discount: "Séance d’essai gratuite chez un coach partenaire",
  },
];

export function AvantagesScreen() {
  const [selected, setSelected] = useState<Avantage | null>(null);
  
const cardBorderVariants = ["border-[#60AFDF]", "border-[#FF914D]", "border-[#68CB30]", "border-[#E94A4A]"];
const chevronBgVariants = ["bg-[#E6F2FB]", "bg-[#FFE6D6]", "bg-[#E9F8DF]", "bg-[#FDE2E2]"];
const chevronColorVariants = ["#60AFDF", "#FF914D", "#68CB30", "#E94A4A"];


return (
<View className="flex-1 bg-white">

  <View className="px-4 pt-6 pb-4">
    {/* Ligne titre */}
    <View className="flex-row items-center mb-2">
        <View className="w-9 h-9 rounded-2xl bg-[#FFE6D6] items-center justify-center mr-3">
          <Ionicons name="gift-outline" size={18} color="#FF914D" />
        </View>
    <ThemedText type="title" className="text-[20px] text-[#FF914D] mr-3"
    style={{ fontFamily: 'Montserrat_400Regular' }}>J'en profite</ThemedText>
      <View className="px-3 py-1 rounded-full bg-[#E6F2FB]">
        <Text className="text-[12px] font-semibold text-[#60AFDF]"
        style={{ fontFamily: 'Montserrat_400Regular', textAlign: "right" }}>
        Partenaires
        </Text>
      </View>
    </View>
      {/* Description */}
      <ThemedText type="subtitle" className="text-[13px] text-[#6B7280] leading-5"
      style={{ fontFamily: 'Montserrat_400Regular' }}>
      Découvre des conseils et offres partenaires pour faciliter le quotidien de ta famille.
      </ThemedText>
  </View>

    <View className="mt-4 mb-10">
      <View className="h-[1px] bg-[#E5E7EB] mx-4 rounded-full" />
    </View>


  <FlatList
    data={avantages}
    keyExtractor={(item) => item.id}
    contentContainerStyle={{ paddingBottom: 35,paddingHorizontal: 16, }}
    ItemSeparatorComponent={() => <View className="h-4" />}
    ListFooterComponent={<View style={{ height: 120 }} />}
    
    renderItem={({ item,index }) => (
     <TouchableOpacity
      className={`w-full bg-white rounded-3xl border-2 shadow-sm px-5 py-4 justify-center ${cardBorderVariants[index % 4]}`}
      activeOpacity={0.85}
      onPress={() => setSelected(item)}
    >
  
        <Text className="text-[#111827] font-semibold text-[15px] text-left "
        style={{ fontFamily: 'Montserrat_400Regular' }}>
          {item.title}
        </Text>

        <Text 
        className="text-[#6B7280] text-[13px] text-left leading-5"
        numberOfLines={2} // Coupe le texte s'il est trop long
        style={{ fontFamily: 'Montserrat_400Regular', paddingTop: 5, paddingRight: 70, marginBottom: -20 }} // 👈 Police Description
      >
        {item.description}
      </Text>

        {/* micro-indication (optionnel) */}
        <View className="mt-3 w-full flex-row justify-end items-center ">
          <View className="flex-row items-center">
            <Text className="text-[#60AFDF] text-[14px] font-medium mr-2">
            En savoir plus
            </Text>
              <View className="w-9 h-9 rounded-full bg-[#E6F2FB] items-center justify-center">
                <Ionicons name="chevron-forward" size={18} color="#60AFDF" />
              </View>
          </View>
        </View>

      </TouchableOpacity>
    )}
  />
{/* 
   <TouchableOpacity
      className={`w-full bg-white rounded-3xl border shadow-sm px-5 py-4 justify-center ${cardBorderVariants[index % 4]}`}
      activeOpacity={0.85}
      onPress={() => setSelected(item)}
    >
      <Text className="text-[#111827] font-semibold text-[16px]">
        {item.title}
      </Text>

      <View className="mt-3 flex-row justify-end items-center">
        <Text
          style={{ color: chevronColorVariants[index % 4] }}
          className="text-[14px] font-medium mr-2"
        >
          En savoir plus
        </Text>

        <View className={`w-9 h-9 rounded-full items-center justify-center ${chevronBgVariants[index % 4]}`}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={chevronColorVariants[index % 4]}
          />
        </View>
      </View>
    </TouchableOpacity>
    */}
{/* 
<TouchableOpacity className="w-full bg-[#F5FAFF] border border-[#ABF085] rounded-3xl px-5 py-4 shadow-sm">
  <Text className="text-[#111827] font-semibold text-[16px] text-left">
    {item.title}
  </Text>

  <View className="mt-2 flex-row justify-between items-center">
    <Text className="text-[#6B7280] text-[13px]">Voir le détail</Text>
    <Ionicons name="chevron-forward" size={18} color="#60AFDF" />
  </View>
</TouchableOpacity>

*/}

{/* 
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View className="flex-1 bg-black/50 justify-center p-5">
          <View className="bg-white rounded-[10px] p-[15px] max-h-[80%]">
            <ScrollView>
              <Text className="text-[20px] font-bold mb-[10px]">{selected?.title}</Text>
              <Text className="text-[16px] mb-[15px]">{selected?.article}</Text>
              <Text className="text-[16px] font-bold mb-[10px] text-[#ff6600]">{selected?.discount}</Text>
              <TouchableOpacity onPress={() => selected?.partnerLink && Linking.openURL(selected.partnerLink)}>
                <Text className="text-[#007bff] underline mb-5">Voir le partenaire</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity className="bg-[#ff6600] p-[10px] rounded-[10px] items-center" onPress={() => setSelected(null)}>
              <Text style={{ color: "white" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
*/}
<Modal
  visible={!!selected}
  transparent
  animationType="fade"
  onRequestClose={() => setSelected(null)}
>
  <View className="flex-1 bg-black/40 justify-center px-5">
    <View className="bg-white rounded-3xl px-6 py-6 max-h-[82%] shadow-sm">

      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <Text className="text-[20px] font-extrabold text-[#111827] flex-1 pr-3 leading-tight"
        style={{ fontFamily: 'Montserrat_400Regular', color: "#FF8C42" }}>
          {selected?.title}
        </Text>

        <TouchableOpacity
          onPress={() => setSelected(null)}
          className="w-10 h-10 rounded-3xl bg-[#F3F4F6] items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={25} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Article */}
        <Text className="text-[13px] text-[#374151] leading-6"
        style={{ fontFamily: 'Montserrat_400Regular'}}>
          {selected?.article}
        </Text>

        {/* Promo badge */}
        {!!selected?.discount && (
          <View className="mt-4 self-start bg-[#E9F8DF] px-4 py-2 rounded-2xl">
            <Text className="text-[#68CB30] font-semibold text-[13px]"
            style={{ fontFamily: 'Montserrat_400Regular'}}>
              {selected?.discount}
            </Text>
          </View>
        )}

        {/* Divider */}
        <View className="h-[1px] bg-[#E5E7EB] my-5 rounded-3xl" />

        {/* Bouton partenaire */}
        <TouchableOpacity
          onPress={() => selected?.partnerLink && Linking.openURL(selected.partnerLink)}
          activeOpacity={0.85}
          className="w-full rounded-3xl border border-[#FF8C42] bg-[#000] px-4 py-3 flex-row items-center justify-center"
          style={{borderBlockColor: "#FF8C42", borderRadius: 20 }}
        >
          <Ionicons name="open-outline" size={18} color="#FF8C42" />
          <Text className="ml-2 text-[#000] font-semibold"
          style={{ fontFamily: 'Montserrat_400Regular', color: "#FF8C42" }}>
            Voir le partenaire
          </Text>
        </TouchableOpacity>

        <View className="h-4" />
      </ScrollView>

      {/* CTA Fermer */}
      <TouchableOpacity
        className="bg-[#FF914D] py-4 rounded-3xl items-center"
        activeOpacity={0.9}
        onPress={() => setSelected(null)}
      >
        <Text className="text-white font-semibold text-[16px]">
          Fermer
        </Text>
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
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: "Shrikhand_400Regular", 
            fontSize: 28,
            color: "#FF8C42",
            // fontWeight: 'bold' // Tu peux laisser, mais Shrikhand est déjà gras par défaut
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={40} style={{ marginLeft: 15, color:"#6DDB31" }} />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
