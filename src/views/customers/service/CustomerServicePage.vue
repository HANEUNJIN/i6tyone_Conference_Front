<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { ServiceAPI } from '@/api/temp/service';
import { CommonAPI } from '@/api/temp/common';
import { useBaseStore } from '@/stores/base';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { formatYmd, logFormData } from '@/utils/common';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import fileIcon from '@/assets/images/fileIcon.gif';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import InquiryHistoryModal from '@/components/customers/modal/InquiryHistoryModal.vue';
import CustomerInfoModal from '@/components/customers/modal/CustomerInfoModal.vue';
import AgencyInfoModal from '@/components/customers/modal/AgencyInfoModal.vue';

// 차트버전 옵션
const CHART_VERSION_OPTIONS_E = [
  { codeId: '', codeNm: '차트버전' },
  { codeId: '1', codeNm: '1.0' },
  { codeId: '2', codeNm: '2.0' },
];

const CHART_VERSION_OPTIONS_N = [
  { codeId: '', codeNm: '차트버전' },
  { codeId: 'A4401', codeNm: '2.0' },
  { codeId: 'A4402', codeNm: '5.0' },
];
const SEARCH_TYPE_OPTIONS = [
  { codeId: '', codeNm: '검색명타입' },
  { codeId: '1', codeNm: '문의사항' },
  { codeId: '2', codeNm: '병원명' },
  { codeId: '3', codeNm: '처리자' },
  { codeId: '4', codeNm: '인수자' },
  { codeId: '5', codeNm: '인수처리내용' },
  { codeId: '6', codeNm: 'CS팀처리' },
];
// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'regDt', label: '요청일', width: '10%' },
  { key: 'hospNm', label: '병원명', width: '10%' },
  { key: 'emrVerGb', label: '차트버전', width: '5%' },
  { key: 'purposeTot', label: '목적', width: '6%' },
  { key: 'reqMatters', label: '문의사항', width: 'auto', align: 'left' },
  { key: 'procEr', label: '처리자', width: '5%' },
  { key: 'procDate', label: '처리일', width: '10%' },
  { key: 'procCondNm', label: '결과', width: '8%' },
  { key: 'passEr', label: '인수자', width: '6%' },
  { key: 'passDate', label: '인수일', width: '6%' },
];

const COLLAPSED_FIELDS = [
  { label1: '문의사항', key: 'reqMatters', colspan: true },
  { label1: 'CS팀처리', key: 'procWay', colspan: true },
  { label1: '인수처리내용', key: 'passWay', colspan: true },
  { label1: '첨부이미지', key: 'fileImages', colspan: true },
];
// ----------------------
//  ✨composable / store
// ----------------------
const route = useRoute();
const auth = useAuthStore();
const base = useBaseStore();
const { storeMenuType } = storeToRefs(base);
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const chartVersion = ref('');
const purpose = ref('');
const purposeSub = ref('');
const procCond = ref('');
const searchType = ref('');
const fileImages = ref([]);
const isNewJoinInquiry = ref(false);
const isPassWayModify = ref(false);

const isInquiryHistoryModalVisible = ref(false);
const isCustomerInfoModalVisible = ref(false);
const isAgencyInfoModalVisible = ref(false);
const selectedRowData = ref(null);

const purposeOptions = ref([]);
const purposeSubOptions = ref([{ codeId: '', codeNm: '중분류' }]);
const procCondOptions = ref([]);

