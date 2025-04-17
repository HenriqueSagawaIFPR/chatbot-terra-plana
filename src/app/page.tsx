import Chatbot from '@/components/Chatbot';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Vagner - Terra Plana</h1>
          <p className="text-blue-200 text-lg">Especialista em desmascarar as mentiras da NASA</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-6 border border-blue-300/30">
            <Chatbot />
          </div>
        </div>
        <footer className="mt-12 text-center text-blue-200 text-sm">
          <p>© 2025 Henrique - Defensor da Verdade sobre a Terra Plana</p>
        </footer>
      </div>
    </main>
  );
}
