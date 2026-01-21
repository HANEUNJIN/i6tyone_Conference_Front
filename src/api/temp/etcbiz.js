import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const EtcbizAPI = {
  // 차트배너연동내역 리스트
  getChartBannerList(params) {
    const url = buildUrl('/api/etcbusi/homepage/order/list', {
      ProcCode: params.procCode,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Autho: params.autho,
      Branch: params.branch,
      Keyword: params.keyword,
      ProcAccYn: params.procAccYn,
      ProcSetYn: params.procSetYn,
      ProcFinalYn: params.procFinalYn,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },

  // 차트배너연동내역 엑셀
  getChartBannerExcel(params) {
    const url = buildUrl('/api/etcbusi/homepage/order/list-excel', {
      ProcCode: params.procCode,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Autho: params.autho,
      Branch: params.branch,
      Keyword: params.keyword,
      ProcAccYn: params.procAccYn,
      ProcSetYn: params.procSetYn,
      ProcFinalYn: params.procFinalYn,
      Title: params.title,
      ProcType: params.procType,
      HappyCallYn: params.happyCallYn,
      HappyCallYmd: params.happyCallYmd,
    });
    return client.download(url);
  },

  //차트배너연동내역 상세
  getChartBannerDetail(params) {
    const url = buildUrl('/api/etcbusi/homepage/order/detail', {
      ProcCode: params.procCode,
      LicenseCd: params.licenseCd,
    });
    return client.get(url);
  },

  // 이지스 홈페이지 주문내역 수정 --주문내역은 기존의료장비랑 동일해서 의료장비 호출형식으로 호출
  putChartBannerModify(formDataOrJson) {
    const url = buildUrl('/api/etcbusi/medicalmachine/join');
    return client.put(url, formDataOrJson);
  },
};
