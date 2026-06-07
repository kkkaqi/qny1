import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getScreenplay, updateScene, updateScreenplay, exportYaml, addScene, deleteScene, addDialogue, deleteDialogueApi, addActionApi, deleteActionApi, getNovel, updateCharacter } from '../api/client';

export default function ScreenplayEditorPage({ setLoading, showMessage }) {
  const { id } = useParams(); const navigate = useNavigate();
  const [screenplay, setScreenplay] = useState(null);
  const [activeTab, setActiveTab] = useState('scenes');
  const [editingScene, setEditingScene] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [novel, setNovel] = useState(null);

  useEffect(() => { if (id) loadScreenplay(); }, [id]);
  const loadScreenplay = useCallback(async () => { try { setLoading(true); const res = await getScreenplay(id); setScreenplay(res.data); if (res.data.novelId) { const nr = await getNovel(res.data.novelId); setNovel(nr.data); } } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); } }, [id]);

  const handleUpdateMeta = async () => { try { await updateScreenplay(id, { title: screenplay.title, subtitle: screenplay.subtitle || '' }); showMessage('剧本信息已更新'); } catch (e) { showMessage(e.message, 'error'); } };

  const handleSaveScene = async (scene, originalScene) => {
    try { setLoading(true);
      await updateScene(id, scene.id, { title: scene.title, setting: scene.setting, location: scene.location, timeOfDay: scene.timeOfDay, summary: scene.summary });
      // 同步新增的对白
      const origDlgIds = (originalScene.dialogues || []).map(d => d.id);
      for (const d of (scene.dialogues || [])) { if (!d.id) await addDialogue(id, scene.id, { characterName: d.characterName || '角色名', text: d.text || '对白内容', direction: d.direction || '' }); }
      // 同步新增的动作
      const origActIds = (originalScene.actions || []).map(a => a.id);
      for (const a of (scene.actions || [])) { const desc = typeof a === 'string' ? a : (a.description || ''); const aid = typeof a === 'object' ? a.id : undefined; if (!aid && desc) await addActionApi(id, scene.id, { description: desc }); }
      showMessage('场景已保存'); setEditingScene(null); await loadScreenplay();
    } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); }
  };

  const handleExportYaml = async () => { try { const yaml = await exportYaml(id); const blob = new Blob([yaml], { type: 'application/x-yaml' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `screenplay-${id}.yaml`; a.click(); URL.revokeObjectURL(url); showMessage('YAML 文件已下载'); } catch (e) { showMessage(e.message, 'error'); } };

  const handleAddScene = async () => { try { setLoading(true); await addScene(id); await loadScreenplay(); showMessage('场景已添加'); } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); } };
  const handleDeleteScene = async (scId, e) => { e.stopPropagation(); if (!confirm('确定删除这个场景？')) return; try { setLoading(true); await deleteScene(id, scId); await loadScreenplay(); showMessage('场景已删除'); } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); } };
  const handleDeleteDialogue = async (dId) => { try { await deleteDialogueApi(id, dId); await loadScreenplay(); showMessage('对白已删除'); } catch (e) { showMessage(e.message, 'error'); } };
  const handleDeleteAction = async (aId) => { try { await deleteActionApi(id, aId); await loadScreenplay(); showMessage('动作已删除'); } catch (e) { showMessage(e.message, 'error'); } };
  const handleUpdateCharacter = async (chId, data) => { try { await updateCharacter(id, chId, data); await loadScreenplay(); showMessage('角色已更新'); } catch (e) { showMessage(e.message, 'error'); } };

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
          <button onClick={() => setActiveTab('source')} style={tabStyle('source')}>查看原文</button>
        </div>
        <div style={{ padding: 20 }}>
          {activeTab === 'scenes' && (editingScene ? (
            <SceneEditForm key={formKey} scene={editingScene} onSave={handleSaveScene} onCancel={() => setEditingScene(null)} onDeleteScene={(scId) => { setEditingScene(null); handleDeleteScene(scId, { stopPropagation: () => {} }); }} onDeleteDialogue={handleDeleteDialogue} onDeleteAction={handleDeleteAction} />
          ) : (
            <div>
              <button onClick={handleAddScene} style={{ background: '#e3f2fd', border: 'none', color: '#1976d2', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14, marginBottom: 12 }}>+ 添加场景</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(screenplay.scenes || []).map(scene => (
                  <div key={scene.id} style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 14, cursor: 'pointer', position: 'relative' }}>
                    <div onClick={() => setEditingScene(scene)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ background: '#0f3460', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>场景 {scene.sceneNumber}</span>
                        <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{{INT:'内景',EXT:'外景','INT/EXT':'内外景'}[scene.setting] || scene.setting}. {scene.location || '未指定'} — {{DAY:'白天',NIGHT:'夜晚',DAWN:'黎明',DUSK:'黄昏'}[scene.timeOfDay] || scene.timeOfDay}</span>
                        {scene.title && <span style={{ fontWeight: 600, fontSize: 14 }}>{scene.title}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{scene.summary}</p>
                      <div style={{ fontSize: 12, color: '#999' }}>{(scene.dialogues || []).length} 句对白 · {(scene.actions || []).length} 个动作</div>
                    </div>
                    <button onClick={(e) => handleDeleteScene(scene.id, e)} style={{ position: 'absolute', top: 8, right: 8, background: '#fce4ec', border: 'none', color: '#c62828', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>删除</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {activeTab === 'characters' && <CharactersTab characters={screenplay.characters || []} onUpdate={handleUpdateCharacter} />}
          {activeTab === 'yaml' && <pre style={{ background: '#1a1a2e', color: '#e0e0e0', padding: 20, borderRadius: 8, fontSize: 13, lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: "'Fira Code', Consolas, monospace" }}>{screenplay.yamlContent || '暂无 YAML 内容'}</pre>}
          {activeTab === 'source' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!novel ? <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>加载中...</p>
              : (novel.chapters || []).length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无原文</p>
              : (novel.chapters || []).map(ch => (
                <div key={ch.id} style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#f5f5f5', padding: '10px 16px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid #e8e8e8' }}>
                    第 {ch.chapterNumber} 章：{ch.title}
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 400, marginLeft: 12 }}>{ch.wordCount} 字</span>
                  </div>
                  <pre style={{ padding: 16, margin: 0, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#333' }}>{ch.content}</pre>
                </div>
              ))
            }</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CharactersTab({ characters, onUpdate }) {
  const [editing, setEditing] = useState(null);
  if (editing) { const c = editing; return <CharacterEditForm character={c} onSave={(data) => { onUpdate(c.id, data); setEditing(null); }} onCancel={() => setEditing(null)} />; }
  const tl = { PROTAGONIST: '主角', ANTAGONIST: '反派', SUPPORTING: '配角', MINOR: '龙套' };
  const tc = { PROTAGONIST: '#1976d2', ANTAGONIST: '#c62828', SUPPORTING: '#2e7d32', MINOR: '#666' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {characters.map((c, i) => (
        <div key={i} onClick={() => setEditing(c)} style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: '#fafafa', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</span>
            <span style={{ background: tc[c.characterType] || '#999', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{tl[c.characterType] || c.characterType}</span>
          </div>
          {c.description && <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>{c.description}</p>}
          {c.traits && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{c.traits.split(',').map((t, j) => <span key={j} style={{ background: '#e3f2fd', color: '#1976d2', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{t.trim()}</span>)}</div>}
        </div>
      ))}
    </div>
  );
}

function CharacterEditForm({ character, onSave, onCancel }) {
  const [name, setName] = useState(character.name || '');
  const [desc, setDesc] = useState(character.description || '');
  const [traits, setTraits] = useState(character.traits || '');
  const [type, setType] = useState(character.characterType || 'SUPPORTING');
  const is = { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' };
  return (
    <div style={{ maxWidth: 500 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>编辑角色</h3>
      <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>名称</label><input style={is} value={name} onChange={e => setName(e.target.value)} /></div>
      <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>角色类型</label><select style={is} value={type} onChange={e => setType(e.target.value)}><option value="PROTAGONIST">主角</option><option value="ANTAGONIST">反派</option><option value="SUPPORTING">配角</option><option value="MINOR">龙套</option></select></div>
      <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>简述</label><textarea style={{ ...is, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={desc} onChange={e => setDesc(e.target.value)} /></div>
      <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>特征标签（逗号分隔）</label><input style={is} value={traits} onChange={e => setTraits(e.target.value)} placeholder="如：主角, 侦探, 固执" /></div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#666', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>取消</button>
        <button onClick={() => onSave({ name: name.trim(), description: desc.trim(), traits: traits.trim(), characterType: type })} style={{ background: '#0f3460', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>保存</button>
      </div>
    </div>
  );
}

function SceneEditForm({ scene, onSave, onCancel, onDeleteScene, onDeleteDialogue, onDeleteAction }) {
  const [form, setForm] = useState({ ...scene });
  const [pendingDeletes, setPendingDeletes] = useState({ dialogues: [], actions: [] });
  const update = (field, value) => setForm({ ...form, [field]: value });
  const is = { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' };
  const btnDel = { background: '#fce4ec', border: 'none', color: '#c62828', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 };
  const btnAdd = { background: '#e3f2fd', border: 'none', color: '#1976d2', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginTop: 4 };

  const localAddDialogue = () => {
    const ds = [...(form.dialogues || []), { characterName: '', text: '', direction: '' }];
    update('dialogues', ds);
  };
  const localAddAction = () => {
    const as = [...(form.actions || []), ''];
    update('actions', as);
  };
  const localDeleteDialogue = (idx, d) => {
    if (d.id) {
      onDeleteDialogue(d.id, scene.id);
      setPendingDeletes(prev => ({ ...prev, dialogues: [...prev.dialogues, d.id] }));
    }
    const ds = [...(form.dialogues || [])]; ds.splice(idx, 1); update('dialogues', ds);
  };
  const localDeleteAction = (idx, a) => {
    const aid = typeof a === 'object' ? a.id : undefined;
    if (aid) {
      onDeleteAction(aid, scene.id);
      setPendingDeletes(prev => ({ ...prev, actions: [...prev.actions, aid] }));
    }
    const as = [...(form.actions || [])]; as.splice(idx, 1); update('actions', as);
  };

  const handleSave = () => onSave(form, scene);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>编辑场景 {scene.sceneNumber}</h3>
        <button onClick={() => { if (confirm('确定删除这个场景？')) onDeleteScene(scene.id); }} style={{ background: '#dc3545', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>删除场景</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>标题</label><input style={is} value={form.title || ''} onChange={e => update('title', e.target.value)} placeholder="如：初遇咖啡馆" /></div>
        <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>类型</label><select style={is} value={form.setting || 'INT'} onChange={e => update('setting', e.target.value)}><option value="INT">内景</option><option value="EXT">外景</option><option value="INT/EXT">内外景</option></select></div>
        <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>时间</label><select style={is} value={form.timeOfDay || 'DAY'} onChange={e => update('timeOfDay', e.target.value)}><option value="DAY">白天</option><option value="NIGHT">夜晚</option><option value="DAWN">黎明</option><option value="DUSK">黄昏</option></select></div>
      </div>
      <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>地点</label><input style={is} value={form.location || ''} onChange={e => update('location', e.target.value)} placeholder="如：市中心咖啡馆内" /></div>
      <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>概要</label><textarea style={{ ...is, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={form.summary || ''} onChange={e => update('summary', e.target.value)} /></div>

      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>对白 ({(form.dialogues || []).length})</h4>
      {(form.dialogues || []).map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 220px 30px', gap: 8, marginBottom: 8 }}>
          <input style={is} value={d.characterName || ''} onChange={e => { const ds = [...form.dialogues]; ds[i] = { ...ds[i], characterName: e.target.value }; update('dialogues', ds); }} placeholder="角色名" />
          <input style={is} value={d.text || ''} onChange={e => { const ds = [...form.dialogues]; ds[i] = { ...ds[i], text: e.target.value }; update('dialogues', ds); }} placeholder="对白" />
          <input style={is} value={d.direction || ''} onChange={e => { const ds = [...form.dialogues]; ds[i] = { ...ds[i], direction: e.target.value }; update('dialogues', ds); }} placeholder="指导" />
          <button onClick={() => localDeleteDialogue(i, d)} style={btnDel} title="删除对白">×</button>
        </div>
      ))}
      <button onClick={localAddDialogue} style={btnAdd}>+ 添加对白</button>

      <h4 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 8px' }}>动作 ({(form.actions || []).length})</h4>
      {(form.actions || []).map((a, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <textarea style={{ ...is, minHeight: 50, resize: 'vertical', fontFamily: 'inherit', flex: 1 }} value={typeof a === 'string' ? a : (a.description || '')} onChange={e => { const as = [...form.actions]; as[i] = typeof as[i] === 'string' ? e.target.value : { ...as[i], description: e.target.value }; update('actions', as); }} />
          <button onClick={() => localDeleteAction(i, a)} style={{ ...btnDel, alignSelf: 'flex-start' }} title="删除动作">×</button>
        </div>
      ))}
      <button onClick={localAddAction} style={btnAdd}>+ 添加动作</button>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onCancel} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#666', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>取消</button>
        <button onClick={handleSave} style={{ background: '#0f3460', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>保存场景</button>
      </div>
    </div>
  );
}
