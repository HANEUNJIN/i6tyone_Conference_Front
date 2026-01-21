<script setup>
import { computed, ref, watch } from 'vue';
import { HospApi } from '@/api/temp/hosp';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { CommonAPI } from '@/api/temp/common';
import { UserAPI } from '@/api/temp/user';
import { useApiToast } from '@/composables/useApiToast';
import { useHospSearchModal } from '@/composables/useHospSearchModal';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import UiModal from '@/components/ui/UiModal.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { ROUTE } from '@/constants';
import { useRouter } from 'vue-router';

// ----------------------
//  ✨composable / store
// ----------------------
const router = useRouter();
const { hide, modalState } = useHospSearchModal();
const storeAuth = useAuthStore();
const base = useBaseStore();
const { storeMenuType } = storeToRefs(base);
const toastApi = useApiToast();

// ----------------------
//  ✨reactive, ref state
// ----------------------
const isLoading = ref(false);
const hospPchart = ref('');
const hospUseYn = ref('Y');
const chartVersion = ref('');
const serviceUserId = ref('');

const hospPcharOptions = ref([]); // 기존차트 옵션
const serviceUserOptions = ref([]); // 서비스담당자 옵션
// 차트버전 옵션
const chartVersionOptions = computed(() => {
  if (storeMenuType.value === 'E') {
    return [
      { value: '', label: '차트버전' },
      { value: '1', label: '1.0' },
      { value: '2', label: '2.0' },
    ];
  } else {
    return [
      { value: '', label: '차트버전' },
      { value: 'A4401', label: '2.0' },
      { value: 'A4402', label: '5.0' },
      { value: 'A4403', label: '기타' },
    ];
  }
});
// 사용유무 옵션
const hospUseYnOptions = ref([
  { value: 'Y', label: '사용중' },
  { value: 'N', label: '사용해제' },
]);

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'hospNm', label: '병원명', width: '20%' },
  { key: 'hospTel', label: '전화번호', width: '8%' },
  { key: 'userNm', label: '서비스담당자', width: '7%' },
  { key: 'cnt', label: '수량(S/C/F)', width: '7%' },
  { key: 'setupYmd', label: '설치일', width: '8%' },
];

// ----------------------
//  ✨ methods / functions/
// ----------------------
// 기존차트 옵션 정보
const fetchHospPchart = async () => {
  try {
    const res = await CommonAPI.getPmMstClinicCode('LiSPChart');
    console.log(res);
    if (!res.ok) return toastApi.errorFromResult(res);
    const hospPcharList = res.data?.resultData?.list ?? [];
    hospPcharOptions.value = [{ codeId: '', codeNm: '기존차트' }, ...hospPcharList];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return [];
  }
};

// 서비스 담당자 리스트 (서비스 담당자 지정된 유저들만)
const fetchServiceUserList = async () => {
  try {
    const res = await UserAPI.getServiceUsers({ menuType: storeMenuType.value });
    if (!res.ok) return toastApi.errorFromResult(res);
    const serviceUserList = res.data?.resultData?.list ?? [];
    serviceUserOptions.value = [{ userId: '', userNm: '서비스담당자' }, ...serviceUserList];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return [];
  }
};

// 병원 목록
const fetchHospList = async ({
  page,
  size,
  keyword,
  hospPchart,
  hospUseYn,
  chartVersion,
  serviceUserId,
}) => {
  const params = {
    autho: '1',
    branchCd: storeAuth.userInfo.branch,
    hospPchart: hospPchart,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
    hospUseYn: hospUseYn,
    menuType: storeMenuType.value,
    chartVersion: chartVersion,
    serviceUserId: serviceUserId,
    userId: storeAuth.userInfo.userId,
  };
  try {
    isLoading.value = true;
    const res = await HospApi.getList(params);
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
  } finally {
    isLoading.value = false;
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onReset, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchHospList, {
    defaultKeyword: '',
    extra: { hospPchart, hospUseYn, chartVersion, serviceUserId },
    autoSearchOnExtraChange: true,
    disableUrlSync: true,
  });

const handleModalHide = () => {
  hide();
  onReset();
};

// 상세 페이지 이동
const goDetail = (item) => {
  base.setStoreHospName(item.hospNm || '');
  base.setStoreHospCd(item.hospCd || '');
  base.setStoreLicenseCd(item.licenseCd || '');

  if (storeMenuType.value === 'E') {
    if (
      router.currentRoute.value.name === ROUTE.Customers.Detail ||
      router.currentRoute.value.name === ROUTE.Customers.Payment
    ) {
      router.go(0);
    } else {
      router.push({ name: ROUTE.Customers.Detail });
    }
  } else {
    if (
      router.currentRoute.value.name === ROUTE.NixCustomers.Detail ||
      router.currentRoute.value.name === ROUTE.NixCustomers.Payment
    ) {
      router.go(0);
    } else {
      router.push({ name: ROUTE.NixCustomers.Detail });
    }
  }

  handleModalHide();
};

watch(
  () => modalState.visible,
  async (v) => {
    if (v) {
      items.value = [];
      await fetchHospPchart();
      await fetchServiceUserList();
      init();
    }
  },
);
</script>

<template>
  <UiModal
    v-model:visible="modalState.visible"
    title="고객 선택 [이지스차트]"
    cancel-text="닫기"
    size="lg"
    :is-confirm-btn="false"
    @cancel="handleModalHide"
  >
    <template #body>
      <UiSearchBar
        class="mb-3"
        v-model="keyword"
        :show-reset="false"
        placeholder="병원,번호,원장,요양기관,사업자"
        @submit="onSearch"
      >
        <template #extra-back>
          <CFormSelect v-model="chartVersion" size="sm" style="width: 120px">
            <option v-for="opt in chartVersionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="hospPchart" size="sm" style="width: 120px">
            <option v-for="opt in hospPcharOptions" :key="opt.value" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="hospUseYn" size="sm" style="width: 120px">
            <option v-for="opt in hospUseYnOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="serviceUserId" size="sm" style="width: 120px">
            <option v-for="opt in serviceUserOptions" :key="opt.userId" :value="opt.userId">
              {{ opt.userNm }}
            </option>
          </CFormSelect>
        </template>
      </UiSearchBar>
      <UiDataTable
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => goDetail(row)"
      />
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
    </template>
  </UiModal>
</template>

<style scoped></style>
