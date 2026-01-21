import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const SalesAPI = {
  // 영업현황 정보 리스트
  getList(params) {
    const url = buildUrl('/api/busi/report/list', {
      UserId: params.userId,
      UserType: params.userType,
      Branch: params.branch,
      MyListCheck: params.myListCheck,
      RegUserId: params.regUserId,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
      Progress: params.progress,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 영업현황 상세정보
  getDetail(params) {
    const url = buildUrl('/api/busi/report', {
      Seq: params.seq,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 영업로그 현황
  getLogs(params) {
    const url = buildUrl('/api/busi/report/log', {
      Seq: params.seq,
    });
    return client.get(url);
  },

  // 영업현황 등록
  postCreate(params) {
    return client.post('/api/busi/report', params);
  },

  // 영업현황 수정
  putModify(params) {
    return client.put('/api/busi/report', params);
  },

  // 영업현황 등록시 중복 체크
  getDuplicationCheck(params) {
    const url = buildUrl('/api/busi/duplication-check-nm', {
      CheckValue: params.checkValue,
      CheckValue2: params.checkValue2,
      CheckValue3: params.checkValue3,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 영업현황 리스트 정보(당일 자신이 등록한것)
  getMyList(params) {
    const url = buildUrl('/api/busi/report/list-today', {
      UserId: params.userId,
      MenuType: params.MenuType,
    });
    return client.get(url);
  },

  // 병원 방문일정 내역
  getVisitList(params) {
    const url = buildUrl('/api/busi/schedule/hosp', {
      LicenseCd: params.licenseCd,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },
};
