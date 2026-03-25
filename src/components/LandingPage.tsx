import { ArrowRight, BrainCircuit, Globe2, GraduationCap } from 'lucide-react';

export default function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-5xl mx-auto py-12 px-6 relative z-10">
      {/* Hero Section */}
      <div className="text-center space-y-8 mb-20 relative mt-4">
        <div className="inline-flex px-5 py-2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm mb-2 border border-emerald-200 shadow-md transform transition-all hover:scale-105">
          Projeto de Preservação e Inteligência Artificial
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
          A Voz de São Tomé e Príncipe na <br/>
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent drop-shadow-sm">Era Digital</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mt-6">
          Uma plataforma digital interativa aberta a todos para a <strong>aprendizagem e ensino</strong> dos nossos Crioulos. Simultaneamente, estamos a construir a primeira grande base de dados linguística nacional para treinar a Inteligência Artificial do futuro.
        </p>
        
        <div className="pt-8">
          <button 
            onClick={onStart}
            className="px-10 py-5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full font-extrabold text-xl shadow-2xl shadow-emerald-900/30 transition-all flex items-center gap-4 mx-auto group transform hover:-translate-y-1"
          >
            Fazer a Minha Contribuição Agora
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>

      {/* Features/Purpose Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-20">
        <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] shadow-xl border border-white hover:shadow-2xl transition-all group">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-4">Treinar a IA do Futuro</h3>
          <p className="text-slate-600 text-lg leading-relaxed">
            As palavras e áudios que partilhar connosco vão alimentar diretamente modelos de Machine Learning. O objetivo a longo prazo é permitir que ferramentas globais de tradução na web consigam compreender e traduzir as nossas línguas maternas (Forro, Angolar, Lung'ie).
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] shadow-xl border border-white hover:shadow-2xl transition-all group">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <Globe2 className="w-8 h-8" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-4">Reconhecimento Global</h3>
          <p className="text-slate-600 text-lg leading-relaxed">
            Queremos colocar e demarcar os nossos crioulos de forma oficial na internet. Evitando que a nossa rica herança imaterial se perca com as gerações, cada frase sua contribui para que as nossas raízes sobrevivam para sempre no mundo digital.
          </p>
        </div>
      </div>

      {/* About the Author / Thesis Section */}
      <div className="bg-slate-900 text-white rounded-[2rem] p-10 md:p-14 relative overflow-hidden shadow-2xl border border-slate-800">
        {/* Decorative lights inside card */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen opacity-20 filter blur-[80px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-screen opacity-20 filter blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
          <div className="w-32 h-32 rounded-full bg-slate-800/80 border-4 border-emerald-500/40 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <GraduationCap className="w-16 h-16 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold mb-4 flex items-center gap-3">
              Investigação Científica e Preservação
            </h3>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              Esta infraestrutura sofisticada está a ser inteiramente arquitetada, estudada e desenvolvida na íntegra por <strong className="text-emerald-300 font-extrabold text-xl font-mono px-2 bg-emerald-900/30 rounded">Edson Cuna</strong>, investigador no ramo de Engenharia de Software. <br/><br/>
              O trabalho não é apenas uma plataforma de recolha, mas constitui a componente prática da <strong>sua tese de Pós-Graduação em Engenharia de Software</strong> na sua universidade, unindo a preservação cultural tradicional à mais alta tecnologia do século XXI.
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 text-emerald-300 font-semibold rounded-xl border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Apoie a investigação nacional hoje mesmo.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
