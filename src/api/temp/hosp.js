import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const HospApi = {
  // 병원 목록
  getList(params) {
    const url = buildUrl('/api/hosp/mng/my', {
      ChartVersion: params.chartVersion,
      Autho: params.autho,
      BranchCd: params.branchCd,
      HospPchart: params.hospPchart,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
      HospUseYn: params.hospUseYn,
      MenuType: params.menuType,
      ServiceUserId: params.serviceUserId,
      UserId: params.userId,
    });
    return client.get(url);
  },

  // 고객정보
  getCustomerInfo(params) {
    const url = buildUrl('/api/hosp', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 고객 - 영업 대리점/담당자 가져오기
  getAgencyInfo(params) {
    const url = buildUrl('/api/hosp/mng', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 현재 사용중인 제품 정보
  getProductInfo(params) {
    const url = buildUrl('/api/hosp/items', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
      SearchType: params.searchType,
    });
    return client.get(url);
  },

  // 전자계약서 계약한 로그(신규, 해지, 추가, ... 외)
  getContractLog(params) {
    const url = buildUrl('/api/hosp/contract/log/list', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 결제 정보
  getPaymentInfo(params) {
    const url = buildUrl('/api/hosp/pay', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //결제 정보 차후 입력 여부
  getPaymentInfoAfterYn(params) {
    const url = buildUrl('/api/hosp/pay/afteryn', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 추가 계약 정보
  getPlusContInfo(params) {
    const url = buildUrl('/api/hosp/plus-cont', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // MAC 라이선스 리스트
  getMacLicenseList(params) {
    const url = buildUrl('/api/hosp/license', {
      LicenseCd: params.licenseCd,
    });
    return client.get(url);
  },

  // MAC 라이선스 개수
  getMacLicenseCnt(params) {
    const url = buildUrl('/api/hosp/license/cnt', {
      LicenseCd: params.licenseCd,
    });
    return client.get(url);
  },

  //차트 버전 체크
  getChartVersion(params) {
    const url = buildUrl('/api/hosp/chart/version/check', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 이지스 차트 2.0 기준 라이선스 수량 체크
  getVersion2LicenseCnt(params) {
    const url = buildUrl('/api/hosp/license/version2/cnt', {
      LicenseCd: params.licenseCd,
      LicenseType: params.licenseType,
    });
    return client.get(url);
  },

  // MAC 당일 접속 로그인 정보
  getMacLTodayLoginLog(params) {
    const url = buildUrl('/api/hosp/license/cnt/today', {
      LicenseCd: params.licenseCd,
    });
    return client.get(url);
  },

  // MAC 라이선스 클리어
  putMacLicenseClear(formDataOrJson) {
    return client.put('/api/hosp/mac-clear', formDataOrJson);
  },

  // 타블렛 라이선스 리스트
  getTabletLicenseList(params) {
    const url = buildUrl('/api/hosp/tabletLicense', {
      LicenseCd: params.licenseCd,
    });
    return client.get(url);
  },

  // 타블렛 라이선스 클리어
  putTabletLicenseClear(formDataOrJson) {
    return client.put('/api/hosp/tablet-clear', formDataOrJson);
  },

  // 설치비 정보
  getInstallInfo(params) {
    const url = buildUrl('/api/hosp/license/install', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 설치비 미수금액
  getInstallUnpay(params) {
    const url = buildUrl('/api/hosp/license/install/unpaycost-sum', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //이지스 사용 내역서 출력
  getUsePayInfo(params) {
    const url = buildUrl('/api/hosp/license/use/pay', {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      LicenseCd: params.licenseCd,
    });
    return client.download(url);
  },

  // 월 회비 현황 (month 값 1-> 1개월전부터 현재월)
  getMonthCharge(params) {
    const url = buildUrl('/api/hosp/license/charge', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
      Month: params.month,
    });
    return client.get(url);
  },

  // 병원 월회비 미수금액 합계
  getMonthUnpay(params) {
    const url = buildUrl('/api/hosp/license/charge/unpaycost-sum', {
      LicenseCd: params.licenseCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 사업자등록증 업로드
  postCompanyFile(formDataOrJson) {
    const url = buildUrl('/api/hosp/file');
    return client.post(url, formDataOrJson);
  },

  // 사업자등록증 삭제
  deleteCompanyFile(params) {
    const url = buildUrl('/api/hosp/file', {
      LicenseCd: params.licenseCd,
      Seq: params.seq,
    });
    return client.delete(url);
  },

  // 사업자등록증 다운로드
  getCompanyFile(params) {
    const url = buildUrl('/api/hosp/file/download', {
      MenuType: params.menuType,
      Seq: params.seq,
    });
    return client.download(url);
  },

  //사용 내역서 조회
  getHospPaymentList(params) {
    const url = buildUrl('/api/hosp/payment/list', {
      LicenseCd: params.licenseCd,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //사용 내역서 조회 (월별 합계)
  getHospPaymentListMonth(params) {
    const url = buildUrl('/api/hosp/payment/list/sum', {
      LicenseCd: params.licenseCd,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      MenuType: params.menuType,
    });
    return client.get(url);
  },
};
