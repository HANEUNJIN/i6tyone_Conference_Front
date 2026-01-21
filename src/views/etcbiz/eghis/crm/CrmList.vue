<script setup>
import {
  datepickerFixed,
  formatPhoneKR,
  formatYmd,
  getTodayYmd,
  toYmdCompact,
} from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CFormSelect } from '@coreui/vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { CommonAPI } from '@/api/temp/common';
import { useExcelDownload } from '@/composables/useExcelDownload';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { CrmAPI } from '@/api/temp/crm';
import { left } from '@popperjs/core';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useFileActions } from '@/composables/useFileActions';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();
const { handleFile } = useFileActions();
const { downloadExcel } = useExcelDownload();

// ----------------------
// ✨ reactive state
// ----------------------
const optionsLoading = ref(false);
const dateFrom = ref('2024-07-22');
const dateTo = ref(getTodayYmd());

//대리점
const branchOptions = ref([]);
const branch = ref(auth.userInfo.branch === '00' ? '' : auth.userInfo.branch);

//진행상태
const progressOptions = ref([]);
const progress = ref('');

//처리자
const userIdOptions = ref([
  { codeId: '', codeNm: '처리자' },
  { codeId: 'song42', codeNm: '송은선' },
  { codeId: 'rina8915', codeNm: '임리나' },
  { codeId: 'ljj', codeNm: '이진주' },
  { codeId: 'thfdl7723', codeNm: '이솔이' },
  { codeId: 'pms9919', codeNm: '박명선' },
  { codeId: 'psm95', codeNm: '박상만' },
]);
const userId = ref();

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '4%' },
  { key: 'licenseCd', label: '라이선스', width: '8%' },
  { key: 'businessNo', label: '사업자등록번호', width: '8%' },
  { key: 'hospNm', label: '병원명', width: '17%', align: left },
  { key: 'mainDoctorNm', label: '원장명', width: '5%' },
  { key: 'corpNm', label: '대리점', width: '9%' },
  { key: 'regDt', label: '업로드 날짜', width: '8%' },
  { key: 'fileUri', label: '파일', width: '5%' },
  { key: 'progressSt', label: '처리', width: '8%' },
  { key: 'smsTelno', label: '번호', width: '6%' },
  { key: 'progressStDt', label: '처리일', width: '6%' },
  { key: 'userNm', label: '처리자', width: '6%' },
];

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    //대리점
    const branchRes = await CommonAPI.getBranchCorp({
      bonsaFlag: 'N',
      menuType: base.storeMenuType,
    });
    if (!branchRes.ok) {
      toastApi.errorFromResult(branchRes);
    }

    const branchList = branchRes.data?.resultData?.list ?? [];
    branchOptions.value = [{ codeId: '', codeNm: '대리점' }, ...branchList];

    //처리상태
    const progressRes = await CommonAPI.getCode('A42');
    if (!progressRes.ok) {
      toastApi.errorFromResult(progressRes);
      return;
    }

    const progressList = progressRes.data?.resultData?.list ?? [];
    progressOptions.value = [{ codeId: '', codeNm: '진행상태' }, ...progressList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchList = async ({ page, size, keyword, branch }) => {
  const params = {
    autho: '1',
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    branch: branch,
    progressSt: progress.value,
    userId: userId.value,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await CrmAPI.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
};

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    extra: { branch, progress, userId },
    autoSearchOnExtraChange: true,
  });

const excelDownload = async () => {
  if (formatYmd(dateTo.value) < formatYmd(dateFrom.value))
    return toast.error('조회 날짜가 잘못 입력되었습니다.');

  const params = {
    autho: '1',
    dateFrom: toYmdCompact(dateFrom.value),
    dateTo: toYmdCompact(dateTo.value),
    progressSt: progress.value,
    userId: userId.value,
    keyword: keyword.value,
  };

  const excelRes = await CrmAPI.getExcel(params);
  const fileName = '통신이용증명서신청내역';
  downloadExcel(excelRes, fileName);
};

const fileOpen = (pdfUrl) => {
  handleFile(pdfUrl, {
    fileName: '',
    confirmTitle: '',
    confirmMessage: '파일을 여시겠습니까?',
  });
};

const updateProgress = async (item, code) => {
  const confirm = await modal.show({
    title: '저장',
    message: '저장 하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm) return;

  const params = {
    LicenseCd: item.licenseCd,
    Seq: item.seq,
    UserId: auth?.userInfo?.userId ?? '',
    CodeId: code,
  };

  try {
    const res = await CrmAPI.putProgress(params);
    if (!res.ok) return toastApi.errorFromResult(res);
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchSearchOptions();
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="false"
        placeholder="병원명,원장,전화번호"
        @submit="onSearch"
      >
        <template #extra-front>
          <div class="d-flex flex-row align-items-center gap-1">
            <Datepicker
              v-model="dateFrom"
              v-bind="datepickerFixed"
              locale="ko"
              style="width: 140px"
              :clearable="false"
              :ui="{ input: 'form-control form-control-sm' }"
            />
            <span>~</span>
            <Datepicker
              v-model="dateTo"
              v-bind="datepickerFixed"
              locale="ko"
              style="width: 140px"
              :clearable="false"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </div>

          <!--대리점-->
          <CFormSelect v-model="branch" size="sm" style="width: auto">
            <option v-for="opt in branchOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <template #extra-back>
          <!--처리상태-->
          <CFormSelect v-model="progress" size="sm" style="width: 120px">
            <option v-for="opt in progressOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--처리자-->
          <CFormSelect v-model="userId" size="sm" style="width: 120px">
            <option v-for="opt in userIdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #extra-btn>
          <CButton color="success" size="sm" type="button" @click="excelDownload">엑셀</CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable :columns="COLUMNS" :items="items" :loading="loading">
        <template #cell-fileUri="{ item }">
          <CButton color="success" size="sm" type="button" @click="fileOpen(item.fileUri)">
            <CIcon name="cil-file" />
          </CButton>
        </template>

        <template #cell-progressSt="{ item }">
          <div v-if="item.progressSt !== null">{{ item.progressStNm }}</div>
          <div v-else>
            <CButton
              color="success"
              size="sm"
              type="button"
              class="me-2"
              @click="updateProgress(item, 'A4201')"
              >완료
            </CButton>
            <CButton color="danger" size="sm" type="button" @click="updateProgress(item, 'A4202')"
              >반려
            </CButton>
          </div>
        </template>

        <template #cell-smsTelno="{ item }">
          {{ formatPhoneKR(item?.smsTelno) }}
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
</template>
