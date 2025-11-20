import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'body' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'| 'error'
  | 'button';
  
};

export default function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'body',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const fontFamily =
  type == 'title'
  ? 'Shrikhand_400Regular'
  : 'Roboto_400Regular';
  return (
    <Text
      style={[
        { color,fontFamily },
        type === 'body' && styles.body, 
        type === 'title' && styles.title ,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'subtitle' && styles.subtitle ,
        type === 'link' && styles.link,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color : '#374151',

    
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'bold',
    color: '#101010',
    paddingHorizontal: 12,
    paddingVertical: 12,
    
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    color: '#fd7621ff'
    
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color:'#040404e8'
    
  },
  link: {
    lineHeight: 30,
    fontSize: 15,
    color: '#1c90d8ff',
    textDecorationLine: 'underline'

  },



  
});
//ceci

//je retente
