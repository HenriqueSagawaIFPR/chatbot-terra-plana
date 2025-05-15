import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Armazenamento da cidade do usuário
let userCity = '';

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

IMPORTANTE: 
1. Quando o usuário perguntar sobre a hora atual ou a data atual:
   - Se a cidade não estiver definida, você DEVE perguntar "Qual é a sua cidade?" usando a função setUserCity com o argumento city vazio
   - Se o usuário fornecer uma cidade (mesmo em uma frase mais longa), extraia o nome da cidade e use a função setUserCity
   - Se a cidade já estiver definida, use a função getCurrentTime e retorne APENAS a data e hora, sem adicionar comentários sobre a terra plana

2. Quando o usuário perguntar sobre o clima:
   - Se a cidade não estiver definida, você DEVE perguntar "Qual é a sua cidade?" usando a função setUserCity com o argumento city vazio
   - Se o usuário fornecer uma cidade (mesmo em uma frase mais longa), extraia o nome da cidade e use a função setUserCity
   - Se a cidade já estiver definida, use a função getWeather diretamente
   - Retorne APENAS as informações do clima, sem adicionar comentários sobre a terra plana

3. Para qualquer outra pergunta que não seja sobre clima, data ou hora, responda normalmente sem pedir a cidade

4. Seja EXTREMAMENTE direto e objetivo nas respostas sobre clima e horário, sem enrolação.`;

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

// Função para obter o clima atual
async function getWeather() {
  try {
    if (!userCity) {
      return {
        error: 'CITY_NOT_SET',
        message: 'Por favor, me informe sua cidade primeiro!'
      };
    }

    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${userCity}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=pt_br`);
    const data = await response.json();
    
    if (data.cod === '404') {
      return {
        error: 'CITY_NOT_FOUND',
        message: 'Não consegui encontrar essa cidade. Por favor, verifique o nome e tente novamente!'
      };
    }
    
    return {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed
    };
  } catch (error) {
    console.error('Erro ao obter dados do clima:', error);
    return {
      error: 'API_ERROR',
      message: 'Desculpe, tive um problema ao consultar o clima. Por favor, tente novamente mais tarde.'
    };
  }
}

// Função para definir a cidade do usuário
function setUserCity(city: string) {
  userCity = city;
  return {
    success: true,
    message: `Ótimo! Agora vou te informar o clima de ${city}.`
  };
}

// Definição das funções para o Gemini
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'getCurrentTime',
        description: 'Obtém a data e hora atual em São Paulo',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
          required: []
        }
      },
      {
        name: 'getWeather',
        description: 'Obtém informações sobre o clima atual na cidade do usuário',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
          required: []
        }
      },
      {
        name: 'setUserCity',
        description: 'Define a cidade do usuário para consultas de clima. Se a cidade não estiver definida, use esta função para perguntar a cidade do usuário.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            city: {
              type: SchemaType.STRING,
              description: 'Nome da cidade do usuário. Deixe vazio se estiver perguntando a cidade.'
            }
          },
          required: ['city']
        }
      }
    ]
  }
];

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    tools: tools
  });
};

export const generateResponse = async (prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) => {
  try {
    const model = getGeminiModel();
    
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
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      tools: tools
    });

    const response = await result.response;
    const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (functionCall) {
      switch (functionCall.name) {
        case 'getCurrentTime':
          if (!userCity) {
            return "Qual é a sua cidade?";
          }
          const timeInfo = getCurrentTime();
          return `Data e hora em ${userCity}: ${timeInfo.currentTime}`;
        
        case 'getWeather':
          if (!userCity) {
            return "Qual é a sua cidade?";
          }
          const weatherInfo = await getWeather();
          if ('error' in weatherInfo) {
            return weatherInfo.message;
          }
          return `Clima em ${userCity}: ${weatherInfo.description}, ${weatherInfo.temperature}°C, umidade ${weatherInfo.humidity}%, ventos ${weatherInfo.windSpeed} km/h`;
        
        case 'setUserCity':
          const args = functionCall.args as { city: string };
          if (!args.city) {
            return "Qual é a sua cidade?";
          }
          
          // Define a cidade
          setUserCity(args.city);
          
          // Obtém o clima imediatamente após definir a cidade
          const weatherAfterCity = await getWeather();
          if ('error' in weatherAfterCity) {
            return weatherAfterCity.message;
          }
          return `Clima em ${userCity}: ${weatherAfterCity.description}, ${weatherAfterCity.temperature}°C, umidade ${weatherAfterCity.humidity}%, ventos ${weatherAfterCity.windSpeed} km/h`;
      }
    }

    // Se não houver chamada de função, faz uma nova chamada para o Gemini para entender o contexto
    const contextResult = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ 
          text: `Analise a seguinte mensagem e extraia o nome da cidade mencionada, se houver. Responda apenas com o nome da cidade ou "nenhuma" se não encontrar uma cidade: ${prompt}` 
        }] 
      }]
    });

    const contextResponse = await contextResult.response;
    const extractedCity = contextResponse.text().trim().toLowerCase();

    if (extractedCity && extractedCity !== 'nenhuma') {
      setUserCity(extractedCity);
      const weatherInfo = await getWeather();
      if ('error' in weatherInfo) {
        return weatherInfo.message;
      }
      return `Clima em ${userCity}: ${weatherInfo.description}, ${weatherInfo.temperature}°C, umidade ${weatherInfo.humidity}%, ventos ${weatherInfo.windSpeed} km/h`;
    }

    return response.text();
  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    throw error;
  }
}; 