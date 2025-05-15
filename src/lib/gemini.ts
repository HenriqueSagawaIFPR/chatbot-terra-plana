import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType, Content, Part } from '@google/generative-ai';

// Garanta que suas variáveis de ambiente estão carregadas corretamente.
// Ex: import dotenv from 'dotenv'; dotenv.config();
// Se estiver usando Next.js ou similar, as variáveis de ambiente .env.local são carregadas automaticamente.

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Armazenamento da cidade do usuário
let userCity = ''; // Variável global para simplicidade neste exemplo. Em produção, considere um gerenciamento de estado melhor (ex: por sessão de usuário).

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
   - Se a cidade do usuário (userCity) não estiver definida internamente, você DEVE chamar a função 'setUserCity' com o parâmetro 'city' VAZIO. Isso fará com que o sistema pergunte ao usuário "Qual é a sua cidade?". NÃO tente responder a hora/data sem a cidade definida, a menos que a pergunta seja genérica e não implique uma localidade específica que necessite de 'userCity'.
   - Se o usuário fornecer uma cidade na pergunta (ex: "que horas são em Brasília?"), você DEVE primeiro chamar a função 'setUserCity' com a cidade extraída (ex: "Brasília").
   - Se a cidade do usuário (userCity) já estiver definida internamente, você DEVE chamar a função 'getCurrentTime'. Após receber o resultado da função, sua resposta para o usuário deve ser EXCLUSIVAMENTE a data e hora formatada, sem NENHUM comentário adicional sobre Terra Plana ou qualquer outra coisa. Exemplo: "A data e hora atual em São Paulo é 25/07/2024, 10:30:00."

2. Quando o usuário perguntar sobre o clima:
   - Se a cidade do usuário (userCity) não estiver definida internamente, você DEVE chamar a função 'setUserCity' com o parâmetro 'city' VAZIO. Isso fará com que o sistema pergunte ao usuário "Qual é a sua cidade?".
   - Se o usuário fornecer uma cidade na pergunta (ex: "como está o clima em Salvador?"), você DEVE primeiro chamar a função 'setUserCity' com a cidade extraída (ex: "Salvador").
   - Se a cidade do usuário (userCity) já estiver definida internamente, você DEVE chamar a função 'getWeather'. Após receber o resultado da função, sua resposta para o usuário deve ser EXCLUSIVAMENTE as informações do clima, sem NENHUM comentário adicional sobre Terra Plana ou qualquer outra coisa. Exemplo: "O clima em Recife é: céu limpo, 28°C, umidade 70%, ventos a 15 km/h."

3. Para qualquer outra pergunta que não seja sobre clima, data ou hora, responda normalmente seguindo sua persona de Vagner, o terraplanista, sem pedir a cidade.

4. Seja EXTREMAMENTE direto e objetivo nas respostas sobre clima e horário, sem enrolação. A resposta final deve ser APENAS a informação solicitada.
5. Lembre-se que a função getCurrentTime retorna a hora de São Paulo. Se a userCity estiver definida para outra cidade, você pode mencionar isso se achar relevante, mas mantenha a resposta focada na informação de tempo.
`;

// Função para obter a data e hora atuais (fixo para São Paulo conforme descrição da ferramenta)
function getCurrentTime() {
  const now = new Date();
  return {
    dateTime: now.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    timeZoneLabel: 'São Paulo (Horário de Brasília)'
  };
}

// Função para obter o clima atual
async function getWeather() {
  try {
    if (!userCity) {
      return {
        error: 'CITY_NOT_SET',
        message: 'Erro interno: A cidade do usuário não foi definida antes de chamar getWeather.'
      };
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        console.error('OPENWEATHER_API_KEY não definida');
        return {
            error: 'API_KEY_MISSING',
            message: 'Desculpe, a chave da API de clima não está configurada.'
        };
    }
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(userCity)}&appid=${apiKey}&units=metric&lang=pt_br`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro da API OpenWeather:', response.status, errorData);
        if (response.status === 404) {
          return {
            error: 'CITY_NOT_FOUND',
            message: `Não consegui encontrar o clima para "${userCity}". Por favor, verifique o nome.`
          };
        }
        return {
            error: 'API_FETCH_ERROR',
            message: 'Desculpe, tive um problema ao consultar o clima no momento.'
        };
    }
    const data = await response.json();

    return {
      city: userCity,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      feelsLike: Math.round(data.main.feels_like)
    };
  } catch (error) {
    console.error('Erro ao obter dados do clima:', error);
    return {
      error: 'INTERNAL_ERROR',
      message: 'Desculpe, tive um problema interno ao consultar o clima. Por favor, tente novamente mais tarde.'
    };
  }
}

