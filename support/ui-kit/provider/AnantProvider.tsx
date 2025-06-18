import {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "../theme/theme";

import "./index.css";

type ThemeMode = "light" | "dark";

interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    danger: string;
    normal: string;
    text: string;
    border: string;
    background: string;
  };
  input: {
    activeBorder: string;
    borderTopRightRadius: number;
    borderTopLeftRadius: number;
    borderBottomLeftRadius: number;
    borderBottomRightRadius: number;
    background: string;
  };
}

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: (customTheme?: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface AnantProviderProps {
  children: ReactNode;
  mode?: ThemeMode;
}

export const AnantProvider = ({
  children,
  mode = "light",
}: AnantProviderProps) => {
  const [theme, setTheme] = useState<Theme>(
    mode === "light" ? lightTheme : darkTheme,
  );

  useEffect(() => {
    const targetDiv = document.querySelector("#anant-tab-theme-mode");

    if (theme.mode === "light") {
      targetDiv?.classList.remove("dark");
      targetDiv?.classList.add("light");
    } else {
      targetDiv?.classList.remove("light");
      targetDiv?.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = (customTheme?: Theme) => {
    if (customTheme) {
      setTheme(customTheme);
    } else {
      setTheme((prevTheme) => {
        const newTheme = prevTheme.mode === "light" ? darkTheme : lightTheme;

        return newTheme;
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within AnantProvider");
  return context;
};
