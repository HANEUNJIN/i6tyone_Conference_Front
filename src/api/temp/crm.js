import { client } from '@/api/_client';
import { buildUrl } from '@/utils/url';

export const CrmAPI = {
  getList(params){
    const url = buildUrl('/api/etcbusi/crm/file/list', {
      Autho: params.autho,
      BranchEtc: params.branchEtc,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Branch: params.branch,
      ProgressSt: params.progressSt,
      UserId: params.userId,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },
  getExcel(params){
    const url = buildUrl(`/api/etcbusi/crm/file/list/excel`, {
      Autho: params.autho,
      BranchEtc: params.branchEtc,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Branch: params.branch,
      ProgressSt: params.progressSt,
      UserId: params.userId,
      Keyword: params.keyword,
    });
    return client.download(url);
  },
  putProgress(params){
    const url = buildUrl(`/api/etcbusi/crm/file/progress`);
    return client.put(url, params);
  }
}
