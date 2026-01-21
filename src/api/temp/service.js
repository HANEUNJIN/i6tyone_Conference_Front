import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const ServiceAPI = {
  // 고객지원 - 지원내역 리스트 (특정병원)
  getSupportList(params) {
    const url = buildUrl('/api/service/support-list', {
      LicenseCd: params.licenseCd,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 고객지원 - 이관내역 리스트
  getPassList(params) {
    const url = buildUrl('/api/service/pass-list', {
      UserId: params.userId,
      LicenseCd: params.licenseCd,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },

  // 고객지원 - 이관내역 이미지 파일 가져오기
  getServicePassImg(params) {
    const url = buildUrl('/api/service/pass-detail-sms/img', {
      Idx: params.seq,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 이관처리 내역 수정
  putServicePassModify(formDataOrJson) {
    return client.put('/api/service/pass-info', formDataOrJson);
  },

  // 특이사항 조회
  getServiceCommentList(params) {
    const url = buildUrl('/api/service/comment/list', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
      Keyword: params.Keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },

  // 특이사항 입력
  postServiceComment(formDataOrJson) {
    return client.post('/api/service/comment', formDataOrJson);
  },

  // 특이사항 삭제
  deleteServiceComment(params) {
    const url = buildUrl('/api/service/comment', {
      Seq: params.seq,
    });
    return client.delete(url);
  },

  // 고객지원 서비스 대분류명
  getServiceBigOptions(params) {
    const url = buildUrl('/api/service/option/class/big', {
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 고객지원 서비스 중분류명
  getServiceMidOptions(params) {
    const url = buildUrl('/api/service/option/class/middle', {
      Code: params.code,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 고객지원 - 지원내역 리스트 (전체병원)
  getSupportAllList(params) {
    const url = buildUrl('/api/service/support-list-all', {
      ChartVersion: params.chartVersion,
      Purpose: params.purpose,
      PurposeSub: params.purposeSub,
      ProcCond: params.procCond,
      SearchType: params.searchType,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
      JoinServiceYn: params.joinServiceYn,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 인수처리내용 수정
  putServicePassWay(formDataOrJson) {
    const url = buildUrl('/api/service/pass-info-pc');
    return client.put(url, formDataOrJson);
  },

  // 고객지원서비스 자기자신 이관되었던 내역
  getServicePassMyList(params) {
    const url = buildUrl('/api/service/support-list-my', {
      UserId: params.userId,
      Purpose: params.purpose,
      PurposeSub: params.purposeSub,
      ProcCond: params.procCond,
      SearchType: params.searchType,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
      ReadYn: params.readYn,
      JoinServiceYn: params.joinServiceYn,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 고객지원 - 지원내역 리스트 (백업데이터)
  getSupportBackupList(params) {
    const url = buildUrl('/api/service/list/backupdata', {
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },
};
