import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [urduText, setUrduText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [history, setHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
      setAudioBlob(blob);
      const formData = new FormData();
      formData.append('audio', blob, 'recording.wav');
      setIsLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/api/translate-audio/', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        setUrduText(data.urdu);
        setEnglishText(data.english);
        setHistory(prev => [{urdu: data.urdu, english: data.english, time: new Date().toLocaleTimeString()}, ...prev.slice(0, 4)]);
      } catch (error) {
        setEnglishText('Error processing audio!');
      }
      setIsLoading(false);
    };
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleTranslate = async () => {
    if (!urduText) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/translate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: urduText })
      });
      const data = await response.json();
      setEnglishText(data.english);
      setHistory(prev => [{urdu: urduText, english: data.english, time: new Date().toLocaleTimeString()}, ...prev.slice(0, 4)]);
    } catch (error) {
      setEnglishText('Error connecting to server!');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f0e8, #fde8d8)', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #c8a882, #e8956d)', padding: '25px 40px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: 'white' }}>🌐 Urdu-English Translator</h1>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>AI-powered speech & text translation using Helsinki-NLP + Whisper</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['🤖 AI Powered', '🎤 Voice Ready', '⚡ Real-time'].map((tag, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ background: 'rgba(255,255,255,0.6)', padding: '15px 40px', borderBottom: '1px solid #f0dcc8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px' }}>
          {[
            { label: 'Language', value: 'Urdu → English' },
            { label: 'Model', value: 'Helsinki-NLP' },
            { label: 'Speech', value: 'Whisper Base' },
            { label: 'Translations', value: history.length },
            { label: 'Status', value: '🟢 Live' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', padding: '8px 18px', borderRadius: '20px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <span style={{ color: '#999' }}>{stat.label}: </span>
              <span style={{ color: '#c8a882', fontWeight: '600' }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          
          {/* Input Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(200,168,130,0.2)', border: '1px solid #f0dcc8' }}>
            <h3 style={{ color: '#c8a882', marginTop: 0, fontSize: '16px' }}>🎤 Urdu Input</h3>
            <textarea
              rows={7}
              placeholder="Type Urdu text here... آپ کا متن یہاں لکھیں"
              value={urduText}
              onChange={e => setUrduText(e.target.value)}
              style={{ width: '100%', background: '#fdf8f4', border: '2px solid #f0dcc8', borderRadius: '10px', color: '#3d2b1f', padding: '12px', fontSize: '16px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{ marginTop: '12px', background: isRecording ? '#e85d5d' : '#f0dcc8', color: isRecording ? 'white' : '#c8a882', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', width: '100%', fontWeight: '600' }}>
              {isRecording ? '⏹ Stop Recording' : '🎙 Start Voice Recording'}
            </button>
            {audioBlob && <p style={{ color: '#87a96b', fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>✅ Audio recorded!</p>}
            <button
              onClick={handleTranslate}
              style={{ marginTop: '8px', background: 'linear-gradient(135deg, #c8a882, #e8956d)', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', width: '100%', fontWeight: '600', boxShadow: '0 4px 15px rgba(200,168,130,0.4)' }}>
              {isLoading ? '⏳ Translating...' : '✨ Translate →'}
            </button>
          </div>

          {/* Output Card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(200,168,130,0.2)', border: '1px solid #f0dcc8' }}>
            <h3 style={{ color: '#e8956d', marginTop: 0, fontSize: '16px' }}>📝 English Output</h3>
            <div style={{ background: '#fdf8f4', borderRadius: '10px', padding: '15px', minHeight: '180px', border: '2px solid #f0dcc8', fontSize: '16px', lineHeight: '1.8' }}>
              {englishText || <span style={{ color: '#c8a882' }}>Translation will appear here...</span>}
            </div>
            {englishText && (
              <button
                onClick={() => navigator.clipboard.writeText(englishText)}
                style={{ marginTop: '12px', background: '#f0dcc8', color: '#c8a882', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', width: '100%', fontWeight: '600' }}>
                📋 Copy Translation
              </button>
            )}
          </div>
        </div>

        {/* How to use */}
        <div style={{ marginTop: '25px', background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(200,168,130,0.2)', border: '1px solid #f0dcc8' }}>
          <h3 style={{ color: '#c8a882', marginTop: 0 }}>💡 How to Use</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            {[
              { icon: '✍️', title: 'Type Text', desc: 'Type or paste Urdu text in the input box and click Translate' },
              { icon: '🎙️', title: 'Voice Input', desc: 'Click Start Recording, speak in Urdu, then Stop Recording' },
              { icon: '📋', title: 'Copy Result', desc: 'Click Copy Translation to copy the English result to clipboard' },
            ].map((tip, i) => (
              <div key={i} style={{ background: '#fdf8f4', borderRadius: '12px', padding: '18px', border: '1px solid #f0dcc8' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{tip.icon}</div>
                <div style={{ fontWeight: '600', color: '#c8a882', marginBottom: '5px' }}>{tip.title}</div>
                <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: '25px', background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 20px rgba(200,168,130,0.2)', border: '1px solid #f0dcc8' }}>
            <h3 style={{ color: '#c8a882', marginTop: 0 }}>🕐 Recent Translations</h3>
            {history.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', padding: '12px', background: '#fdf8f4', borderRadius: '10px', marginBottom: '10px', border: '1px solid #f0dcc8' }}>
                <div style={{ color: '#3d2b1f', fontSize: '14px' }}>{item.urdu}</div>
                <div style={{ color: '#e8956d', fontSize: '14px' }}>{item.english}</div>
                <div style={{ color: '#ccc', fontSize: '12px' }}>{item.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;