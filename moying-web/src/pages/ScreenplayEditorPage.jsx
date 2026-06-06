import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScreenplay, updateScene, updateScreenplay, exportYaml } from '../api/client';

export default function ScreenplayEditorPage({ setLoading, showMessage }) {
  const { id } = useParams(); const navigate = useNavigate();
  const [screenplay, setScreenplay] = useState(null);
  const [activeTab, setActiveTab] = useState('scenes');
  const [editingScene, setEditingScene] = useState(null);

  useEffect(() => { if (id) loadScreenplay(); }, [id]);
  const loadScreenplay = useCallback(async () => { try { setLoading(true); const res = await getScreenplay(id); setScreenplay(res.data); } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); } }, [id]);

  const handleUpdateMeta = async () => { try { await updateScreenplay(id, { title: screenplay.title, subtitle: screenplay.subtitle || '' }); showMessage('剧本信息已更新'); } catch (e) { showMessage(e.message, 'error'); } };
  const handleSaveScene = async (scene) => { try { setLoading(true); await updateScene(id, scene.id, { title: scene.title, setting: scene.setting, location: scene.location, timeOfDay: scene.timeOfDay, summary: scene.summary }); showMessage('场景已保存'); setEditingScene(null); await loadScreenplay(); } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); } };
  const handleExportYaml = async () => { try { const yaml = await exportYaml(id); const blob = new Blob([yaml], { type: 'application/x-yaml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `screenplay-${id}.yaml`; a.click(); URL.revokeObjectURL(url); showMessage('YAML 文件已下载'); } catch (e) { showMessage(e.message, 'error'); } };

  if (!screenplay) return <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>;

  const tabStyle = (tab) => ({ padding: '10px 20px', cursor: 'pointer', borderBottom: activeTab === tab ? '3px solid #0f3460' : '3px solid transparent', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#0f3460' : '#666', background: 'transparent', border: 'none', fontSize: 14 });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <input style={{ fontSize: 22, fontWeight: 700, border: '1px solid transparent', padding: '4px 8px', borderRadius: 4, background: 'transparent', outline: 'none', flex: 1 }} value={screenplay.title} onChange={e => setScreenplay({ ...screenplay, title: e.target.value })} onBlur={handleUpdateMeta} />
              <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>v{screenplay.version}</span>
            </div>
            <input style={{ fontSize: 14, color: '#888', border: '1px solid transparent', padding: '4px 8px', borderRadius: 4, background: 'transparent', outline: 'none', width: '100%' }} value={screenplay.subtitle || ''} onChange={e => setScreenplay({ ...screenplay, subtitle: e.target.value })} onBlur={handleUpdateMeta} placeholder="添加副标题..." />
            <p style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>{(screenplay.scenes || []).length} 个场景 · {(screenplay.characters || []).length} 个角色</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportYaml} style={{ background: '#0f3460', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>导出 YAML</button>
            <button onClick={() => navigate('/')} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#666', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>返回</button>
          </div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 20px' }}>
          <button onClick={() => setActiveTab('scenes')} style={tabStyle('scenes')}>场景 ({(screenplay.scenes || []).length})</button>
          <button onClick={() => setActiveTab('characters')} style={tabStyle('characters')}>角色 ({(screenplay.characters || []).length})</button>
          <button onClick={() => setActiveTab('yaml')} style={tabStyle('yaml')}>YAML 预览</button>
        </div>
        <div style={{ padding: 20 }}>
          {activeTab === 'scenes' && (editingScene ? <SceneEditForm scene={editingScene} onSave={handleSaveScene} onCancel={() => setEditingScene(null)} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(screenplay.scenes || []).map(scene => (
                <div key={scene.id} onClick={() => setEditingScene(scene)} style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 14, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ background: '#0f3460', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>场景 {scene.sceneNumber}</span>
                    <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{scene.setting}. {scene.location || '未指定'} — {scene.timeOfDay}</span>
                    {scene.title && <span style={{ fontWeight: 600, fontSize: 14 }}>{scene.title}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{scene.summary}</p>
                  <div style={{ fontSize: 12, color: '#999' }}>{(scene.dialogues || []).length} 句对白 · {(scene.actions || []).length} 个动作</div>
                </div>
              ))}
            </div>
          ))}
          {activeTab === 'characters' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {(screenplay.characters || []).map((c, i) => {
                const tl = { PROTAGONIST: '主角', ANTAGONIST: '反派', SUPPORTING: '配角', MINOR: '龙套' };
                const tc = { PROTAGONIST: '#1976d2', ANTAGONIST: '#c62828', SUPPORTING: '#2e7d32', MINOR: '#666' };
                return (
                  <div key={i} style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</span>
                      <span style={{ background: tc[c.characterType] || '#999', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{tl[c.characterType] || c.characterType}</span>
                    </div>
                    {c.description && <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>{c.description}</p>}
                    {c.traits && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{c.traits.split(',').map((t, j) => <span key={j} style={{ background: '#e3f2fd', color: '#1976d2', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{t.trim()}</span>)}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {activeTab === 'yaml' && <pre style={{ background: '#1a1a2e', color: '#e0e0e0', padding: 20, borderRadius: 8, fontSize: 13, lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: "'Fira Code', Consolas, monospace" }}>{screenplay.yamlContent || '暂无 YAML 内容'}</pre>}
        </div>
      </div>
    </div>
  );
}

function SceneEditForm({ scene, onSave, onCancel }) {
  const [form, setForm] = useState({ ...scene });
  const update = (field, value) => setForm({ ...form, [field]: value });
  const is = { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' };
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>编辑场景 {scene.sceneNumber}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>标题</label><input style={is} value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="如：初遇咖啡馆" /></div>
        <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>类型</label><select style={is} value={form.setting || 'INT'} onChange={e => update('setting', e.target.value)}><option value="INT">INT</option><option value="EXT">EXT</option><option value="INT/EXT">INT/EXT</option></select></div>
        <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>时间</label><select style={is} value={form.timeOfDay || 'DAY'} onChange={e => update('timeOfDay', e.target.value)}><option value="DAY">DAY</option><option value="NIGHT">NIGHT</option><option value="DAWN">DAWN</option><option value="DUSK">DUSK</option></select></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>地点</label><input style={is} value={form.location || ''} onChange={e => update('location', e.target.value)} placeholder="如：市中心咖啡馆内" /></div>
      <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>概要</label><textarea style={{ ...is, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={form.summary || ''} onChange={e => update('summary', e.target.value)} /></div>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>对白</h4>
      {(form.dialogues || []).map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: 8, marginBottom: 8 }}>
          <input style={is} value={d.characterName} onChange={e => { const ds = [...form.dialogues]; ds[i] = { ...ds[i], characterName: e.target.value }; update('dialogues', ds); }} placeholder="角色名" />
          <input style={is} value={d.text} onChange={e => { const ds = [...form.dialogues]; ds[i] = { ...ds[i], text: e.target.value }; update('dialogues', ds); }} placeholder="对白" />
          <input style={is} value={d.direction || ''} onChange={e => { const ds = [...form.dialogues]; ds[i] = { ...ds[i], direction: e.target.value }; update('dialogues', ds); }} placeholder="指导" />
        </div>
      ))}
      <h4 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 8px' }}>动作</h4>
      {(form.actions || []).map((a, i) => (
        <textarea key={i} style={{ ...is, minHeight: 50, marginBottom: 8, resize: 'vertical', fontFamily: 'inherit' }} value={a.description || a} onChange={e => { const as = [...form.actions]; as[i] = typeof as[i] === 'string' ? e.target.value : { ...as[i], description: e.target.value }; update('actions', as); }} />
      ))}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onCancel} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#666', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>取消</button>
        <button onClick={() => onSave(form)} style={{ background: '#0f3460', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>保存场景</button>
      </div>
    </div>
  );
}
