import http, { apiGet, apiPost, apiPut, apiDelete, apiForm, normalizeResponse } from '@/utils/http';

// 공용 클라이언트
export const client = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  form: apiForm,

  // 파일 다운로드(Blob 응답)
  // 사용 예: client.download('/notices/file', { params: { seq, fileSeq } })
  async download(url, { method = 'get', params, data, config } = {}) {
    const cfg = {
      responseType: 'blob',
      ...(config || {}),
      params,
    };
    const m = (method || 'get').toLowerCase();
    const res = m === 'post' ? await http.post(url, data, cfg) : await http.get(url, cfg);
    return normalizeResponse(res);
  },
};
