import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || '请求失败';
    return Promise.reject(new Error(msg));
  }
);

export const importNovel = (data) => client.post('/novels/import', data);
export const listNovels = () => client.get('/novels');
export const getNovel = (id) => client.get(`/novels/${id}`);
export const addChapters = (id, chapters) => client.post(`/novels/${id}/chapters`, chapters);
export const deleteNovel = (id) => client.delete(`/novels/${id}`);
export const convertToScreenplay = (id, data) => client.post(`/novels/${id}/convert`, data);
export const getScreenplays = (novelId) => client.get(`/novels/${novelId}/screenplays`);
export const getScreenplay = (id) => client.get(`/screenplays/${id}`);
export const updateScreenplay = (id, params) => client.put(`/screenplays/${id}`, null, { params });
export const updateScene = (screenplayId, sceneId, data) => client.put(`/screenplays/${screenplayId}/scenes/${sceneId}`, data);
export const exportYaml = (id) => client.get(`/screenplays/${id}/export`, { responseType: 'text' });
export const deleteScreenplay = (id) => client.delete(`/screenplays/${id}`);
