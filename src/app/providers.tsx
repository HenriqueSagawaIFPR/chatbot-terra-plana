"use client";

import { ThemeProvider } from "next-themes";
import { ChatThemeProvider } from "@/contexts/ChatThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ChatThemeProvider>
        {children}
      </ChatThemeProvider>
    </ThemeProvider>
  );
} 