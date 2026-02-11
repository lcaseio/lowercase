import { useEffect, useState } from "react";
import {
  ThemeProviderContext,
  type Theme,
  type ThemeProviderProps,
} from "./use-theme";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return theme === "system" ? getSystemTheme() : theme;
  });

  useEffect(() => {
    const apply = (mode: "light" | "dark") => {
      const root = window.document.documentElement;
      const body = window.document.body;
      root.classList.remove("light", "dark");
      body.classList.remove("light", "dark");
      root.classList.add(mode);
      body.classList.add(mode);
      setResolvedTheme(mode);
    };

    if (theme === "system") {
      apply(getSystemTheme());

      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => apply(mql.matches ? "dark" : "light");

      // addEventListener is modern, later maybe add addListener for older
      mql.addEventListener?.("change", onChange);

      return () => {
        mql.removeEventListener?.("change", onChange);
      };
    }
    apply(theme);
  }, [theme]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}