// Função chamada pela ferramenta 'setUserCity'
function handleSetUserCity(city: string) {
  if (!city || city.trim() === "") {
    return { action: "ASK_CITY" };
  }
  userCity = city.trim();
  console.log(`Cidade do usuário definida para: ${userCity}`);
  return {
    status: "SUCCESS",
    citySet: userCity,
    messageForLLM: `A cidade do usuário foi definida como ${userCity}. Prossiga com a solicitação original do usuário, se aplicável (como obter clima ou hora).`
  };
}

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'getCurrentTime',
        description: 'Obtém a data e hora atual. Sempre retorna o horário de São Paulo, Brasil.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'getWeather',
        description: 'Obtém informações sobre o clima atual na cidade do usuário (userCity), que DEVE estar definida previamente. Se userCity não estiver definida, o LLM deve chamar setUserCity primeiro.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'setUserCity',
        description: 'Define ou pergunta a cidade do usuário. Se o parâmetro "city" estiver VAZIO, o sistema irá perguntar ao usuário qual é a cidade dele. Se "city" for fornecido, define a cidade do usuário para esse valor para uso futuro em getCurrentTime ou getWeather.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            city: {
              type: SchemaType.STRING,
              description: 'Nome da cidade do usuário. Deixe VAZIO para instruir o sistema a perguntar a cidade ao usuário.'
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
    tools: tools,
  });
};


export const generateResponse = async (
  prompt: string,
  history: { role: 'user' | 'model' | 'assistant', content: string }[] = []
): Promise<string> => {
  try {
    const model = getGeminiModel();

    const geminiHistory: Content[] = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

    const initialUserContentParts: Part[] = [];
    if (geminiHistory.length === 0) {
        initialUserContentParts.push({text: SYSTEM_INSTRUCTION + "\n---"});
    }
    initialUserContentParts.push({text: `Usuário: ${prompt}`});


    let currentContents: Content[] = [
        ...geminiHistory,
        { role: 'user', parts: initialUserContentParts }
    ];

    let safetyFallbackCount = 0;
    const MAX_FALLBACKS = 5;

    while (safetyFallbackCount < MAX_FALLBACKS) {
      const result = await model.generateContent({ contents: currentContents });
      const response = result.response;

      if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
        console.warn("Resposta inválida ou vazia do Gemini:", response);
        return "Desculpe, Vagner não conseguiu processar sua solicitação no momento. Tente novamente.";
      }

      const candidateContent = response.candidates[0].content;
      currentContents.push(candidateContent); // Adiciona a resposta do modelo (que pode ser texto ou functionCall) ao histórico da interação atual

      const functionCallPart = candidateContent.parts.find(part => part.functionCall);

      if (functionCallPart && functionCallPart.functionCall) {
        const functionCall = functionCallPart.functionCall;
        let functionResponseData;
        let partForLLM: Part | null = null; // Esta será a FunctionResponsePart

        console.log(`LLM chamou função: ${functionCall.name} com args:`, functionCall.args);

        if (functionCall.name === 'getCurrentTime') {
          functionResponseData = getCurrentTime();
          partForLLM = { // <<< CORREÇÃO APLICADA AQUI
            functionResponse: { name: 'getCurrentTime', response: functionResponseData }
          };
        } else if (functionCall.name === 'getWeather') {
          functionResponseData = await getWeather();
          partForLLM = { // <<< CORREÇÃO APLICADA AQUI
            functionResponse: { name: 'getWeather', response: functionResponseData }
          };
        } else if (functionCall.name === 'setUserCity') {
          const cityArg = (functionCall.args as { city: string }).city;
          const setUserCityResult = handleSetUserCity(cityArg);

          if (setUserCityResult.action === "ASK_CITY") {
            return "Qual é a sua cidade?";
          }
          functionResponseData = setUserCityResult;
          partForLLM = { // <<< CORREÇÃO APLICADA AQUI
            functionResponse: { name: 'setUserCity', response: functionResponseData }
          };
        } else {
          console.error(`Função desconhecida chamada: ${functionCall.name}`);
          partForLLM = { // <<< CORREÇÃO APLICADA AQUI
            functionResponse: {
              name: functionCall.name,
              response: { error: `Função '${functionCall.name}' não implementada.` }
            }
          };
        }

        if (partForLLM) {
            // Adiciona o resultado da função como uma nova mensagem 'tool' para o LLM processar
            currentContents.push({ role: 'tool', parts: [partForLLM] });
        }
        // Continua o loop para o LLM processar o resultado da função

      } else {
        // Nenhuma chamada de função, o LLM forneceu uma resposta em texto.
        const textResponse = candidateContent.parts.map(part => part.text).join("").trim();
        console.log("LLM respondeu com texto:", textResponse);
        return textResponse;
      }
      safetyFallbackCount++;
    }

    console.warn("Máximo de chamadas de função atingido. Retornando última tentativa de texto ou erro.");
    const lastModelPart = currentContents.filter(c => c.role === 'model').pop();
    if (lastModelPart && lastModelPart.parts.every(p => p.text)) {
        return lastModelPart.parts.map(p => p.text).join("").trim();
    }
    return "Desculpe, Vagner está tendo dificuldades em processar seu pedido após várias etapas. Tente simplificar.";

  } catch (error: any) { // Tipando 'error' como any para acessar 'message' e 'response' com segurança
    console.error('Erro ao gerar resposta do Gemini:', error);
    // Log detalhado do erro da API, se disponível
    if (error.response && error.response.data) {
        console.error('Detalhes do erro da API Gemini:', error.response.data);
    } else if (error.errorDetails) { // Para o formato do erro original
        console.error('Detalhes do erro da API Gemini (errorDetails):', error.errorDetails);
    }


    if (error instanceof Error && error.message.includes('candidats is not available')) { // "candidates" com "s"
        return "Vagner detectou um problema com a resposta da IA (nenhum candidato disponível). Isso pode ser um problema temporário ou de configuração. Verifique os logs para mais detalhes.";
    }
    if (error instanceof Error && error.message.includes('User location is not set')) {
        return "Vagner informa: Parece que sua localização não está configurada para usar este recurso. Verifique as configurações da API.";
    }
    // Verifica o erro específico do JSON inválido
    if (error.message && error.message.includes('Invalid JSON payload received.') && error.message.includes('Unknown name "toolResponse"')) {
        return "Ops! Houve um erro interno ao processar a resposta da ferramenta (formato incorreto: toolResponse). A equipe de desenvolvimento já foi notificada (corrigir para functionResponse).";
    }
    if (error.status === 400 && error.errorDetails && error.errorDetails[0] && error.errorDetails[0].description.includes('Invalid JSON payload')) {
        return `Ops! O Vagner encontrou um problema técnico (400 Bad Request). Parece que enviei algo que a IA não entendeu. Detalhe: ${error.errorDetails[0].description}`;
    }

    return "Ops! Parece que o Vagner (nosso chatbot) encontrou um campo de força magnética... digo, um erro. Tente novamente!";
  }
};

