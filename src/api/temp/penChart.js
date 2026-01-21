import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const PenChart = {
  //펜차트 리스트 정보
  getList(params) {
    const url = buildUrl(`/api/etcbusi/penchart/list`, {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      CustomerType: params.customerType,
      Autho: params.autho,
      Branch: params.branch,
      Keyword: params.keyword,
      pageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },

  //펜차트 총 수량 정보
  getSumInfo(params) {
    const url = buildUrl(`/api/etcbusi/penchart/list/sum`, {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      CustomerType: params.customerType,
      Autho: params.autho,
      Branch: params.branch,
      Keyword: params.keyword,
      pageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },

  //펜차트 리스트 엑셀
  getExcel(params) {
    const url = buildUrl(`/api/etcbusi/penchart/list-excel`, {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      CustomerType: params.customerType,
      Autho: params.autho,
      Branch: params.branch,
      Keyword: params.keyword,
    });
    return client.download(url);
  },
};
