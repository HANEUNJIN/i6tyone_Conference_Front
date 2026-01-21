<script setup>
import { computed, ref, watch } from 'vue';
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
  item: { type: Object, default: null },
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
const checkedPmItems = ref([]); // 선택된 그룹 항목
const isLoading = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
// PM 항목 리스트를 가져오는 함수
const fetchPmList = async () => {
  const params = {
    itemCd: props.item?.itemCd,
    comboCd: props.item?.comboCd,
    treeSeq: props.item?.treeSeq,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ContractApi.getSubItemPmItemList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
    }
    pmItems.value = (res.data?.resultData?.list ?? []).map((item) => ({
      ...item,
      comboUseYn: item.treeUseYn === 'Y' ? true : false,
    }));
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 그룹 등록
const handleConfirm = async () => {
  if (checkedPmItems.value.length === 0) {
    return toast.error('하나 이상의 그룹 항목을 선택해주세요.');
  }
  const params = {
    comboCd: props.item?.comboCd,
    treeSeq: props.item?.treeSeq || 0,
    itemCd: props.item?.itemCd,
    itemArray: checkedPmItems.value,
    menuType: storeMenuType.value,
  };
  try {
    isLoading.value = true;
    const res = props.item?.treeSeq
      ? await ContractApi.putSubItemComboTree({ ...params, userId: auth.userInfo.userId })
      : await ContractApi.postSubItemComboTree(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    const success = toastApi.handleResult(res, {
      successMessage: '저장 되었습니다.',
      onSuccess: async () => {
        emit('confirm');
        modalVisible.value = false;
        isLoading.value = false;
      },
    });
    if (!success) return;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleCancel = () => {
  pmItems.value = [];
  modalVisible.value = false;
};

watch(
  pmItems,
  (newItems) => {
    checkedPmItems.value = newItems.filter((item) => item.comboUseYn).map((e) => e.itemCd);
  },
  { deep: true },
);

watch(modalVisible, (isVisible) => isVisible && fetchPmList());
</script>

<template>
  <UiModal
    v-model:visible="modalVisible"
    title="서브 아이템 항목 설정"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #body>
      <UiLoading v-if="isLoading" />
      <CCol>
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
    </template>
  </UiModal>
</template>
