"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ChatTheme = {
  primaryColor: string;
  secondaryColor: string;
  messageBgColor: string;
  inputBgColor: string;
  buttonColor: string;
};

const defaultTheme: ChatTheme = {
  primaryColor: "bg-gray-800 dark:bg-gray-700",
  secondaryColor: "bg-gray-900 dark:bg-gray-800",
  messageBgColor: "bg-gray-100 dark:bg-gray-800",
  inputBgColor: "bg-white dark:bg-gray-900",
  buttonColor: "bg-gray-400 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-800 dark:text-white",
};

const ChatThemeContext = createContext<{
  theme: ChatTheme;
  setTheme: (theme: ChatTheme) => void;
}>({
  theme: defaultTheme,
  setTheme: () => {},
});

export function ChatThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ChatTheme>(defaultTheme);

  return (
    <ChatThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ChatThemeContext.Provider>
  );
}

export function useChatTheme() {
  return useContext(ChatThemeContext);
} 