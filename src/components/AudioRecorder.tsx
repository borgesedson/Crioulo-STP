import { useState, useRef } from 'react';
import { Mic, Square, Trash2, Check } from 'lucide-react';

export default function AudioRecorder({ onRecordingComplete }: { onRecordingComplete: (blob: Blob) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Não foi possível aceder ao microfone. Verifica as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const discardRecording = () => {
    setAudioUrl(null);
    chunksRef.current = [];
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-2">Gravar Áudio da Pronúncia</h3>

      {!audioUrl && (
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              Parar Gravação
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Começar a Gravar
            </>
          )}
        </button>
      )}

      {audioUrl && (
        <div className="flex flex-col items-center gap-3 w-full">
          <audio src={audioUrl} controls className="w-full h-10" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={discardRecording}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Descartar e Gravar de Novo
            </button>
            <div className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <Check className="w-4 h-4" />
              Áudio Pronto
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
