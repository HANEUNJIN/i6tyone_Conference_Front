<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import { ServiceAPI } from '@/api/temp/service';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { useAuthStore } from '@/stores/auth';
import { useEventStore } from '@/stores/event';
import { CFormTextarea } from '@coreui/vue';
import { logFormData, toYmdCompact } from '@/utils/common';

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: 'No', width: '10%' },
  { key: 'editYmd', label: '날짜', width: '10%' },
  { key: 'comment', label: '특이사항', width: '*', align: 'left' },
  { key: 'editName', label: '작성자', width: '10%' },
];
const COLLAPSED_FIELDS = [
  {
    label1: '특이사항',
    key: 'comment',
    colspan: true,
  },
];
// ----------------------
//  ✨composable / store
// ----------------------
const auth = useAuthStore();
const base = useBaseStore();
const modal = useConfirmModal();

const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const comment = ref('');
const isEdit = ref(false);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchServicePassList = async () => {
  const params = {
    licenseCd: storeLicenseCd.value,
    pageNum: page.value,
    pageSize: size.value,
    menuType: storeMenuType.value,
  };
  try {
    const res = await ServiceAPI.getServiceCommentList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }
    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    const commentList = list.map((e) => {
      return {
        ...e,
        collapsed: false,
        collapseVisible: false,
      };
    });
    return { items: commentList, total: Number(total) || 0 };
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, init, onPageChanged } = usePaginatedQueryList(
  fetchServicePassList,
  {
    defaultKeyword: '',
    defaultSize: 5,
    disableUrlSync: true,
  },
);

const createFormData = () => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('LicenseCd', storeLicenseCd.value);
  append('Comment', comment.value);
  append('EditName', auth.userInfo.userNm);
  append('EditId', auth.userInfo.userId);
  return fd;
};

const handleEdit = () => {
  isEdit.value = !isEdit.value;
};

const handleDelete = async (seq) => {
  const confirm = await modal.show({
    title: '특이사항',
    message: '삭제 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  try {
    const res = await ServiceAPI.deleteServiceComment({
      seq: seq,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success('삭제 되었습니다.');
    init();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleSave = async () => {
  if (!comment.value) return toast.error('특이사항을 입력해주세요.');
  const confirm = await modal.show({
    title: '특이사항',
    message: '저장 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  try {
    const formData = createFormData();
    logFormData(formData);
    const res = await ServiceAPI.postServiceComment(formData);
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success(`저장 되었습니다.`);
    isEdit.value = false;
    comment.value = '';
    init();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  init();
});
</script>

<template>
  <div v-if="!isEdit" class="d-flex justify-content-end mb-2">
    <CButton color="primary" size="sm" @click="handleEdit"> 특이사항 입력 </CButton>
  </div>
  <template v-if="isEdit">
    <UiGridTable :fields="COLLAPSED_FIELDS">
      <template #value-comment>
        <CFormTextarea v-model="comment" rows="3" class="mb-0" />
      </template>
    </UiGridTable>
    <div class="d-flex justify-content-end gap-1 mt-2">
      <CButton color="danger" size="sm" @click="handleEdit"> 취소 </CButton>
      <CButton color="primary" size="sm" @click="handleSave"> 저장 </CButton>
    </div>
  </template>
  <template v-else>
    <UiDataTable
      :loading="loading"
      :columns="COLUMNS"
      :items="items"
      :hover="false"
      collapsed
      :row-clickable="true"
    >
      <template #cell-comment="{ item }">
        <p class="truncate-multiline">
          {{ item.comment }}
        </p>
      </template>
      <template #row-collapsed="{ item }">
        <UiGridTable :fields="COLLAPSED_FIELDS">
          <template #value-comment>
            <pre>{{ item.comment }}</pre>
          </template>
        </UiGridTable>
        <div class="d-flex justify-content-center gap-2 mt-2">
          <CButton color="danger" size="sm" @click="handleDelete(item.seq)"> 삭제 </CButton>
        </div>
      </template>
    </UiDataTable>
    <UiPagination
      v-if="total > 0"
      v-model:page="page"
      v-model:size="size"
      :total="total"
      :show-size-select="false"
      :edge-count="4"
      :mid-count="3"
      @change="onPageChanged"
    />
  </template>
</template>

<style scoped></style>
