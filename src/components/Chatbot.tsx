'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatTheme } from "@/contexts/ChatThemeContext";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useChatTheme();

  // Função para rolar para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
    } catch (error) {
      console.error('Erro:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua mensagem.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center">
            <h2 className="text-xl font-semibold dark:text-white text-black">Bem-vindo ao Chat do Vagner</h2>
            <p>Pergunte sobre a verdadeira forma da Terra e as mentiras da NASA.</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? `${theme.primaryColor} text-white`
                  : `${theme.messageBgColor} text-gray-900 dark:text-gray-100`
              }`}
            >
              {message.role === 'user' ? (
                message.content
              ) : (
                <div className="prose prose-invert max-w-none prose-headings:text-blue-100 prose-p:text-blue-100 prose-strong:text-blue-200 prose-em:text-blue-300 prose-ul:text-blue-100 prose-ol:text-blue-100 prose-li:text-blue-100 prose-code:bg-blue-800 prose-code:text-blue-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-blue-800 prose-pre:text-blue-200 prose-pre:p-2 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-blue-300">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-blue-900/50 text-blue-100 rounded-lg p-3 border border-blue-400/30">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit(e)}
            placeholder="Pergunte sobre a Terra Plana..."
            className={`flex-1 ${theme.inputBgColor}`}
          />
          <Button
            onClick={(e) => handleSubmit(e)}
            disabled={isLoading}
            className={theme.buttonColor}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
} 