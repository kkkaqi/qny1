import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { importNovel, getNovel, addChapters, convertToScreenplay } from '../api/client';

export default function ImportNovelPage({ setLoading, showMessage }) {
  const navigate = useNavigate(); const location = useLocation(); const [searchParams] = useSearchParams();
  const novelId = location.state?.novelId || searchParams.get('novelId');
  const [mode, setMode] = useState(novelId ? 'append' : 'new');
  const [novel, setNovel] = useState(null);
  const [title, setTitle] = useState(''); const [author, setAuthor] = useState(''); const [summary, setSummary] = useState('');
  const [chapters, setChapters] = useState([{ title: '', content: '' }, { title: '', content: '' }, { title: '', content: '' }]);
  const [customInstruction, setCustomInstruction] = useState(''); const [convertAfterImport, setConvertAfterImport] = useState(true);

  useEffect(() => { if (novelId) loadNovel(); }, [novelId]);
  const loadNovel = async () => { try { const res = await getNovel(novelId); setNovel(res.data); setTitle(res.data.title); setAuthor(res.data.author || ''); setSummary(res.data.summary || ''); } catch (e) { showMessage(e.message, 'error'); } };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      // 按章节标题拆分：匹配 "第X章" 或 "第X章：标题" 或 "**第X章：标题**"
      const chapterRegex = /(?:^|\n)\s*(?:\*{0,2})\s*第\s*([一二三四五六七八九十\d]+)\s*章\s*[：:]?\s*([^\n]*)/g;
      const matches = [...text.matchAll(chapterRegex)];
      if (matches.length < 3) { showMessage('未检测到至少 3 个章节，请确认 txt 中包含"第X章"标识', 'error'); return; }
      const parsed = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index + matches[i][0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
        const title = (matches[i][2] || '').trim() || `第${matches[i][1]}章`;
        const content = text.slice(start, end).trim();
        if (content.length > 20) parsed.push({ title, content });
      }
      if (parsed.length >= 3) { setChapters(parsed); showMessage(`已识别 ${parsed.length} 个章节`); }
      else { showMessage('章节内容不足，请检查格式', 'error'); }
    };
    reader.readAsText(file, 'UTF-8');
  };
  const addChapter = () => setChapters([...chapters, { title: '', content: '' }]);
  const removeChapter = (idx) => { if (chapters.length <= 3) { showMessage('至少需要保留 3 个章节', 'error'); return; } setChapters(chapters.filter((_, i) => i !== idx)); };
  const updateChapter = (idx, field, value) => { const updated = [...chapters]; updated[idx] = { ...updated[idx], [field]: value }; setChapters(updated); };

  const handleSubmit = async () => {
    if (!title.trim()) { showMessage('请输入小说标题', 'error'); return; }
    const filled = chapters.filter(c => c.title.trim() && c.content.trim());
    if (filled.length < 3) { showMessage('请至少填写 3 个章节', 'error'); return; }
    setLoading(true);
    try {
      let tid = novelId;
      let prevCount = novel ? novel.totalChapters : 0;
      if (mode === 'new') { const res = await importNovel({ title: title.trim(), author: author.trim(), summary: summary.trim(), chapters: filled.map(c => ({ title: c.title.trim(), content: c.content.trim() })) }); tid = res.data.id; showMessage('小说导入成功'); }
      else { const res = await addChapters(tid, filled.map(c => ({ title: c.title.trim(), content: c.content.trim() }))); prevCount = res.data.totalChapters - filled.length; showMessage('章节追加成功'); }
      if (convertAfterImport) { const res = await convertToScreenplay(tid, { novelId: tid, mode: 'AI', customInstruction: customInstruction.trim() || null }); showMessage('AI 剧本转换完成！'); navigate(`/screenplay/${res.data.id}`); }
      else { navigate('/'); }
    } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); }
  };

  const is = { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' };
  const ts = { ...is, minHeight: 150, resize: 'vertical', fontFamily: 'inherit' };
  const cs = { background: '#fff', borderRadius: 10, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{mode === 'new' ? '导入小说' : `追加章节 — ${novel?.title || ''}`}</h2>
      {mode === 'new' && (
        <div style={cs}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>基本信息</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>小说标题 *</label><input style={is} value={title} onChange={e => setTitle(e.target.value)} placeholder="请输入小说标题" /></div>
            <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>作者</label><input style={is} value={author} onChange={e => setAuthor(e.target.value)} placeholder="请输入作者名" /></div>
          </div>
          <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>简介</label><textarea style={{ ...ts, minHeight: 80 }} value={summary} onChange={e => setSummary(e.target.value)} placeholder="简要描述小说内容（可选）" /></div>
        </div>
      )}
      <div style={cs}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>章节内容（至少 3 章）</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addChapter} style={{ background: '#e3f2fd', border: 'none', color: '#1976d2', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>+ 添加章节</button>
            <label style={{ background: '#fff3e0', border: 'none', color: '#e65100', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              📄 导入 txt
              <input type="file" accept=".txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        {chapters.map((ch, idx) => (
          <div key={idx} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 12, background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f3460' }}>第 {idx + 1} 章</span>
              {chapters.length > 3 && <button onClick={() => removeChapter(idx)} style={{ background: 'transparent', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 13 }}>删除</button>}
            </div>
            <input style={{ ...is, marginBottom: 10 }} value={ch.title} onChange={e => updateChapter(idx, 'title', e.target.value)} placeholder={`第 ${idx + 1} 章标题`} />
            <textarea style={ts} value={ch.content} onChange={e => updateChapter(idx, 'content', e.target.value)} placeholder={`请粘贴第 ${idx + 1} 章的正文内容...`} />
          </div>
        ))}
      </div>
      <div style={cs}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>转换选项</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="checkbox" checked={convertAfterImport} onChange={e => setConvertAfterImport(e.target.checked)} />导入后立即进行 AI 剧本转换</label>
        </div>
        {convertAfterImport && <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>自定义转换指令（可选）</label><textarea style={{ ...ts, minHeight: 80 }} value={customInstruction} onChange={e => setCustomInstruction(e.target.value)} placeholder="例：请将对话风格改为古装剧风格 / 加重主角的内心独白" /></div>}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/')} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#666', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>取消</button>
        <button onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #0f3460, #16213e)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>{convertAfterImport ? '导入并 AI 转换' : '导入小说'}</button>
      </div>
    </div>
  );
}
