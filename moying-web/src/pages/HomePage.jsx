import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNovels, deleteNovel, getScreenplays, deleteScreenplay } from '../api/client';

export default function HomePage({ setLoading, showMessage }) {
  const [novels, setNovels] = useState([]);
  const [screenplays, setScreenplays] = useState({});
  const [expandedNovel, setExpandedNovel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadNovels(); }, []);

  const loadNovels = async () => {
    try { setLoading(true); const res = await listNovels(); setNovels(res.data || []); } catch (e) { showMessage(e.message, 'error'); } finally { setLoading(false); }
  };

  const loadScreenplays = async (novelId) => {
    if (screenplays[novelId]) return;
    try { const res = await getScreenplays(novelId); setScreenplays(prev => ({ ...prev, [novelId]: res.data || [] })); } catch (e) { showMessage(e.message, 'error'); }
  };

  const toggleExpand = (novelId) => {
    if (expandedNovel === novelId) { setExpandedNovel(null); } else { setExpandedNovel(novelId); loadScreenplays(novelId); }
  };

  const handleDeleteNovel = async (id, e) => { e.stopPropagation(); if (!confirm('确定删除这部小说及其所有剧本？')) return; try { await deleteNovel(id); showMessage('删除成功'); loadNovels(); } catch (e) { showMessage(e.message, 'error'); } };
  const handleDeleteScreenplay = async (id, e) => { e.stopPropagation(); if (!confirm('确定删除这个剧本？')) return; try { await deleteScreenplay(id); showMessage('删除成功'); setScreenplays({}); loadNovels(); } catch (e) { showMessage(e.message, 'error'); } };

  const statusBadge = (status) => {
    const colors = { PENDING: '#ffc107', PROCESSING: '#17a2b8', COMPLETED: '#28a745', FAILED: '#dc3545', DRAFT: '#6c757d', REVIEW: '#fd7e14', POLISHED: '#007bff', FINAL: '#28a745' };
    return <span style={{ background: colors[status] || '#999', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{status}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>我的小说 <span style={{ color: '#999', fontSize: 14, fontWeight: 400 }}>({novels.length} 部)</span></h2>
        <button onClick={() => navigate('/import')} style={{ background: 'linear-gradient(135deg, #0f3460, #16213e)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>+ 导入新小说</button>
      </div>
      {novels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📚</p>
          <p style={{ fontSize: 18, marginBottom: 8 }}>还没有导入小说</p>
          <p style={{ fontSize: 14 }}>点击「导入新小说」开始创作你的第一部剧本吧</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {novels.map(novel => (
            <div key={novel.id} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div onClick={() => toggleExpand(novel.id)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600 }}>{novel.title}</h3>
                    {statusBadge(novel.status)}
                  </div>
                  <p style={{ fontSize: 13, color: '#888' }}>{novel.author && `作者：${novel.author} · `}{novel.totalChapters} 章</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate('/import', { state: { novelId: novel.id } })} style={{ background: '#e3f2fd', border: 'none', color: '#1976d2', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>追加章节</button>
                  <button onClick={() => navigate(`/import?novelId=${novel.id}`)} style={{ background: '#e8f5e9', border: 'none', color: '#2e7d32', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>AI 转换</button>
                  <button onClick={(e) => handleDeleteNovel(novel.id, e)} style={{ background: '#fce4ec', border: 'none', color: '#c62828', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>删除</button>
                </div>
              </div>
              {expandedNovel === novel.id && (
                <div style={{ borderTop: '1px solid #eee', padding: '12px 20px 20px' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#555' }}>剧本版本</h4>
                  {(screenplays[novel.id] || []).length === 0 ? (
                    <p style={{ color: '#999', fontSize: 13 }}>暂无剧本，点击上方「AI 转换」生成</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(screenplays[novel.id] || []).map(sp => (
                        <div key={sp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fafafa', borderRadius: 8, cursor: 'pointer' }} onClick={() => navigate(`/screenplay/${sp.id}`)}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{sp.title}</span>
                            <span style={{ marginLeft: 10, fontSize: 12, color: '#888' }}>v{sp.version} · {sp.sourceChapters ? sp.sourceChapters + ' · ' : ''}{(sp.scenes || []).length} 场景</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {statusBadge(sp.status)}
                            <button onClick={(e) => handleDeleteScreenplay(sp.id, e)} style={{ background: 'transparent', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 13 }}>删除</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