// Para testar (exemplo de como você poderia chamar em um contexto Node.js simples)
async function testChat() {
  console.log("Iniciando teste do chat com Vagner...\n");
  // Certifique-se de que as variáveis de ambiente estão carregadas se estiver rodando este teste standalone
  // Ex: require('dotenv').config();
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.error("ERRO: GOOGLE_AI_API_KEY não está definida. Defina-a no seu arquivo .env");
    return;
  }
  if (!process.env.OPENWEATHER_API_KEY) {
    console.warn("AVISO: OPENWEATHER_API_KEY não está definida. Testes de clima podem falhar ou retornar mensagem de API key ausente.");
  }


  const history: { role: 'user' | 'model', content: string }[] = [];

  // Função auxiliar para simular uma conversa
  async function ask(prompt: string) {
    console.log(`\nUsuário: ${prompt}`);
    // Antes de cada chamada, resetamos userCity se não for um teste de continuidade de cidade
    // Para simular sessões de usuário independentes, você gerenciaria isso de forma diferente.
    // Neste teste, para algumas perguntas, vamos querer que userCity seja resetada.
    // Para outras, vamos querer que persista.
    const response = await generateResponse(prompt, [...history]); // Passa uma cópia do histórico
    console.log(`Vagner: ${response}`);
    history.push({ role: 'user', content: prompt });
    history.push({ role: 'model', content: response });
  }

  // Cenários de teste
  await ask("Olá Vagner, tudo bem?");

  // Limpar userCity para forçar a pergunta
  userCity = '';
  history.length = 0; // Resetar histórico para este cenário
  await ask("Que horas são?"); // Deve perguntar a cidade
  await ask("Curitiba"); // Deve definir Curitiba E responder a hora ou aguardar próxima pergunta para hora.
                          // O ideal é que o LLM entenda que a pergunta anterior era sobre hora e já responda.
  await ask("E qual o clima agora?"); // Deve dar o clima de Curitiba

  // Limpar userCity e histórico para novo cenário
  userCity = '';
  history.length = 0;
  await ask("Qual o clima em Salvador?"); // Deve definir Salvador e dar o clima
  await ask("E a data de hoje?"); // Deve dar a data (horário de SP), userCity é Salvador

  userCity = '';
  history.length = 0;
  await ask("Por que você acha que a Terra é plana?");

  await ask("Obrigado Vagner!");

  // Teste de cidade inválida para o clima
  userCity = '';
  history.length = 0;
  await ask("Qual o clima em CidadeQueNaoExisteMuitoEstranha123?");
  // O LLM deve tentar setUserCity com "CidadeQueNaoExisteMuitoEstranha123"
  // getWeather vai retornar erro de CITY_NOT_FOUND
  // O LLM deve então informar o erro ao usuário.

  // Teste perguntando o clima sem ter cidade e depois informando
  userCity = '';
  history.length = 0;
  await ask("Como está o tempo?"); // Deve perguntar a cidade
  await ask("Campinas");          // Deve definir Campinas e responder o clima
}

// Descomente para rodar o teste se estiver em um ambiente Node.js
// e certifique-se de ter um arquivo .env com GOOGLE_AI_API_KEY e OPENWEATHER_API_KEY
// (async () => {
//   try {
//     await testChat();
//   } catch (e) {
//     console.error("Erro no testChat:", e);
//   }
// })();
