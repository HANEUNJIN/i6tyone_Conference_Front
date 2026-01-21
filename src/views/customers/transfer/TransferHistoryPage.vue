<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { ServiceAPI } from '@/api/temp/service';
import { CommonAPI } from '@/api/temp/common';
import { useBaseStore } from '@/stores/base';
import { useAuthStore } from '@/stores/auth';
import { COLLAPSED_FIELDS, COLUMNS, SEARCH_TYPE_OPTIONS } from '@/constants/customers/transfer';
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

// ----------------------
//  ✨composable / store
// ----------------------
const route = useRoute();
const auth = useAuthStore();
const base = useBaseStore();
const { storeMenuType } = storeToRefs(base);
const toastApi = useApiToast();
const toast = useToast();
const imageCache = new Map();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const purpose = ref('');
const purposeSub = ref('');
const procCond = ref('');
const searchType = ref('');
const fileImages = ref([]);
const isNewJoinInquiry = ref(false);
const isReadYn = ref(false);
const isPassWayModify = ref(false);
const editingRow = ref(null); // 편집 중 데이터 보관

const isInquiryHistoryModalVisible = ref(false);
const isCustomerInfoModalVisible = ref(false);
const isAgencyInfoModalVisible = ref(false);
const selectedRowData = ref(null);

const purposeOptions = ref([]);
const purposeSubOptions = ref([]);
const procCondOptions = ref([]);

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
    purposeSubOptions.value = [
      { codeId: '', codeNm: '중분류' },
      ...(res.data?.resultData?.list ?? []),
    ];
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
    extra: { purpose, purposeSub, procCond, searchType, isNewJoinInquiry, isReadYn },
    autoSearchOnExtraChange: true,
    autoSearchExclude: ['searchType'],
  });

async function fetchList({
  page,
  size,
  keyword,
  purpose,
  purposeSub,
  procCond,
  searchType,
  isNewJoinInquiry,
  isReadYn,
}) {
  const params = {
    userId: auth.userInfo.userId,
    purpose: purpose,
    purposeSub: purposeSub,
    procCond: procCond,
    searchType: searchType,
    keyword: keyword,
    pageSize: size,
    pageNum: page,
    readYn: String(isReadYn) === 'true' ? 'N' : 'Y',
    joinServiceYn: String(isNewJoinInquiry) === 'true' ? 'Y' : 'N',
    menuType: storeMenuType.value,
  };

  try {
    const res = await ServiceAPI.getServicePassMyList(params);
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

const handleRowClick = async (row) => {
  fileImages.value = [];
  isPassWayModify.value = false;
  // 캐시 확인
  if (imageCache.has(row.seq)) {
    fileImages.value = imageCache.get(row.seq);
    return;
  }

  await fetchFileImages(row.seq);
  // 캐시 저장
  imageCache.set(row.seq, fileImages.value);
};

const createPassWayFormData = (payload) => {
  const formData = new FormData();
  formData.append('Seq', payload.seq);
  formData.append('PassWay', payload.passWay);
  formData.append('ProcCond', payload.procCond);
  formData.append('PassUserId', payload.passUserId);
  formData.append('UserId', auth.userInfo.userId);
  logFormData(formData);
  return formData;
};

const startPassWayEdit = (row) => {
  editingRow.value = {
    seq: row.seq,
    passWay: row.passWay ?? '',
    procCond: row.procCond ?? '',
    passUserId: row.passUserId ?? auth.userInfo.userId,
  };
  isPassWayModify.value = true;
};

const cancelPassWayEdit = () => {
  isPassWayModify.value = false;
  editingRow.value = null;
};

const handlePassWaySave = async () => {
  if (!editingRow.value?.procCond) {
    return toastApi.errorFromResult(null, '처리상태를 선택해주세요.');
  }
  if (!editingRow.value?.passWay?.trim()) {
    return toastApi.errorFromResult(null, '인수처리내용을 입력해주세요.');
  }

  try {
    const formData = createPassWayFormData(editingRow.value);
    const res = await ServiceAPI.putServicePassWay(formData);
    const success = toastApi.handleResult(res, {
      successMessage: '저장 되었습니다.',
      onSuccess: () => {
        isPassWayModify.value = false;
        editingRow.value = null;
        init();
      },
    });
    if (!success) return;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const openInquiryHistoryModal = (row) => {
  selectedRowData.value = row;
  isInquiryHistoryModalVisible.value = true;
};

const openCustomerInfoModal = (row) => {
  selectedRowData.value = row;
  isCustomerInfoModalVisible.value = true;
};

const openAgencyInfoModal = (row) => {
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
  isNewJoinInquiry.value = query.isNewJoinInquiry === 'true';
  isReadYn.value = query.isReadYn === 'true';
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
          <CFormCheck id="미처리목록" label="미처리목록" v-model="isReadYn" />
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
            {{ item.hospNm ? item.hospNm` (${item.areaNm || '-'})` : '[미확인 거래처]' }}
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
              <pre v-if="!isPassWayModify">
                {{ item.passWay || '-' }}
              </pre>
              <template v-else>
                <CFormSelect v-model="editingRow.procCond" size="sm" class="mb-2">
                  <option v-for="opt in procCondOptions" :key="opt.codeId" :value="opt.codeId">
                    {{ opt.codeNm }}
                  </option>
                </CFormSelect>
                <CFormTextarea v-model="editingRow.passWay" size="sm" maxlength="15" />
              </template>
            </template>

            <template #value-fileImages>
              <div v-for="(file, idx) in fileImages" :key="idx" class="mt-2">
                <CImage :src="`data:image/gif;base64,${file.base64Img}`" width="100%" />
              </div>
            </template>
          </UiGridTable>
          <div class="d-flex justify-content-between mt-3">
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
            <div class="d-flex gap-1">
              <CButton
                v-if="!isPassWayModify"
                color="warning"
                size="sm"
                @click="startPassWayEdit(item)"
              >
                인수처리내용수정
              </CButton>
              <template v-else>
                <CButton color="danger" size="sm" @click="cancelPassWayEdit"> 취소 </CButton>
                <CButton color="primary" size="sm" @click="handlePassWaySave">저장</CButton>
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
