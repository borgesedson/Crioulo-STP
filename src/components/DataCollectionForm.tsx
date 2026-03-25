import { useState } from 'react';
import { insforge } from '../lib/insforge';
import AudioRecorder from './AudioRecorder';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function DataCollectionForm() {
  const [formData, setFormData] = useState({
    contributor_name: '',
    contributor_email: '',
    word_kriolu: '',
    translation_pt: '',
    creole_type: 'Forro',
    category: 'Substantivo',
    regional_variant: '',
    example_sentence: '',
    example_translation: '',
    cultural_notes: '',
    context_usage: '',
    formality: 'Informal'
  });

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      if (!formData.word_kriolu || !formData.translation_pt) {
        throw new Error('A Palavra em Crioulo e a Tradução em Português são obrigatórias.');
      }

      let audio_url = null;
      let audio_key = null;

      // 1. Upload Audio if exists
      if (audioBlob) {
        const fileExt = 'webm';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `recordings/${fileName}`;

        // Create a File object from Blob
        const file = new File([audioBlob], fileName, { type: 'audio/webm' });

        const { data: uploadData, error: uploadError } = await insforge.storage
          .from('audios')
          .upload(filePath, file);

        if (uploadError) throw new Error(`Falha ao fazer upload do áudio: ${uploadError.message}`);
        
        if (uploadData) {
          audio_url = uploadData.url;
          audio_key = uploadData.key;
        }
      }

      // 2. Insert into DB
      const { error: dbError } = await insforge.database
        .from('dictionary')
        .insert([{
            ...formData,
            audio_url,
            audio_key
        }]);

      if (dbError) throw new Error(`Erro na Base de Dados: ${dbError.message}`);

      // Success
      setSuccess(true);
      // Reset form but keep defaults and contributor info
      setFormData({
        contributor_name: formData.contributor_name,
        contributor_email: formData.contributor_email,
        word_kriolu: '',
        translation_pt: '',
        creole_type: formData.creole_type, // keep last selected
        category: formData.category, // keep last selected
        regional_variant: '',
        example_sentence: '',
        example_translation: '',
        cultural_notes: '',
        context_usage: '',
        formality: formData.formality
      });
      setAudioBlob(null);
      setResetKey(prev => prev + 1);

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (error: any) {
      setErrorMsg(error.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl mt-8 mb-16 border border-white/20 relative z-20">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent pb-1">
          Faça a Sua Contribuição Histórica! ✨
        </h2>
        <p className="text-slate-600 mt-5 text-[1.1rem] font-medium leading-relaxed bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <strong>Não tenha medo de errar: toda a ajuda é preciosa!</strong><br />
          Quer saiba apenas uma palavra solta, uma expressão do dia-a-dia ou até um provérbio antigo dos nossos avós, partilhe connosco. Participe na nossa missão e deixe o seu nome eternizado no arquivo!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Contributor Info Section */}
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl shadow-inner">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            Quem está a ajudar?
          </h3>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">O seu Nome (Opcional)</label>
            <input
              type="text"
              name="contributor_name"
              value={formData.contributor_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              placeholder="Como gostava de ser reconhecido(a) por ajudar?"
            />
          </div>
        </div>

        {/* Core Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Palavra/Frase em Crioulo *</label>
            <input
              required
              type="text"
              name="word_kriolu"
              value={formData.word_kriolu}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
              placeholder="Ex: Muala, Bô, Káta..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Tradução em Português *</label>
            <input
              required
              type="text"
              name="translation_pt"
              value={formData.translation_pt}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none"
              placeholder="Ex: Mulher, Tu, Não..."
            />
          </div>
        </div>

        {/* Dropdowns row */}
        <div className="grid md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Qual é o Crioulo?</label>
            <select
              name="creole_type"
              value={formData.creole_type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white"
            >
              <option value="Forro">Forro (Sãotomense)</option>
              <option value="Angolar">Angolar</option>
              <option value="Lung'ie">Lung'ie (Principense)</option>
              <option value="Cabo-verdiano">Cabo-verdiano</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Categoria</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white"
            >
              <option value="Substantivo">Substantivo</option>
              <option value="Adjetivo">Adjetivo</option>
              <option value="Verbo">Verbo</option>
              <option value="Expressão">Expressão (Frase feita)</option>
              <option value="Provérbio">Provérbio</option>
              <option value="Interjeição">Interjeição</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Tom / Formalidade</label>
            <select
              name="formality"
              value={formData.formality}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white"
            >
              <option value="Informal">Informal (Uso comum)</option>
              <option value="Formal">Formal</option>
              <option value="Histórico/Antigo">Histórico / Antigo</option>
            </select>
          </div>
        </div>

        {/* Optional Metadata */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Variante Regional (Opcional)</label>
          <input
            type="text"
            name="regional_variant"
            value={formData.regional_variant}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500"
            placeholder="Ex: Falado mais a Norte de São Tomé, ou em Roça X..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Frase de Exemplo em Crioulo</label>
            <textarea
              name="example_sentence"
              value={formData.example_sentence}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Uso da palavra numa frase..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Tradução do Exemplo</label>
            <textarea
              name="example_translation"
              value={formData.example_translation}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="O que essa frase significa em português..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Notas Culturais e Contexto de Uso</label>
          <textarea
            name="cultural_notes"
            value={formData.cultural_notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500"
            placeholder="Quando é que se usa esta expressão? Existe alguma história ou costume cultural associado? (Opcional, mas muito útil)"
          />
        </div>

        {/* Audio Recorder section */}
        <hr className="border-gray-200" />
        <AudioRecorder key={resetKey} onRecordingComplete={(blob) => setAudioBlob(blob)} />
        <hr className="border-gray-200" />

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
            <p className="font-medium">Erro: {errorMsg}</p>
          </div>
        )}

        {success && (
          <div className="p-5 bg-emerald-50 border-2 border-emerald-400 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm transform transition-all animate-in zoom-in-95 duration-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <p className="font-bold text-lg">Submissão guardada na Base de Dados com sucesso! Muito obrigado.</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              A guardar base de dados e a enviar áudio...
            </>
          ) : (
            'Enviar Contribuição para o Arquivo'
          )}
        </button>
      </form>
    </div>
  );
}
