import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const ContractApi = {
  //전자계약서 기간 설정 정보 조회
  getReportPeriod(storeMenuType) {
    const url = buildUrl(`/api/contract/setting/period`, {
      MenuType: storeMenuType,
    });
    return client.get(url);
  },

  putReportPeriod(params) {
    return client.put('/api/contract/setting/period', params);
  },

  //프리패스 정보 조회
  getReportFreePassInfo(params) {
    const url = buildUrl(`/api/contract/setting/freepass`, {
      Year: params.year,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //프리패스 정보 저장
  postReportFreePassInfo(params) {
    return client.post('/api/contract/setting/freepass', params);
  },

  // 영업 상세 개인정보 (원장명,연락처,이메일 조회)
  getReportUserInfo(params) {
    const url = buildUrl(`/api/contract/report/detail/user/list`, {
      ReportNo: params.reportNo,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //카테고리 제품 정보 리스트
  getItemCategoryList(params) {
    const url = buildUrl(`/api/contract/item/category/list`, {
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 제품 카테고리 상세 정보
  getItemCategoryDetail(params) {
    const url = buildUrl('/api/contract/item/category/detail', {
      CategoryCd: params.categoryCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //카테고리 제품 저장
  postItemCategoryDetail(params) {
    return client.post('/api/contract/item/category', params);
  },

  // 제품 카테고리 수정
  putItemCategoryDetail(params) {
    return client.put('/api/contract/item/category', params);
  },

  // 제품 카테고리 삭제
  deleteItemCategory(params) {
    const url = buildUrl(`/api/contract/item/category`, {
      CategoryCd: params.categoryCd,
      MenuType: params.menuType,
    });
    return client.delete(url);
  },

  // 자동 검수 설정 되어있는 것 한번에 모기 위한 목록
  getAutoInspectList(params) {
    const url = buildUrl(`/api/contract/item/autoinspect/amt`, {
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //카테고리 제품 정보에 해당하는 셀렉트 박스 목록 정보
  getItemCategoryGroupList(params) {
    const url = buildUrl('/api/contract/item/category/group/list', {
      CategoryCd: params.categoryCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 제품 설정 셀렉트 박스에 사용할 기초 목록 조회 (clinic.pm_items 테이블)
  getPmItemList(params) {
    const url = buildUrl('/api/contract/item/category/group/pmitem/list', {
      ItemType: params.itemType,
      ComboCd: params.comboCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 제품 그룹 등록
  postItemCategoryGroup(params) {
    return client.post('/api/contract/item/category/group', params);
  },

  // 제품 그룹 수정
  putItemCategoryGroup(params) {
    return client.put('/api/contract/item/category/group', params);
  },

  //제품 그룹 삭제
  deleteItemCategoryGroup(params) {
    const url = buildUrl('/api/contract/item/category/group', params);
    return client.delete(url);
  },

  //카테고리 제품 그룹에 해당하는 콤보박스 저장
  postItemCategoryGroupCombo(params) {
    return client.post('/api/contract/item/category/combo', params);
  },

  //제품 콤보 수정
  putItemCategoryGroupCombo(params) {
    return client.put('/api/contract/item/category/combo', params);
  },

  //카테고리 제품 그룹에 해당하는 콤보 정보
  getItemCategoryGroupComboInfo(params) {
    const url = buildUrl('/api/contract/item/category/combo/detail', {
      ComboCd: params.comboCd,
      ItemCd: params.itemCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 콤보박스 트리정보(서브아이템)
  getItemCategoryGroupComboTreeList(params) {
    const url = buildUrl('/api/contract/item/category/combo/tree/list', {
      ComboCd: params.comboCd,
      ItemCd: params.itemCd,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 하위 셀렉트 박스에서 PMITEM 사용유무 리스트
  getSubItemPmItemList(params) {
    const url = buildUrl('/api/contract/item/category/combo/tree/pmitem/list', {
      ComboCd: params.comboCd,
      ItemCd: params.itemCd,
      TreeSeq: params.treeSeq,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  //카테고리 제품 그룹 트리에 해당하는 콤보박스 저장
  postSubItemComboTree(params) {
    return client.post('/api/contract/item/category/combo/tree', params);
  },

  //카테고리 제품 그룹 트리에 해당하는 콤보박스 수정
  putSubItemComboTree(params) {
    return client.put('/api/contract/item/category/combo/tree', params);
  },

  // 카테고리 제품 그룹 트리 삭제
  deleteSubItemComboTree(params) {
    const url = buildUrl('/api/contract/item/category/combo/tree', params);
    return client.delete(url);
  },
};
