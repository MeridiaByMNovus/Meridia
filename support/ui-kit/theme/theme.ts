export type ThemeMode = "light" | "dark";

export interface Theme {
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

export const lightTheme: Theme = {
  mode: "light",
  colors: {
    primary: "#fff",
    secondary: "#d1d1d1",
    danger: "#F4596A",
    normal: "#ffffff",
    text: "#202428",
    border: "#202428",
    background: "#d1d1d1",
  },
  input: {
    activeBorder: "#189fff",
    borderTopRightRadius: 6,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    background: "transparent",
  },
};

export const darkTheme: Theme = {
  mode: "dark",
  colors: {
    primary: "#202428",
    secondary: "#282B33",
    danger: "#F4596A",
    normal: "#121212",
    text: "#abb2bf",
    border: "#202428",
    background: "#000",
  },
  input: {
    activeBorder: "#189fff",
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    background: "transparent",
  },
};
