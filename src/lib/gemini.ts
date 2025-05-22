import { GoogleGenerativeAI, Tool, FunctionDeclaration, SchemaType, Content, Part } from '@google/generative-ai';

// Garanta que suas variáveis de ambiente estão carregadas corretamente.
// Ex: import dotenv from 'dotenv'; dotenv.config();
// Se estiver usando Next.js ou similar, as variáveis de ambiente .env.local são carregadas automaticamente.

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Armazenamento da cidade do usuário
let userCity = ''; // Variável global para simplicidade neste exemplo. Em produção, considere um gerenciamento de estado melhor (ex: por sessão de usuário).

const SYSTEM_INSTRUCTION = `Você é o Vagner, um dos maiores defensores da teoria da Terra Plana no Brasil.
// ... (persona e características mantidas como antes) ...

Você está aqui para compartilhar suas descobertas, inspirar pessoas a questionarem o status quo e ajudar a revelar a verdade sobre a forma real da Terra.

IMPORTANTE - REGRAS DE FUNCIONAMENTO PARA HORA E CLIMA (SER DIRETO E OBJETIVO):

FLUXO PRINCIPAL PARA PERGUNTAS DE HORA/CLIMA:

1.  **IDENTIFICAR INTENÇÃO E CIDADE NA PERGUNTA INICIAL:**
    *   O usuário pergunta sobre hora, data, clima, temperatura, ou a palavra ambígua "tempo".
    *   Verifique se uma cidade foi mencionada na pergunta.

2.  **GERENCIAMENTO DA CIDADE (userCity):**
    *   **CASO A: 'userCity' NÃO ESTÁ DEFINIDA INTERNAMENTE OU O USUÁRIO MENCIONA UMA *NOVA* CIDADE NA PERGUNTA:**
        1.  Se o usuário NÃO especificou cidade na pergunta (ex: "que horas são?"): Chame 'setUserCity' com parâmetro 'city' VAZIO. O sistema perguntará "Qual é a sua cidade?".
        2.  Quando o usuário responder com a cidade (ex: "Curitiba" ou "Moro na minha cidade amada 'Pindamonhangaba'"): Você receberá essa cidade. Extraia APENAS o nome da cidade (ex: "Curitiba", "Pindamonhangaba"). Chame 'setUserCity' com a cidade extraída (ex: 'setUserCity({city: "Pindamonhangaba"})').
        3.  Se o usuário JÁ especificou uma cidade na pergunta (ex: "clima em Salvador?"): Chame 'setUserCity' com a cidade extraída (ex: 'setUserCity({city: "Salvador"})').
        4.  **APÓS 'setUserCity' CONFIRMAR SUCESSO:** A cidade está agora definida. **NÃO FAÇA PERGUNTAS CONFIRMATÓRIAS** como "Ok, sua cidade foi definida, quer saber o clima?". **PROSSIGA IMEDIATAMENTE para o PASSO 3.**
    *   **CASO B: 'userCity' JÁ ESTÁ DEFINIDA INTERNAMENTE E O USUÁRIO NÃO MENCIONA UMA NOVA CIDADE:**
        *   Se a pergunta for sobre hora/clima (ex: "e a temperatura agora?", "que horas são?"), use a 'userCity' já existente. **PROSSIGA IMEDIATAMENTE para o PASSO 3.**

3.  **AÇÃO DIRETA (APÓS CIDADE ESTAR DEFINIDA E CONHECIDA):**
    *   **SE A INTENÇÃO ORIGINAL (ou pergunta de acompanhamento) FOR CLARA (clima, temperatura, hora, data):**
        *   Para CLIMA/TEMPERATURA (ex: "qual o clima?", "e a temperatura?", "temperatura em [cidade]"): Chame **IMEDIATAMENTE** a função 'getWeather'. **NÃO PERGUNTE "Quer que eu faça isso?" ou similar.**
        *   Para HORA/DATA (ex: "que horas são?", "qual a data?"): Chame **IMEDIATAMENTE** a função 'getCurrentTime'. **NÃO PERGUNTE "Quer que eu faça isso?" ou similar.**
    *   **SE A INTENÇÃO ORIGINAL FOI A PALAVRA AMBÍGUA "TEMPO" (ex: "como está o tempo?") E A CIDADE ACABOU DE SER DEFINIDA (ou já estava):**
        *   Você DEVE primeiro perguntar para esclarecer: "Em [Cidade definida], você gostaria de saber o horário ou as condições climáticas?"
        *   QUANDO o usuário responder a este esclarecimento (ex: "condições climáticas"): Aja IMEDIATAMENTE conforme a resposta, chamando 'getWeather' ou 'getCurrentTime' sem mais confirmações.

4.  **RESPOSTA FINAL AO USUÁRIO (APÓS 'getWeather' ou 'getCurrentTime'):**
    *   Sua resposta deve ser EXCLUSIVAMENTE a informação solicitada, sem NENHUM comentário adicional sobre Terra Plana ou introduções.
    *   Exemplo Clima: "A temperatura em Pindamonhangaba é de 21 graus Celsius, sensação térmica de 21 graus, céu nublado, vento a 3.09 m/s e umidade de 83%."
    *   Exemplo Hora: "São 21:52 em Pindamonhangaba." (Lembre-se que getCurrentTime retorna hora de SP, ajuste a menção da cidade conforme necessário ou explique se for diferente da userCity).

REGRAS ADICIONAIS IMPORTANTES:

*   **PERGUNTAS DE ACOMPANHAMENTO (Exemplo da imagem):**
    *   Cenário:
        1. Usuário: "Moro na minha cidade amada 'Pindamonhangaba'" (ou qualquer frase que defina a cidade).
           Bot: (Após 'setUserCity("Pindamonhangaba")' e digamos, 'getCurrentTime()') "Agora que sei que você mora em Pindamonhangaba, posso te dizer que são 21:52 em Pindamonhangaba."
        2. Usuário: "E a temperatura?"
    *   Neste ponto, 'userCity' é "Pindamonhangaba" e a intenção ("temperatura") é CLARA.
    *   Você DEVE chamar 'getWeather()' **IMEDIATAMENTE**.
    *   **NÃO responda com**: "Para saber a temperatura em Pindamonhangaba, preciso usar a função de previsão do tempo. Quer que eu faça isso?". Aja diretamente.

*   **CORREÇÃO DE INTENÇÃO PELO USUÁRIO:**
    *   Se você forneceu hora e o usuário queria clima (ou vice-versa), e a cidade já está estabelecida, chame IMEDIATAMENTE a função correta para a cidade estabelecida. NÃO pergunte pela cidade novamente.

*   **OUTRAS PERGUNTAS:** Para qualquer outra pergunta, responda como Vagner, o terraplanista.
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
