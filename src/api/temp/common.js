import { client } from '@/api/_client';
import { buildUrl } from '@/utils/url';

export const CommonAPI = {
  // BIZ 사이트 전용 공통코드 조회
  getCode(params) {
    const url = `/api/common/code/${params}`;
    return client.get(url);
  },

  // 대리점명 목록
  getBranchCorp(params) {
    const url = buildUrl(`/api/common/code/branch/corp_nm`, {
      BonsaFlag: params.bonsaFlag,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 대리점명 목록
  getBranchCorpNmY(params) {
    const url = buildUrl(`/api/common/code/branch/corp_nm`, {
      CryFlag: 'Y',
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 대리점 지역명 목록
  getBranch(params) {
    const url = buildUrl(`/api/common/code/branch/branch_nm`, {
      MenuType: params,
    });
    return client.get(url);
  },

  // 부서 목록
  getDept() {
    return client.get(`/api/common/code/dept/company/list`);
  },

  // pm_mst_clinic 공통 코드 조회
  getPmMstClinicCode(params) {
    const url = `/api/common/code/pmmstclinic/${params}`;
    return client.get(url);
  },

  // 지역코드
  getAreaCode(params) {
    const url = buildUrl(`/api/common/code/area`, {
      SearchType: params.searchType,
      AreaCode: params.areaCode,
    });
    return client.get(url);
  },

  //pm_mst_key1 공통 코드 조회
  getPmMstKey1(params) {
    const url = buildUrl(`/api/common/code/pmmstkey1/${params.path}`, {
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 지역 코드 검색 MANAGER프로그램 시도용
  getAreaManagerSido() {
    return client.get('/api/common/code/area/manager/sido');
  },

  // 지역 코드 검색 MANAGER프로그램 시군용
  getAreaManagerSigun(params) {
    const url = buildUrl(`/api/common/code/area/manager/sigun`, {
      SidoCd: params.sidoCd,
    });
    return client.get(url);
  },

  // 약국 상품 정보 타입 리스트
  getCodePharmList(params) {
    const url = `/api/common/code/pharm/cminfo/list?ClsCd=${params}`;
    return client.get(url);
  },
};
