<script setup>
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { ContractApi } from '@/api/temp/contract';
import { CommonAPI } from '@/api/temp/common';
import { CONFIG_TABLE_FIELDS, DETAIL_TABLE_FIELDS } from '@/constants/contract/setting/product';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import { isEqual } from '@/utils/common';
import UiGridTable from '@/components/ui/UiCustomGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import AutoInspectListModal from '@/components/contract/product/modal/AutoInspectListModal.vue';
import GroupSettingModal from '@/components/contract/product/modal/GroupSettingModal.vue';
import SubItemSettingModal from '@/components/contract/product/modal/SubItemSettingModal.vue';
// ----------------------
//  ✨composable / store
// ----------------------
const auth = useAuthStore();
const base = useBaseStore();
const modal = useConfirmModal();
const { storeMenuType } = storeToRefs(base);
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const settingMode = ref(''); // add, edit
const productList = ref([]); // 제품 리스트
const selectedProductIdx = ref(null);

const productInfo = ref({}); // 제품 정보
const isInfoLoading = ref(false);
const originalProductInfo = ref({}); // 원본 비교용
const editProductInfo = ref({}); // 편집 중 데이터 보관
const isInfoModify = ref(false); // 제품 상세 수정 플래그

const groupList = ref([]); // 그룹 리스트
const selectedGroup = ref(null); // 선택된 그룹
const selectedComboItemCd = ref(''); // 선택된 콤보
const comboItemInfo = ref({}); // 콤보 항목 정보
const editComboItemInfo = ref({}); // 편집 중 데이터 보관
const subItemList = ref([]); // 서브 아이템 리스트
const selectedSubItem = ref(null); // 선택된 서브 아이템

const isShowGroupAddModal = ref(false); // 그룹 설정 모달
const isShowSubItemSettingModal = ref(false); // 서브 아이템 항목 설정 모달
const isAutoInspectListModal = ref(false); // 자동 검수 목록 모달

const deptCdOptions = ref([]);
const viewCdOptions = ref([]);

