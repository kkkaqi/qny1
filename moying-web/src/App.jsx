import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ImportNovelPage from './pages/ImportNovelPage';
import ScreenplayEditorPage from './pages/ScreenplayEditorPage';

export default function App() {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const navigate = useNavigate();

  const showMessage = (msg, type = 'success') => {
    setGlobalMessage({ text: msg, type });
    setTimeout(() => setGlobalMessage(null), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff', padding: '16px 32px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
             onClick={() => navigate('/')}>
          <span style={{ fontSize: 28 }}>🎬</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 1 }}>墨影</h1>
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>AI 小说转剧本</p>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 20 }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>首页</button>
          <button onClick={() => navigate('/import')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>导入小说</button>
        </nav>
      </header>

      {globalLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '32px 48px', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e0e0e0', borderTopColor: '#0f3460', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p>AI 正在转换中，请稍候...</p>
          </div>
        </div>
      )}

      {globalMessage && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: globalMessage.type === 'error' ? '#dc3545' : '#28a745', color: '#fff', padding: '12px 24px', borderRadius: 8, zIndex: 10000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {globalMessage.text}
        </div>
      )}

      <main style={{ flex: 1, padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<HomePage setLoading={setGlobalLoading} showMessage={showMessage} />} />
          <Route path="/import" element={<ImportNovelPage setLoading={setGlobalLoading} showMessage={showMessage} />} />
          <Route path="/screenplay/:id" element={<ScreenplayEditorPage setLoading={setGlobalLoading} showMessage={showMessage} />} />
        </Routes>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
