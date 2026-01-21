<script setup>
import { computed, ref, watch, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { ContractApi } from '@/api/temp/contract';
import { useAuthStore } from '@/stores/auth';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import UiModal from '@/components/ui/UiModal.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
// ----------------------
//  ✨ Props & Emits
// ----------------------
const props = defineProps({
  visible: { type: Boolean, default: false },
  group: { type: Object, default: null },
  categoryCd: { type: String, default: '' },
});
const emit = defineEmits(['update:visible', 'confirm']);
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

// ----------------------
//  ✨composable / store
// ----------------------
const auth = useAuthStore();
const base = useBaseStore();
const { storeMenuType } = storeToRefs(base);
const modal = useConfirmModal();
const toast = useToast();
const toastApi = useApiToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const pmItems = ref([]); // 그룹 항목 리스트
const selectedGroupType = ref('00'); // 그룹 타입
const newComboCd = ref(''); // 그룹 추가 시 콤보 코드
const checkedPmItems = ref([]); // 선택된 그룹 항목
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
// PM 항목 리스트를 가져오는 함수
const fetchPmList = async () => {
  const params = {
    itemType: props.group?.itemType,
    comboCd: props.group?.comboCd,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.getPmItemList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
    }
    pmItems.value = (res.data?.resultData?.list ?? []).map((item) => ({
      ...item,
      comboUseYn: item.comboUseYn === 'Y' ? true : false,
    }));
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 카테고리 제품 정보에 해당하는 셀렉트 박스 목록 정보
const fetchProductGroupList = async () => {
  try {
    const res = await ContractApi.getItemCategoryGroupList({
      categoryCd: props.categoryCd,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    const list = res.data?.resultData?.list;
    newComboCd.value = list.at(-1).comboCd;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 카테고리 제품 그룹에 해당하는 콤보박스 저장
const savePmItemCombo = async () => {
  const params = {
    comboCd: props.group?.comboCd || newComboCd.value,
    itemArray: checkedPmItems.value,
    userId: auth.userInfo.userId,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.postItemCategoryGroupCombo(params);
    if (!res.ok) return toastApi.errorFromResult(res);
    const success = toastApi.handleResult(res, {
      successMessage: '저장 되었습니다.',
      onSuccess: () => {
        modalVisible.value = false;
        isLoading.value = false;
        emit('confirm');
      },
    });
    if (!success) return;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 그룹 등록
const handleConfirm = async () => {
  if (checkedPmItems.value.length === 0) {
    return toast.error('하나 이상의 그룹 항목을 선택해주세요.');
  }
  const params = {
    categoryCd: props.categoryCd,
    groupType: selectedGroupType.value,
    useYn: 'Y', // 사용 여부는 설정 x
    userId: auth.userInfo.userId,
    menuType: storeMenuType.value,
  };
  try {
    isLoading.value = true;
    const res = props.group
      ? await ContractApi.putItemCategoryGroup({ ...params, groupSeq: props.group.groupSeq })
      : await ContractApi.postItemCategoryGroup(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    const success = toastApi.handleResult(res, {
      onSuccess: async () => {
        await fetchProductGroupList(); // 그룹 추가/변경 후 콤보 코드 업데이트
        await savePmItemCombo(); // PM 항목 콤보 저장
      },
    });
    if (!success) return;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleCancel = () => {
  modalVisible.value = false;
};

watch(
  pmItems,
  (newItems) => {
    checkedPmItems.value = newItems.filter((item) => item.comboUseYn).map((e) => e.itemCd);
  },
  { deep: true },
);

watchEffect(() => {
  selectedGroupType.value = props.group?.groupType ?? '00';
});

watch(modalVisible, (isVisible) => {
  isVisible && fetchPmList();
});
</script>

<template>
  <UiModal
    v-model:visible="modalVisible"
    :title="props.group ? '그룹 변경' : '그룹 추가'"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #body>
      <UiLoading v-if="isLoading" />
      <div class="d-flex flex-column gap-3">
        <CRow>
          <CCol>
            <CFormLabel>그룹 타입</CFormLabel>
            <div class="d-flex gap-2">
              <CFormCheck
                value="00"
                type="radio"
                name="groupType"
                id="기본 그룹"
                label="기본 그룹"
                :checked="selectedGroupType === '00'"
                v-model="selectedGroupType"
              />
              <CFormCheck
                value="01"
                type="radio"
                name="groupType"
                id="추가 그룹"
                label="추가 그룹"
                :checked="selectedGroupType === '01'"
                v-model="selectedGroupType"
              />
            </div>
          </CCol>
        </CRow>

        <CCol>
          <CFormLabel>그룹 항목 설정</CFormLabel>
          <div class="overflow-y-auto" style="max-height: 300px">
            <CListGroup>
              <CListGroupItem as="a" v-for="item in pmItems" :key="item.itemCd">
                <CFormLabel class="d-flex justify-content-between mb-0" style="cursor: pointer">
                  <div class="d-flex align-items-center gap-2">
                    <CFormCheck v-model="item.comboUseYn" />
                    <span>({{ item.itemCd }}) {{ item.itemNm }}</span>
                  </div>
                  <span>{{ item.price.toLocaleString('ko-KR') }}원</span>
                </CFormLabel>
              </CListGroupItem>
            </CListGroup>
          </div>
        </CCol>
      </div>
    </template>
  </UiModal>
</template>
