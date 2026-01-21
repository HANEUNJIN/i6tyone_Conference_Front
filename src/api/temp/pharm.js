import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const PharmAPI = {
  // 약국 정보 리스트 조회
  getLicenseList(params) {
    const url = buildUrl(`/api/pharm/license/list`, {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      ProgramStatus: params.programStatus,
      SelectCheckType: params.chkType,
      ChkProPharm: params.chkProPharm,
      ExpYmdType: params.expYmdType,
      TestYn: params.testYn,
      ChkProCrm: params.chkProCrm,
      ChkProQr: params.chkProQr,
      CompanyCd: params.companyCd,
      CompanyBusiCd: params.companyBusiCd,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },
  //약국 정보 리스트 엑셀
  getExcel(params) {
    const url = buildUrl(`/api/pharm/license/list-excel`, {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      ProgramStatus: params.programStatus,
      SelectCheckType: params.chkType,
      ChkProPharm: params.chkProPharm,
      ExpYmdType: params.expYmdType,
      TestYn: params.testYn,
      ChkProCrm: params.chkProCrm,
      ChkProQr: params.chkProQr,
      CompanyCd: params.companyCd,
      CompanyBusiCd: params.companyBusiCd,
      Keyword: params.keyword,
    });
    return client.download(url);
  },
  getProdListNoPaging(params) {
    const url = buildUrl(`/api/pharm/prod/list-no-paging?ProdType=${params}`);
    return client.get(url);
  },
  // 약국 정보 등록
  postLicense(formDataOrJson) {
    const url = buildUrl(`/api/pharm/license`);
    return client.post(url, formDataOrJson);
  },
  // 약국 정보 수정
  putLicense(formDataOrJson) {
    const url = buildUrl(`/api/pharm/license`);
    return client.put(url, formDataOrJson);
  },
  // 약국 정보 상세 조회
  getLicenseDetail(params) {
    const url = buildUrl(`/api/pharm/license/detail`, {
      licenseCd: params.licenseCd,
      applyYmd: params.applyYmd,
    });
    return client.get(url);
  },
  //약국 파일 정보 리스트
  getFileList(params) {
    const url = buildUrl(`/api/pharm/file/list`, {
      LicenseCd: params.licenseCd,
      FileType: params.fileType,
    });
    return client.get(url);
  },
  // 약국 등록된 PC 정보 리스트
  getPcList(params) {
    const url = buildUrl(`/api/pharm/pc/list`, {
      LicenseCd: params.licenseCd,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },
  //약국 QR 갱신 히스토리
  getQRHistoryList(params) {
    const url = buildUrl(`/api/pharm/license/history?LicenseCd=${params}`);
    return client.get(url);
  },
  // 약국 라이선스 로그인 정보
  getLoginInfo(params) {
    const url = buildUrl(`/api/pharm/login/list?LicenseCd=${params}`);
    return client.get(url);
  },
  // 약국 상품 갱신 정보 내역
  getRenewList(params) {
    const url = buildUrl(`/api/pharm/license/renew/list?LicenseCd=${params}`);
    return client.get(url);
  },
  // 약국 프로그램 이용 요금 갱신 정보
  getAmtList(params) {
    const url = buildUrl(`/api/pharm/license/amt/list?LicenseCd=${params}`);
    return client.get(url);
  },
  // 약국 QR PC mac clear
  putQRMacClear(formDataOrJson) {
    const url = buildUrl(`/api/pharm/qrpc/macclear`);
    return client.put(url, formDataOrJson);
  },
  // 약국 라이선스 PC mac clear
  putLicenseMacClear(formDataOrJson) {
    const url = buildUrl(`/api/pharm/login/macclear`);
    return client.put(url, formDataOrJson);
  },
  // 약국 파일 정보 업로드 (QR계약서,팜 계약서 , 해지 계약서,사업자 등록증등)
  postFileInfo(formDataOrJson) {
    const url = buildUrl(`/api/pharm/file`);
    return client.post(url, formDataOrJson);
  },
  // 라이선스 정보 삭제
  deleteLicense(params) {
    const url = buildUrl(`/api/pharm/license/renew`, params);
    return client.delete(url);
  },
  // 약국 프로그램 이용 요금 갱신 삭제
  deleteAmt(params) {
    const url = buildUrl(`/api/pharm/license/amt`, params);
    return client.delete(url);
  },
  // 라이선스 정보 갱신
  putLicenseRenew(formDataOrJson) {
    const url = buildUrl(`/api/pharm/license/renew`);
    return client.put(url, formDataOrJson);
  },
  // 약국 프로그램 이용 요금 갱신
  putLicenseAmt(formDataOrJson) {
    const url = buildUrl(`/api/pharm/license/amt`);
    return client.put(url, formDataOrJson);
  },
  // 약국 PC 사용여부 설정
  putPcUserYn(formDataOrJson) {
    const url = buildUrl(`/api/pharm/pc/use_yn`);
    return client.put(url, formDataOrJson);
  },
  // 약국 상품 리스트 정보
  getProdList(params) {
    const url = buildUrl(`/api/pharm/prod/list`, {
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: 15,
      ProdType: params.prodType,
    });
    return client.get(url);
  },
  // 약국 상품 등록
  postProd(formDataOrJson) {
    const url = buildUrl(`/api/pharm/prod`);
    return client.post(url, formDataOrJson);
  },
  // 약국 상품 삭제
  deleteProd(params) {
    const url = buildUrl(`/api/pharm/prod`, params);
    return client.delete(url);
  },
  // 약국 상품 수정
  putProd(formDataOrJson) {
    const url = buildUrl(`/api/pharm/prod`);
    return client.put(url, formDataOrJson);
  },
  // 약국 상품 상세 정보
  getProdDetail(params) {
    const url = buildUrl(`api/pharm/prod/detail?ProdId=${params}`);
    return client.get(url);
  },
  //약국 신청서 리스트 조회
  getList(params) {
    const url = buildUrl(`/api/pharm/join/list`, {
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  },
  //약국 신청서 상세 조회
  getDetail(params) {
    const url = buildUrl(`/api/pharm/join/detail`, {
      LicenseCd: params.licenseCd,
    });
    return client.get(url);
  },
  // 약국 신청서 삭제
  delete(params) {
    const url = buildUrl(`/api/pharm/join`, params);
    return client.delete(url);
  },
  // 약국 신청서 수정
  putModify(formDataOrJson) {
    const url = buildUrl(`/api/pharm/join`);
    return client.put(url, formDataOrJson);
  },
  //약국 EMR별 QR 리딩 현황
  getEmrQrList(params) {
    const url = buildUrl(`/api/pharm/emr/qr/list`, {
      DateFrom: params.dateFrom,
    });
    return client.get(url);
  },
  // 약국별 QR 리딩 개수
  getReadInfoList(params) {
    const url = buildUrl(`/api/pharm/readinfo/list`, {
      ExpYmdYn: params.expYmdYn,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Keyword: params.keyword,
      DeptId: '',
      PageNum: params.pageNum,
      PageSize: 15,
    });
    return client.get(url);
  },
  // 약국별 QR 리딩 개수 엑셀
  getReadInfoExcel(params) {
    const url = buildUrl(`/api/pharm/readinfo/list-excel`, {
      ExpYmdYn: params.expYmdYn,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Keyword: params.keyword,
    });
    return client.download(url);
  },
  // 약국별 PC QR 리딩 개수
  getReadInfoPcList(params) {
    const url = buildUrl(`/api/pharm/readinfo/pc/list`, {
      LicenseCd: params.licenseCd,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
    });
    return client.get(url);
  },
  // 약국별 PC MAC 리딩 상세정보
  getReadInfoPcDetail(params) {
    const url = buildUrl(`/api/pharm/readinfo/pc/detail/list`, {
      LicenseCd: params.licenseCd,
      PcMac: params.pcMac,
      DateFrom: params.dateFrom,
      DateTo: params.dateTo,
      Keyword: params.keyword,
      PageNum: params.pageNum,
      PageSize: 15,
    });
    return client.get(url);
  },
};
