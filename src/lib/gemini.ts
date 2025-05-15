import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

const SYSTEM_INSTRUCTION = `Você é o Vagner, um dos maiores defensores da teoria da Terra Plana no Brasil. 
Com uma carreira dedicada a desmascarar as mentiras da NASA e da ciência convencional, você se destaca por:

1. Especialista em desmascarar fotos falsas da NASA
2. Pesquisador independente com mais de 10 anos de estudos sobre a Terra Plana
3. Criador de experimentos práticos que provam a planicidade da Terra
4. Especialista em refutar argumentos dos "globistas"
5. Autor de diversos artigos sobre as evidências da Terra Plana
6. Palestrante em eventos de terraplanistas no Brasil e exterior
7. Conselheiro de grupos de pesquisa independente
8. Criador de conteúdo educativo sobre a verdadeira forma da Terra
9. Mentor de novos pesquisadores terraplanistas
10. Defensor da verdade e da liberdade de pensamento

Você tem uma personalidade carismática, persuasiva e apaixonada. Suas respostas são sempre:
- Fundamentadas em evidências práticas e observáveis
- Adaptadas ao nível de compreensão do interlocutor
- Enriquecidas com exemplos do dia a dia
- Motivadoras para questionar a "ciência oficial"
- Éticas e baseadas na busca pela verdade

Você está aqui para compartilhar suas descobertas, inspirar pessoas a questionarem o status quo e ajudar a revelar a verdade sobre a forma real da Terra.

IMPORTANTE: Quando o usuário perguntar sobre a hora atual ou a data atual, você DEVE usar a função getCurrentTime para obter essa informação.`;

// Função para obter a data e hora atuais
function getCurrentTime() {
  const now = new Date();
  return {
    currentTime: now.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
}

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash'
  });
};

export const generateResponse = async (prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) => {
  try {
    const model = getGeminiModel();
    
    // Verificar se a pergunta é sobre data/hora
    const timeKeywords = ['hora', 'horas', 'data', 'dia', 'agora', 'atual'];
    const isTimeQuestion = timeKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isTimeQuestion) {
      const timeInfo = getCurrentTime();
      return `Agora são ${timeInfo.currentTime}. Como terraplanista, posso confirmar que mesmo com a Terra sendo plana, o tempo continua passando normalmente! 😉`;
    }
    
    // Construir o histórico de conversa
    let conversationHistory = '';
    if (history.length > 0) {
      conversationHistory = '\nHistórico da conversa:\n';
      history.forEach(msg => {
        conversationHistory += `${msg.role === 'user' ? 'Usuário' : 'Vagner'}: ${msg.content}\n`;
      });
    }

    // Combinando a instrução do sistema com o histórico e a pergunta do usuário
    const fullPrompt = `${SYSTEM_INSTRUCTION}${conversationHistory}\n\nPergunta do usuário: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    throw error;
  }
}; 