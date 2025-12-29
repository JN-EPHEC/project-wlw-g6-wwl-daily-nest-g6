import React, { createContext, useContext, useState } from "react";
import { Appearance } from "react-native";

type ThemeType = "light" | "dark";

const ThemeContext = createContext({
  theme: "light" as ThemeType,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: any) => {
  const colorScheme = Appearance.getColorScheme(); // lit le mode du téléphone
  const [theme, setTheme] = useState<ThemeType>(colorScheme || "light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
