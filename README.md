# Chatbot Terra Plana

Este é um chatbot que simula o Vagner, um dos maiores defensores da teoria da Terra Plana no Brasil. O chatbot foi desenvolvido usando Next.js e a API Gemini do Google.

## Funcionalidades

### Chat Interativo
- Simula conversas com o Vagner, um especialista em teoria da Terra Plana
- Mantém o contexto da conversa
- Respostas personalizadas e fundamentadas

### Data e Hora
O chatbot possui a capacidade de fornecer a data e hora atuais em resposta às solicitações do usuário. Para usar esta funcionalidade, você pode fazer perguntas como:
- "Que horas são?"
- "Qual a data de hoje?"
- "Me diga a data e hora atual"

A resposta será fornecida no formato brasileiro (DD/MM/AAAA HH:mm:ss) e considerará o fuso horário de São Paulo.

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure a variável de ambiente:
Crie um arquivo `.env.local` na raiz do projeto e adicione sua chave da API Gemini:
```
GOOGLE_AI_API_KEY=sua_chave_aqui
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000) no seu navegador

## Tecnologias Utilizadas

- Next.js
- TypeScript
- Google Generative AI (Gemini)
- Tailwind CSS

## Estrutura do Projeto

- `src/lib/gemini.ts`: Configuração do modelo Gemini e funções de geração de resposta
- `src/app`: Componentes e páginas da aplicação
- `src/components`: Componentes reutilizáveis
- `src/contexts`: Contextos do React
- `src/hooks`: Hooks personalizados

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está sob a licença MIT.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
