import Chatbot from '@/components/Chatbot';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatCustomization } from "@/components/ChatCustomization";

export default function Home() {
  return (
    <main className="min-h-screen overflow-y-hidden bg-background text-foreground py-8 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/vagner-ia.png" alt="Vagner" />
              <AvatarFallback>VP</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Vagner - Terra Plana</h1>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                Especialista em desmascarar as mentiras da NASA
              </Badge>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-end mb-2">
            <ChatCustomization />
          </div>
          <Card className="bg-card text-card-foreground border-border">
            <CardContent className="pt-6">
              <Chatbot />
            </CardContent>
          </Card>
        </div>
        <footer className="mt-12 text-center text-muted-foreground text-sm">
          <p>© 2025 Henrique - Defensor da Verdade sobre a Terra Plana</p>
        </footer>
      </div>
    </main>
  );
}
