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
import { CFormSelect } from '@coreui/vue';
import { datepickerFixed, getTodayYmd, logFormData, toYmdCompact } from '@/utils/common';
import { getCurrentHour, getCurrentMinute, hourOptions, minuteOptions } from '@/utils/dataTime';
import Datepicker from '@vuepic/vue-datepicker';
import { CommonAPI } from '@/api/temp/common';
import { useEventStore } from '@/stores/event';

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: 'No', width: '4%' },
  { key: 'regDt', label: '요청일', width: '12%' },
  { key: 'purposeTot', label: '목적', width: '10%' },
  { key: 'reqMatters', label: '문의사항', width: 'auto' },
  { key: 'procEr', label: '처리자', width: '6%' },
  { key: 'procDate', label: '처리일', width: '12%' },
  { key: 'procCondNm', label: '결과', width: '6%' },
  { key: 'passEr', label: '인수자', width: '6%' },
  { key: 'passDate', label: '처리일', width: '12%' },
  { key: 'passCond', label: '지원분류', width: '6%' },
];
const COLLAPSED_FIELDS = [
  {
    label1: '병원명',
    key1: 'hospNm',
    label2: '전화번호',
    key2: 'hospTel',
  },
  {
    label1: '문의사항',
    key: 'reqMatters',
    colspan: true,
  },
  {
    label1: 'CS팀처리',
    key: 'procWay',
    colspan: true,
  },
  {
    label1: '인수처리내용',
    key: 'passWay',
    colspan: true,
  },
  {
    label1: '처리상태',
    key: 'passStatus',
    colspan: true,
  },
  {
    label1: '첨부이미지',
    key: 'fileImages',
    colspan: true,
  },
];
// ----------------------
//  ✨composable / store
// ----------------------
const auth = useAuthStore();
const base = useBaseStore();
const eventStore = useEventStore();
const modal = useConfirmModal();

const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const fileImages = ref([]);
const itemsHour = ref(getCurrentHour());
const itemsMinute = ref(getCurrentMinute());
const procCondOptions = ref([]);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchProcCondOptions = async () => {
  try {
    const res = await CommonAPI.getPmMstKey1({
      path: 'PROCSTATE',
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    procCondOptions.value = res.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const fetchServicePassList = async () => {
  const params = {
    userId: auth.userInfo.userId,
    licenseCd: storeLicenseCd.value,
    pageNum: page.value,
    pageSize: size.value,
  };
  try {
    const res = await ServiceAPI.getPassList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }
    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    const servicePassList = list.map((e) => {
      return {
        ...e,
        collapsed: false,
        collapseVisible: false,
        passDate: e.passDate.split(' ')[0] || getTodayYmd(),
      };
    });
    return { items: servicePassList, total: Number(total) || 0 };
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

const fetchFileImages = async (seq) => {
  try {
    const res = await ServiceAPI.getServicePassImg({
      seq: seq,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    fileImages.value = res.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('Seq', p.seq);
  append('ProcCond', p.procCond);
  append('PassWay', p.passWay);
  append('PassDate', toYmdCompact(p.passDate));
  append('PassTime', `${itemsHour.value}${itemsMinute.value}`);
  return fd;
};

const handleRowClick = async (row) => {
  itemsHour.value = getCurrentHour();
  itemsMinute.value = getCurrentMinute();
  await fetchFileImages(row.seq);
};

const handleSubmit = async (e) => {
  console.log('handleSubmit', e);
  if (!e.passWay) return toast.error('인수처리내용을 입력해주세요.');
  const confirm = await modal.show({
    title: '이관처리 내역',
    message: '저장 하시겠습니까?',
    confirmText: '확인',
  });
  if (!confirm) return;
  try {
    const formData = createFormData(e);
    logFormData(formData);
    const res = await ServiceAPI.putServicePassModify(formData);
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success(`저장 되었습니다. 처리 완료로 저장시 저장된 내역은 지원내역으로 이동 됩니다.`);
    init();
    eventStore.triggerSupport();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchProcCondOptions();
  init();
});
</script>

<template>
  <UiDataTable
    :loading="loading"
    :columns="COLUMNS"
    :items="items"
    :hover="false"
    collapsed
    :row-clickable="true"
    @row-click="
      ({ row }) => {
        handleRowClick(row);
      }
    "
  >
    <template #cell-reqMatters="{ item }">
      <p class="truncate-multiline">
        {{ item.reqMatters }}
      </p>
    </template>
    <template #row-collapsed="{ item }">
      <UiGridTable :fields="COLLAPSED_FIELDS">
        <template #value-hospNm>{{ item.hospNm }} </template>
        <template #value-hospTel>{{ item.hospTel }}</template>
        <template #value-reqMatters>
          <pre>{{ item.reqMatters }}</pre>
        </template>
        <template #value-procWay>
          <pre>{{ item.procWay }}</pre>
        </template>
        <template #value-passWay>
          <CFormTextarea v-model="item.passWay" size="sm" maxlength="15" />
        </template>
        <template #value-passStatus>
          <div class="d-flex gap-2">
            <CFormSelect v-model="item.procCond" size="sm">
              <option v-for="opt in procCondOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <Datepicker
              v-model="item.passDate"
              v-bind="datepickerFixed"
              locale="ko"
              style="min-width: 140px"
              :ui="{ input: 'form-control form-control-sm' }"
            />
            <CFormSelect v-model="itemsHour" size="sm">
              <option v-for="opt in hourOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <CFormSelect v-model="itemsMinute" size="sm">
              <option v-for="opt in minuteOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
          </div>
        </template>
        <template #value-fileImages>
          <div v-for="(file, idx) in fileImages" :key="idx" class="mt-2">
            <CImage :src="`data:image/gif;base64,${file.base64Img}`" width="100%" />
          </div>
        </template>
      </UiGridTable>
      <div class="d-flex justify-content-center gap-2 mt-2">
        <CButton color="primary" size="sm" @click="handleSubmit(item)">
          이관처리 내역 저장
        </CButton>
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

<style scoped></style>
