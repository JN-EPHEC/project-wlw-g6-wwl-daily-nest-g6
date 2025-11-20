import { Roboto_400Regular, useFonts } from '@expo-google-fonts/roboto';
import { Shrikhand_400Regular } from '@expo-google-fonts/shrikhand';
import { Slot } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync(); // garde le splash visible


export default function Rootlayout(){
    const [fontsLoaded] = useFonts({
        Shrikhand_400Regular, Roboto_400Regular
    });
    
    useEffect(() => {
        if (fontsLoaded){
            SplashScreen.hideAsync();
        }
    },[fontsLoaded]);
        if (!fontsLoaded) {
            return null;
    };

    return <Slot />;

    };
