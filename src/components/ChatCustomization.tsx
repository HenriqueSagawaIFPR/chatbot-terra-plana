"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useState, useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function ChatCustomization() {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState({
    soundEffects: true,
    typingAnimation: true,
    markdownSupport: true,
    autoScroll: true,
    emojiSupport: true,
    darkMode: false,
  });

  useClickOutside(cardRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="relative" ref={cardRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-72 p-4 space-y-4 bg-card text-card-foreground border-border z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Tema
            </span>
            <ThemeToggle />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-effects" className="text-sm">
                Efeitos Sonoros
              </Label>
              <Switch
                id="sound-effects"
                checked={settings.soundEffects}
                onCheckedChange={() => handleSettingChange("soundEffects")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="typing-animation" className="text-sm">
                Animação de Digitação
              </Label>
              <Switch
                id="typing-animation"
                checked={settings.typingAnimation}
                onCheckedChange={() => handleSettingChange("typingAnimation")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="markdown" className="text-sm">
                Suporte a Markdown
              </Label>
              <Switch
                id="markdown"
                checked={settings.markdownSupport}
                onCheckedChange={() => handleSettingChange("markdownSupport")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-scroll" className="text-sm">
                Rolar Automaticamente
              </Label>
              <Switch
                id="auto-scroll"
                checked={settings.autoScroll}
                onCheckedChange={() => handleSettingChange("autoScroll")}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="emoji" className="text-sm">
                Suporte a Emojis
              </Label>
              <Switch
                id="emoji"
                checked={settings.emojiSupport}
                onCheckedChange={() => handleSettingChange("emojiSupport")}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 