// ----------------------
//  ✨ methods / functions/
// ----------------------
// 제품 목록
const fetchProductList = async () => {
  try {
    const res = await ContractApi.getItemCategoryList({
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    productList.value = res.data?.resultData.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 제품 상세 정보
const fetchProductInfo = async (categoryCd) => {
  try {
    isInfoLoading.value = true;
    const res = await ContractApi.getItemCategoryDetail({
      categoryCd: categoryCd,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    productInfo.value = res.data?.resultData;
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isInfoLoading.value = false;
  }
};

// 제품 정보에 해당하는 그룹 목록
const fetchProductGroupList = async (categoryCd) => {
  try {
    const res = await ContractApi.getItemCategoryGroupList({
      categoryCd: categoryCd,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    const list = res.data?.resultData?.list;
    const groupedByComboCd = list?.reduce((acc, currentItem) => {
      const comboCd = currentItem.comboCd;
      if (!acc[comboCd]) {
        acc[comboCd] = [];
      }
      acc[comboCd].push(currentItem);
      return acc;
    }, {});
    groupList.value = Object.values(groupedByComboCd);
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 서프 아이템 목록
const fetchSubItemList = async () => {
  const params = {
    comboCd: selectedGroup.value[0].comboCd,
    itemCd: selectedComboItemCd.value,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.getItemCategoryGroupComboTreeList(params);
    if (!res.ok) return toastApi.errorFromResult(res);
    const list = res.data.resultData?.list ?? [];
    const groupedByTreeSeq = list?.reduce((acc, currentItem) => {
      const treeSeq = currentItem.treeSeq;
      if (!acc[treeSeq]) {
        acc[treeSeq] = [];
      }
      acc[treeSeq].push(currentItem);
      return acc;
    }, {});
    subItemList.value = Object.values(groupedByTreeSeq).map((e) => ({ ...e, collapse: false }));
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 옵션 정보
const fetchOptions = async () => {
  try {
    const [deptRes, viewRes] = await Promise.all([
      CommonAPI.getPmMstKey1({
        path: 'A0002',
        menuType: storeMenuType.value,
      }),
      CommonAPI.getCode('A21'),
    ]);
    if (!deptRes.ok) return toastApi.errorFromResult(deptRes);
    if (!viewRes.ok) return toastApi.errorFromResult(viewRes);

    deptCdOptions.value = [
      { codeId: '', codeNm: '전체 진료과' },
      ...(deptRes.data?.resultData?.list ?? []),
    ];
    viewCdOptions.value = viewRes.data?.resultData?.list ?? [];
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const fetchComboInfo = async () => {
  const params = {
    comboCd: selectedGroup.value[0].comboCd,
    itemCd: selectedComboItemCd.value,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.getItemCategoryGroupComboInfo(params);
    if (!res.ok) return toastApi.errorFromResult(res);
    const info = res.data?.resultData;
    if (info) {
      comboItemInfo.value = {
        ...info,
        amtModifyYn: info.amtModifyYn === 'Y',
        freePassYn: info.freePassYn === 'Y',
        inspectAutoYn: info.inspectAutoYn === 'Y',
      };
      editComboItemInfo.value = { ...comboItemInfo.value };
    } else {
      comboItemInfo.value = {};
      editComboItemInfo.value = {};
    }
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 제품 상세 수정
const handleProductInfoEdit = () => {
  originalProductInfo.value = {
    ...productInfo.value,
    deptCd: productInfo.value.deptCd || '',
    categoryExplan: productInfo.value.categoryExplan || '',
  };
  editProductInfo.value = {
    ...productInfo.value,
    deptCd: productInfo.value.deptCd || '',
    categoryExplan: productInfo.value.categoryExplan || '',
  };
  isInfoModify.value = true;
};

// 제품 상세 수정 취소
const handleProductInfoCancel = async () => {
  const confirm = await modal.show({
    title: settingMode.value === 'add' ? '제품 추가 취소' : '제품 수정 취소',
    message: '취소 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  if (settingMode.value === 'add') return (settingMode.value = null);
  isInfoModify.value = false;
  originalProductInfo.value = {};
  editProductInfo.value = {};
};

// 제품 추가 저장
const handleProductInfoAdd = async () => {
  if (!editProductInfo.value?.categoryNm) {
    return toast.error('카테고리명을 입력해주세요.');
  }
  const confirm = await modal.show({
    title: '제품 추가',
    message: '신규 추가 하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    const payload = {
      ...editProductInfo.value,
      menuType: storeMenuType.value,
    };
    const res = await ContractApi.postItemCategoryDetail(payload);
    const success = toastApi.handleResult(res, {
      successMessage: '저장 되었습니다.',
      onSuccess: async () => {
        isInfoModify.value = false;
        editProductInfo.value = {};
        groupList.value = [];
        settingMode.value = 'edit';
        await fetchProductList();
        selectedProductIdx.value = productList.value.length - 1;
        const newProductCategoryCd = productList.value[productList.value.length - 1].categoryCd;
        await fetchProductInfo(newProductCategoryCd);
      },
    });
    if (!success) return;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 제품 상세 수정 저장
const handleProductInfoSave = async () => {
  if (!editProductInfo.value?.categoryNm) {
    return toast.error('카테고리명을 입력해주세요.');
  }
  const confirm = await modal.show({
    title: '제품 상세 수정',
    message: '저장 하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    const payload = {
      ...editProductInfo.value,
      userId: auth.userInfo.userId,
      menuType: storeMenuType.value,
    };
    const res = await ContractApi.putItemCategoryDetail(payload);
    const success = toastApi.handleResult(res, {
      successMessage: '저장 되었습니다.',
      onSuccess: () => {
        fetchProductInfo(editProductInfo.value.categoryCd);
        isInfoModify.value = false;
        editProductInfo.value = {};
        fetchProductList();
      },
    });
    if (!success) return;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 제품 삭제
const handleProductDelete = async () => {
  const confirm = await modal.show({
    title: '제품 삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  try {
    const res = await ContractApi.deleteItemCategory({
      categoryCd: productInfo.value.categoryCd,
      menuType: storeMenuType.value,
    });
    const success = toastApi.handleResult(res, {
      successMessage: '삭제 되었습니다.',
      onSuccess: () => {
        selectedProductIdx.value = null;
        settingMode.value = null;
        productInfo.value = {};
        fetchProductList();
      },
    });
    if (!success) return;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 제품 추가
const handleProductAdd = () => {
  editProductInfo.value = {
    useYn: 'Y',
    cancelYn: 'N',
    promotionYn: 'N',
    categoryEYmd: '',
    categorySYmd: '',
    viewCd: 'A2101',
    categoryNm: '',
  };
  selectedGroup.value = null;
  settingMode.value = 'add';
  isInfoModify.value = true;
  selectedProductIdx.value = null;
  selectedSubItem.value = null;
};

// 제품 목록 클릭
const handleProductClick = (item, idx) => {
  isInfoModify.value = false;
  selectedGroup.value = null;
  selectedSubItem.value = null;
  settingMode.value = 'edit';
  selectedProductIdx.value = idx;
  fetchProductInfo(item.categoryCd);
  fetchProductGroupList(item.categoryCd);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 그룹 체크박스
const handleCheckboxChange = (group) => {
  selectedComboItemCd.value = '';
  comboItemInfo.value = {};
  selectedGroup.value = group;
};

// 그룹 추가 및 변경 모달
const openGroupEditModal = (group) => {
  selectedGroup.value = group;
  selectedComboItemCd.value = '';
  comboItemInfo.value = {};
  isShowGroupAddModal.value = true;
};

// 서브 아이템 항목 설정 모달
const openSubItemSettingModal = (item) => {
  selectedSubItem.value = item;
  isShowSubItemSettingModal.value = true;
};

// 그룹 삭제
const handleGroupDelete = async (group) => {
  const confirm = await modal.show({
    title: '그룹 삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  const params = {
    categoryCd: productInfo.value.categoryCd,
    comboCd: group[0].comboCd,
    groupSeq: group[0].groupSeq,
    userId: auth.userInfo.userId,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.deleteItemCategoryGroup(params);
    const success = toastApi.handleResult(res, {
      successMessage: '삭제 되었습니다.',
      onSuccess: () => {
        fetchProductGroupList(productInfo.value.categoryCd);
        selectedGroup.value = null;
      },
    });
    if (!success) return;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 서브 아이템 삭제
const handleSubItemDelete = async (item) => {
  const confirm = await modal.show({
    title: '서브 아이템 삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  const params = {
    comboCd: item.comboCd,
    treeSeq: item.treeSeq,
    userId: auth.userInfo.userId,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.deleteSubItemComboTree(params);
    const success = toastApi.handleResult(res, {
      successMessage: '삭제 되었습니다.',
      onSuccess: () => {
        fetchSubItemList();
      },
    });
    if (!success) return;
  } catch (e) {}
};

const handleComboItemEdit = async () => {
  const confirm = await modal.show({
    title: '대표 아이템 속성',
    message: '저장 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  const params = {
    comboCd: editComboItemInfo.value.comboCd,
    itemCd: editComboItemInfo.value.itemCd,
    inspectAmt: editComboItemInfo.value.inspectAmt,
    inspectAutoYn: editComboItemInfo.value.inspectAutoYn ? 'Y' : 'N',
    promotionAmt: editComboItemInfo.value.promotionAmt,
    amtModifyYn: editComboItemInfo.value.amtModifyYn ? 'Y' : 'N',
    baseLicenseCnt: editComboItemInfo.value.baseLicenseCnt,
    freeMonth: editComboItemInfo.value.freeMonth,
    freePassYn: editComboItemInfo.value.freePassYn ? 'Y' : 'N',
    userId: auth.userInfo.userId,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.putItemCategoryGroupCombo(params);
    const success = toastApi.handleResult(res, {
      successMessage: '저장 되었습니다.',
      onSuccess: () => {
        fetchComboInfo();
      },
    });
    if (!success) return;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleSwitchChange = (event, value) => {
  editProductInfo.value[value] = event.target.checked ? 'Y' : 'N';
};

watch(
  selectedComboItemCd,
  () => {
    if (selectedComboItemCd.value) {
      fetchComboInfo();
      fetchSubItemList();
    } else {
      comboItemInfo.value = {};
      editComboItemInfo.value = {};
      subItemList.value = [];
    }
  },
  { deep: true },
);

onMounted(() => {
  fetchOptions();
  fetchProductList();
});
</script>

<template>
  <CCard class="flex-grow-1">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">전자계약서 제품 설정</h6>
      <CButton color="dark" size="sm" @click="handleProductAdd">제품 추가</CButton>
    </CCardHeader>
    <CCardBody>
      <CRow class="flex-grow-1">
        <CCol sm="3" class="d-flex flex-column gap-2" style="border-right: 1px solid #ccc">
          <div class="d-flex justify-content-between align-items-center">
            <strong>제품 목록</strong>
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              @click="() => (isAutoInspectListModal = true)"
            >
              제품 자동 검수 목록
            </CButton>
          </div>

          <CListGroup>
            <CListGroupItem
              as="a"
              style="cursor: pointer"
              v-for="(item, idx) in productList"
              :active="selectedProductIdx === idx"
              :key="idx"
              @click="handleProductClick(item, idx)"
            >
              [{{ item.categoryCd }}] {{ item.categoryNm }}
            </CListGroupItem>
          </CListGroup>
        </CCol>

        <CCol sm="9" class="d-flex flex-column gap-3">
          <template v-if="settingMode">
            <strong class="mt-2">제품 설정</strong>
            <CCard>
              <CCardHeader> <h6 class="mb-0">Step1. 제품 상세</h6></CCardHeader>
              <CCardBody>
                <UiLoading v-if="isInfoLoading" />
                <UiGridTable :fields="DETAIL_TABLE_FIELDS">
                  <template #value-categoryNm>
                    <template v-if="isInfoModify">
                      <CFormInput
                        v-model="editProductInfo.categoryNm"
                        size="sm"
                        placeholder="카테고리명을 입력해주세요."
                      />
                    </template>
                    <template v-else>{{ productInfo.categoryNm }}</template>
                  </template>
                  <template #value-categoryExplan>
                    <template v-if="isInfoModify">
                      <CFormInput
                        v-model="editProductInfo.categoryExplan"
                        size="sm"
                        placeholder="제품 설명을 입력해주세요."
                      />
                    </template>
                    <template v-else> {{ productInfo.categoryExplan || '-' }} </template>
                  </template>
                  <template #value-deptCd>
                    <template v-if="isInfoModify">
                      <CFormSelect v-model="editProductInfo.deptCd" size="sm">
                        <option v-for="opt in deptCdOptions" :key="opt.codeId" :value="opt.codeId">
                          {{ opt.codeNm }}
                        </option>
                      </CFormSelect>
                    </template>
                    <template v-else>
                      {{
                        deptCdOptions.find((e) => e.codeId === productInfo.deptCd)?.codeNm ||
                        '전체 진료과'
                      }}
                    </template>
                  </template>
                  <template #value-viewCd>
                    <template v-if="isInfoModify">
                      <CFormSelect v-model="editProductInfo.viewCd" size="sm">
                        <option v-for="opt in viewCdOptions" :key="opt.codeId" :value="opt.codeId">
                          {{ opt.codeNm }}
                        </option>
                      </CFormSelect>
                    </template>
                    <template v-else>
                      {{
                        viewCdOptions.find((e) => e.codeId === productInfo.viewCd)?.codeNm || '신규'
                      }}</template
                    >
                  </template>
                  <template #value-useYn>
                    <CFormSwitch
                      size="xl"
                      :disabled="!isInfoModify"
                      :checked="
                        isInfoModify ? editProductInfo.useYn === 'Y' : productInfo.useYn === 'Y'
                      "
                      @change="(e) => handleSwitchChange(e, 'useYn')"
                    />
                  </template>
                  <template #value-cancelYn>
                    <div class="d-flex align-items-center gap-1">
                      <CFormSwitch
                        size="xl"
                        :disabled="!isInfoModify"
                        :checked="
                          isInfoModify
                            ? editProductInfo.cancelYn === 'Y'
                            : productInfo.cancelYn === 'Y'
                        "
                        @change="(e) => handleSwitchChange(e, 'cancelYn')"
                      />
                      <CButton
                        class="popover-btn"
                        color="danger"
                        size="sm"
                        v-c-popover="{
                          content:
                            '체크 선택시 제품 추가할때 기존 사용중인 제품 폐기날짜를 선택할 수 있게 해줍니다.<br>' +
                            'ex) crm-1000을 사용하려 하는데 기존에 crm-500 이미 사용중일 경우 crm-500폐기 일자 선택',
                          placement: 'top',
                          html: true,
                          trigger: 'hover',
                        }"
                      >
                        !
                      </CButton>
                    </div>
                  </template>
                </UiGridTable>
              </CCardBody>
              <CCardFooter class="d-flex justify-content-end gap-2">
                <template v-if="!isInfoModify">
                  <CButton color="danger" size="sm" @click="handleProductDelete">삭제</CButton>
                  <CButton color="warning" size="sm" @click="handleProductInfoEdit"> 수정 </CButton>
                </template>
                <template v-else>
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    @click="handleProductInfoCancel"
                  >
                    취소
                  </CButton>
                  <CButton
                    color="primary"
                    size="sm"
                    @click="
                      settingMode === 'edit' ? handleProductInfoSave() : handleProductInfoAdd()
                    "
                    :disabled="
                      settingMode === 'edit' ? isEqual(originalProductInfo, editProductInfo) : false
                    "
                    >저장</CButton
                  >
                </template>
              </CCardFooter>
            </CCard>
            <CCard v-if="settingMode === 'edit'">
              <CCardHeader class="d-flex justify-content-between align-items-center">
                <div class="d-flex gap-3">
                  <h6 class="mb-0">Step2. 그룹</h6>
                  <span>※ 기본 그룹은 최소 1개, 추가그룹은 최대 1개</span>
                </div>
                <CButton color="secondary" size="sm" @click="openGroupEditModal(null)"
                  >그룹 추가</CButton
                >
              </CCardHeader>
              <CCardBody>
                <p v-if="groupList.length === 0" class="mb-0 text-center">아이템을 추가해주세요.</p>
                <CListGroup v-else>
                  <CListGroupItem v-for="(group, groupIdx) in groupList" :key="groupIdx">
                    <CFormLabel
                      class="d-flex align-items-center justify-content-between gap-2 mb-0"
                    >
                      <div class="d-flex align-items-center gap-2">
                        <CFormCheck
                          type="radio"
                          name="group"
                          :value="group[0]?.comboCd"
                          :checked="selectedGroup?.[0]?.comboCd === group[0]?.comboCd"
                          @change="handleCheckboxChange(group)"
                        />
                        <strong>[{{ group[0]?.comboCd }}] 그룹 {{ groupIdx + 1 }}</strong>
                        <CBadge :color="group[0]?.groupType === '00' ? 'info' : 'success'">
                          {{ group[0]?.groupType === '00' ? '기본타입' : '추가타입' }}
                        </CBadge>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <CButton
                          color="secondary"
                          variant="outline"
                          size="sm"
                          @click="openGroupEditModal(group)"
                          >변경</CButton
                        >
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          @click="handleGroupDelete(group)"
                          >삭제</CButton
                        >
                      </div>
                    </CFormLabel>
                  </CListGroupItem>
                </CListGroup>
              </CCardBody>
            </CCard>

            <CCard v-if="selectedGroup">
              <CCardHeader class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Step3. 대표 아이템 속성 설정</h6>
                <div class="d-flex justify-content-between gap-2">
                  <CButton
                    color="secondary"
                    size="sm"
                    :disabled="Object.keys(editComboItemInfo).length === 0"
                    @click="openSubItemSettingModal(comboItemInfo)"
                    >서브 아이템 추가</CButton
                  >
                </div>
              </CCardHeader>
              <CCardBody>
                <UiGridTable :fields="CONFIG_TABLE_FIELDS">
                  <template #value-items>
                    <CFormSelect v-model="selectedComboItemCd" size="sm">
                      <option value="">선택</option>
                      <option v-for="opt in selectedGroup" :key="opt.itemCd" :value="opt.itemCd">
                        {{ opt.itemNm }}
                      </option>
                    </CFormSelect>
                  </template>
                  <template #value-licenseCnt>
                    <CFormInput
                      v-model.number="editComboItemInfo.baseLicenseCnt"
                      type="number"
                      size="sm"
                      :disabled="Object.keys(editComboItemInfo).length === 0"
                    />
                  </template>
                  <template #value-price>
                    <CFormSwitch
                      v-model="editComboItemInfo.amtModifyYn"
                      size="xl"
                      :disabled="Object.keys(editComboItemInfo).length === 0"
                    />
                  </template>
                  <template #value-freePass>
                    <CFormSwitch
                      v-model="editComboItemInfo.freePassYn"
                      size="xl"
                      :disabled="Object.keys(editComboItemInfo).length === 0"
                    />
                  </template>
                  <template #value-autoCheck>
                    <CFormSwitch
                      v-model="editComboItemInfo.inspectAutoYn"
                      size="xl"
                      :disabled="Object.keys(editComboItemInfo).length === 0"
                    />
                  </template>
                  <template #value-autoCheckPrice>
                    <div class="d-flex align-items-center gap-2">
                      <span>{{ editComboItemInfo.itemAmt }} →</span>
                      <div class="d-flex align-items-center gap-2 flex-grow-1">
                        <CFormLabel class="mb-0 text-nowrap"><strong>하한가</strong></CFormLabel>
                        <CFormInput v-model.number="editComboItemInfo.inspectAmt" size="sm" />
                      </div>
                    </div>
                  </template>
                  <template #value-subItems>
                    <template v-if="subItemList.length === 0">
                      서브 아이템을 추가해주세요.
                    </template>
                    <CListGroup v-else>
                      <CListGroupItem v-for="(item, idx) in subItemList" :key="item.treeItemCd">
                        <div class="d-flex align-items-center justify-content-between gap-2">
                          <strong>서브 아이템 {{ idx }}</strong>
                          <div class="d-flex align-items-center gap-2">
                            <CButton
                              color="success"
                              variant="outline"
                              size="sm"
                              @click="() => (item.collapse = !item.collapse)"
                              >항목 보기</CButton
                            >
                            <CButton
                              color="secondary"
                              variant="outline"
                              size="sm"
                              @click="openSubItemSettingModal(item[0])"
                              >변경</CButton
                            >
                            <CButton
                              color="danger"
                              variant="outline"
                              size="sm"
                              @click="handleSubItemDelete(item[0])"
                              >삭제</CButton
                            >
                          </div>
                        </div>
                        <CCollapse :visible="item.collapse">
                          <CListGroup class="mt-2">
                            <template v-for="opt in item" :key="opt.treeItemCd">
                              <CListGroupItem v-if="opt.treeItemCd" color="light">
                                {{ opt.treeItemNm }}
                              </CListGroupItem>
                            </template>
                          </CListGroup>
                        </CCollapse>
                      </CListGroupItem>
                    </CListGroup>
                  </template>
                </UiGridTable>
              </CCardBody>
              <CCardFooter class="d-flex justify-content-end">
                <CButton
                  color="primary"
                  size="sm"
                  :disabled="isEqual(comboItemInfo, editComboItemInfo)"
                  @click="handleComboItemEdit"
                  >속성 저장</CButton
                >
              </CCardFooter>
            </CCard>
          </template>
          <template v-else>
            <CAlert color="light" align="center">제품을 선택해 주세요.</CAlert>
          </template>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>
  <!-- 제품 자동 검수 목록 모달 -->
  <AutoInspectListModal v-model:visible="isAutoInspectListModal" />
  <!-- 그룹 추가 변경 모달 -->
  <GroupSettingModal
    v-model:visible="isShowGroupAddModal"
    :group="selectedGroup?.[0]"
    :category-cd="productInfo.categoryCd"
    @confirm="
      async () => {
        await fetchProductGroupList(productInfo.categoryCd);
        const prevSelectedGroup = selectedGroup?.[0];
        if (!prevSelectedGroup) return;
        selectedGroup = groupList.find((e) => e?.[0]?.comboCd === prev.comboCd) || null;
      }
    "
  />
  <!-- 서브 아이템 추가 변경 모달 -->
  <SubItemSettingModal
    v-model:visible="isShowSubItemSettingModal"
    :item="selectedSubItem"
    @confirm="
      () => {
        fetchSubItemList();
      }
    "
  />
</template>

<style scoped>
.popover-btn {
  border-radius: 50%;
  padding: 0;
  margin: 0;
  width: 20px;
  height: 20px;
}
</style>