const chartVersionOptions = computed(() =>
  storeMenuType.value === 'E' ? CHART_VERSION_OPTIONS_E : CHART_VERSION_OPTIONS_N,
);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchOptions = async () => {
  try {
    const [purposeRes, procCondRes] = await Promise.all([
      ServiceAPI.getServiceBigOptions({
        menuType: storeMenuType.value,
      }),
      CommonAPI.getPmMstKey1({
        path: 'PROCSTATE',
        menuType: storeMenuType.value,
      }),
    ]);
    if (!purposeRes.ok) return toastApi.errorFromResult(purposeRes);
    if (!procCondRes.ok) return toastApi.errorFromResult(procCondRes);
    purposeOptions.value = [
      { codeId: '', codeNm: '대분류' },
      ...(purposeRes.data?.resultData?.list ?? []),
    ];
    procCondOptions.value = [
      { codeId: '', codeNm: '진행상태' },
      ...(procCondRes.data?.resultData?.list ?? []),
    ];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const fetchPurposeSubOptions = async () => {
  try {
    const res = await ServiceAPI.getServiceMidOptions({
      code: purpose.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    purposeSubOptions.value = [...purposeSubOptions.value, ...(res.data?.resultData?.list ?? [])];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onReset, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    extra: { chartVersion, purpose, purposeSub, procCond, searchType, isNewJoinInquiry },
    autoSearchOnExtraChange: true,
    autoSearchExclude: ['searchType'],
  });

async function fetchList({
  page,
  size,
  keyword,
  chartVersion,
  purpose,
  purposeSub,
  procCond,
  searchType,
  isNewJoinInquiry,
}) {
  const params = {
    purpose: purpose,
    purposeSub: purposeSub,
    procCond: procCond,
    searchType: searchType,
    keyword: keyword,
    pageSize: size,
    pageNum: page,
    joinServiceYn: String(isNewJoinInquiry) === 'true' ? 'Y' : 'N',
    chartVersion: chartVersion,
    menuType: storeMenuType.value,
  };

  try {
    const res = await ServiceAPI.getSupportAllList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
}

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

const togglePassWayEditMode = () => {
  isPassWayModify.value = !isPassWayModify.value;
};

const handleRowClick = async (row) => {
  fileImages.value = [];
  isPassWayModify.value = false;
  await fetchFileImages(row.seq);
};

const handlePassWaySave = async (row) => {
  if (!row.procCond) {
    toast.error('처리상태를 선택해주세요.');
    return;
  }
  if (!row.passWay) {
    toast.error('인수처리내용을 입력해주세요.');
    return;
  }

  let formData = new FormData();
  formData.append('Seq', row.seq);
  formData.append('PassWay', row.passWay);
  formData.append('ProcCond', row.procCond);
  formData.append('PassUserId', row.passUserId);
  formData.append('UserId', auth.userInfo.userId);
  logFormData(formData);
  try {
    const res = await ServiceAPI.putServicePassWay(formData);
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success('저장 되었습니다.');
    isPassWayModify.value = false;
    init();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const openInquiryHistoryModal = async (row) => {
  selectedRowData.value = row;
  isInquiryHistoryModalVisible.value = true;
};

const openCustomerInfoModal = async (row) => {
  selectedRowData.value = row;
  isCustomerInfoModalVisible.value = true;
};

const openAgencyInfoModal = async (row) => {
  selectedRowData.value = row;
  isAgencyInfoModalVisible.value = true;
};

watch(
  () => purpose.value,
  () => {
    purposeSub.value = '';
    purposeSubOptions.value = [{ codeId: '', codeNm: '중분류' }];
    fetchPurposeSubOptions();
  },
);

const updateIsNewJoinInquiryFromQuery = (query) => {
  if (query.isNewJoinInquiry === 'true') {
    isNewJoinInquiry.value = true;
  } else {
    isNewJoinInquiry.value = false;
  }
};

watch(
  () => route.query,
  (q) => {
    updateIsNewJoinInquiryFromQuery(q);
  },
  { immediate: true },
);

onMounted(() => {
  fetchOptions();
  init();
  updateIsNewJoinInquiryFromQuery(route.query);
});
</script>

<template>
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        placeholder="제목/내용 검색"
        @submit="onSearch"
        @reset="onReset"
      >
        <template #extra-front>
          <CFormSelect v-model="chartVersion" size="sm" style="width: auto">
            <option v-for="opt in chartVersionOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="purpose" size="sm" style="width: auto">
            <option v-for="opt in purposeOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="purposeSub" size="sm" style="width: auto">
            <option v-for="opt in purposeSubOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="procCond" size="sm" style="width: auto">
            <option v-for="opt in procCondOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="searchType" size="sm" style="width: auto">
            <option v-for="opt in SEARCH_TYPE_OPTIONS" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #extra-btn>
          <CFormCheck id="신규가입문의" label="신규가입문의" v-model="isNewJoinInquiry" />
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable
        collapsed
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => handleRowClick(row)"
      >
        <template #cell-reqMatters="{ item }">
          <div class="d-flex gap-1 align-items-center">
            <p class="truncate-multiline">
              {{ item.reqMatters }}
            </p>
            <CImage :src="fileIcon" v-if="item.imageYn === 'Y'" />
          </div>
        </template>
        <template #cell-hospNm="{ item }">
          <template v-if="storeMenuType === 'N'">
            {{ item.hospNm ? item.hospNm + ` (${item.areaNm || '-'})` : '[미확인 거래처]' }}
          </template>
          <template v-else>
            {{ item.hospNm }}
          </template>
        </template>
        <template #cell-passDate="{ item }">
          {{ formatYmd(item.passDate) }}
        </template>

        <template #row-collapsed="{ item }">
          <UiGridTable :fields="COLLAPSED_FIELDS">
            <template #value-reqMatters>
              <pre>{{ item.reqMatters || '-' }}</pre>
            </template>
            <template #value-procWay>
              <pre>{{ item.procWay || '-' }}</pre>
            </template>
            <template #value-passWay>
              <pre v-if="!isPassWayModify">{{ item.passWay || '-' }}</pre>
              <template v-else>
                <CFormSelect v-model="item.procCond" size="sm" class="mb-2">
                  <option v-for="opt in procCondOptions" :key="opt.codeId" :value="opt.codeId">
                    {{ opt.codeNm }}
                  </option>
                </CFormSelect>
                <CFormTextarea v-model="item.passWay" size="sm" maxlength="15" />
              </template>
            </template>

            <template #value-fileImages>
              <div v-for="(file, idx) in fileImages" :key="idx" class="mt-2">
                <CImage :src="`data:image/gif;base64,${file.base64Img}`" width="100%" />
              </div>
            </template>
          </UiGridTable>
          <div
            class="d-flex mt-3"
            :class="[
              auth.userInfo.userId === item.passUserId ||
              auth.userInfo.userId === item.serviceUserId
                ? 'justify-content-between'
                : 'justify-content-center',
            ]"
          >
            <div class="d-flex gap-1">
              <CButton color="secondary" size="sm" @click="openInquiryHistoryModal(item)"
                >문의내역 히스토리</CButton
              >
              <template v-if="String(isNewJoinInquiry) !== 'true'">
                <CButton color="secondary" size="sm" @click="openCustomerInfoModal(item)"
                  >고객 정보</CButton
                >
                <CButton color="secondary" size="sm" @click="openAgencyInfoModal(item)"
                  >담당자 정보</CButton
                >
              </template>
            </div>
            <div
              v-if="
                auth.userInfo.userId === item.passUserId ||
                auth.userInfo.userId === item.serviceUserId
              "
              class="d-flex gap-1"
            >
              <CButton
                v-if="!isPassWayModify"
                color="warning"
                size="sm"
                @click="togglePassWayEditMode"
              >
                인수처리내용수정
              </CButton>
              <template v-else>
                <CButton color="danger" size="sm" @click="togglePassWayEditMode"> 취소 </CButton>
                <CButton color="primary" size="sm" @click="handlePassWaySave(item)">저장</CButton>
              </template>
            </div>
          </div>
        </template>
      </UiDataTable>
      <div v-if="total > 0" class="mt-auto">
        <UiPagination
          v-model:page="page"
          v-model:size="size"
          :edge-count="4"
          :mid-count="3"
          :size-options="[15, 20, 50]"
          :total="total"
          @change="onPageChanged"
        />
      </div>
    </CCardBody>
  </CCard>
  <InquiryHistoryModal
    v-model:visible="isInquiryHistoryModalVisible"
    :model-value="selectedRowData"
  />
  <CustomerInfoModal v-model:visible="isCustomerInfoModalVisible" :model-value="selectedRowData" />
  <AgencyInfoModal v-model:visible="isAgencyInfoModalVisible" :model-value="selectedRowData" />
</template>
