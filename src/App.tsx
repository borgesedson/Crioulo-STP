import { useState } from 'react';
import DataCollectionForm from './components/DataCollectionForm';
import LandingPage from './components/LandingPage';
import { Globe, ArrowLeft } from 'lucide-react';

function App() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden text-slate-900">
      {/* Dynamic Background with Blurs (Glassmorphism effect) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 pointer-events-none"></div>

      {/* Premium Header */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-white/50 shadow-sm py-5 px-6 md:px-12 flex items-center justify-between transition-all">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowForm(false)}>
          <div className="w-[50px] h-[35px] shrink-0 shadow-md shadow-emerald-900/10 rounded overflow-hidden border border-slate-200/60 bg-white">
            <img src="https://flagcdn.com/st.svg" alt="Bandeira de São Tomé e Príncipe" className="w-full h-full object-cover scale-[1.05]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight tracking-tight">Crioulo STP</h1>
            <div className="flex items-center gap-1.5 mt-0.5 text-emerald-600 font-bold tracking-widest text-[10px] uppercase">
              <Globe className="w-3 h-3" />
              <span>Arquivo Digital</span>
            </div>
          </div>
        </div>
        
        {showForm ? (
          <button 
            onClick={() => setShowForm(false)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-sm font-semibold tracking-wide text-slate-700 border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-xs font-semibold tracking-wide text-emerald-700 border border-emerald-200 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Plataforma Aberta e Ativa
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 relative z-10 pt-4">
        {showForm ? <DataCollectionForm /> : <LandingPage onStart={() => setShowForm(true)} />}
      </main>
      
      {/* Footer */}
      <footer className="text-center py-12 text-slate-500 text-sm font-medium relative z-10">
        <p>Desenvolvido orgulhosamente como parte da investigação em Engenharia de Software.</p>
        <p className="mt-2 text-slate-400">Proteção total dos dados culturais locais.</p>
      </footer>
    </div>
  );
}

export default App;
