import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const TerminalInstallAPI = {
  getList(params) {
    const url = buildUrl('/api/etcbusi/van/install/list', {
      Autho: params.autho,
      BranchEtc: params.branchEtc,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Branch: params.branch,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  getExcel(params) {
    const url = buildUrl('/api/etcbusi/van/install/list/excel', {
      Autho: params.autho,
      BranchEtc: params.branchEtc,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Branch: params.branch,
      Keyword: params.keyword,
      MenuType: params.menuType,
    });
    return client.download(url);
  },

  getDetail(params) {
    const url = buildUrl('/api/etcbusi/van/install/detail', {
      ContractNo: params.contractNo,
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  putModify(formDataOrJson) {
    const url = buildUrl(`/api/etcbusi/van/install`);
    return client.put(url, formDataOrJson);
  },
};
