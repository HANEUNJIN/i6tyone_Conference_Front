<script setup>
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { computed, onMounted, ref } from 'vue';
import { ConferenceApi } from '@/api/conference';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { isValidateEmpty } from '@/utils/common';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import { CONF_LOG_COLUMNS } from '@/constants/conference/ConfColumns';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();

const isLoading = ref(false);
const detailInfo = ref({});
const successMsg = ref('');
const keyword = ref('');
const logItems = ref([]);

const optionMap = {
  1: '슈퍼얼리',
  2: '얼리 1차',
  3: '얼리 3차',
  4: '일반',
  5: '원데이',
};

const dayMap = {
  1: '화',
  2: '수',
  3: '목',
  4: '3-day',
};

const userInfoFields = computed(() => [
  {
    label1: '구매자',
    value1: detailInfo.value.buyer || '',
    label2: '참석자',
    value2: detailInfo.value.attender || '',
  },
  {
    label1: '티켓구분',
    value1: optionMap[detailInfo.value.option] || '',
    label2: '신청일',
    value2: dayMap[detailInfo.value.day] || '',
  },
  {
    label1: '교회',
    value1: detailInfo.value.church || '',
    label2: '구매수량',
    value2: detailInfo.value.count || '',
  },
  {
    label1: '좌석구역',
    value1: detailInfo.value.area || '',
    label2: '출석여부',
    value2: detailInfo.value.attend || '',
  },
]);

const fetchList = async () => {
  isLoading.value = true;

  try {
    if (isValidateEmpty(keyword.value))
      return;

    const res = await ConferenceApi.postCheckIn(keyword.value);
    if (!res.ok) {
      toastApi.errorFromResult(res);
    }
    detailInfo.value = res.data?.data ?? [];
    successMsg.value = res.data?.resultCd === '0000' ? '성공' : res.data?.resultMsg;

    const newItem = detailInfo.value;
    const lastItem = logItems?.value[0]; // 가장 최근 로그

    if (!lastItem || lastItem.attender !== newItem.attender) {
      logItems.value.unshift(newItem);
    }
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

// usePaginatedQueryList 훅
// const { loading, items, total, page, size, keyword, init, onSearch, onPageChanged } =
//   usePaginatedQueryList(fetchList, {
//     defaultKeyword: '',
//     searchPushHistory: true,
//     queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
//     autoSearchOnExtraChange: true,
//   });

const onReset = () => {
  keyword.value = '';
  successMsg.value = '';
  detailInfo.value = {};
};

onMounted(() => {
  fetchList();
});
</script>

<template>
  <CRow>
    <CCol sm="5">
      <CCard class="mb-3">
        <CCardHeader>
          <h6 class="d-flex align-content-center gap-1 mb-0 fw-bold">현장 입장 등록</h6>
        </CCardHeader>

        <CCardBody>
          <UiSearchBar
            v-model="keyword"
            :loading="isLoading"
            :show-reset="false"
            placeholder="QR코드를 스캔하세요."
            @submit="fetchList"
          >
            <template #extra-btn>
              <CButton color="secondary" variant="outline" size="sm" type="button" @click="onReset">
                초기화
              </CButton>
            </template>
          </UiSearchBar>
        </CCardBody>
        <CCardFooter>
          <div class="d-flex justify-content-end gap-2">
            <h6 class="fw-bold mb-0 text-danger">{{ successMsg }}</h6>
          </div>
        </CCardFooter>
      </CCard>

      <CCard class="mb-3">
        <CCardHeader><h6 class="mb-0 fw-bold">회원정보</h6></CCardHeader>
        <CCardBody>
          <div class="loading" v-if="isLoading">
            <UiLoading />
          </div>
          <UiGridTable :fields="userInfoFields" />
        </CCardBody>
      </CCard>
    </CCol>
    <CCol sm="7">
      <CCard class="flex-grow-1">
        <CCardHeader>
          <h6 class="mb-0 fw-bold">등록 기록</h6>
        </CCardHeader>

        <CCardBody>
          <UiDataTable
            :columns="CONF_LOG_COLUMNS"
            :items="logItems"
            :loading="isLoading"
            :row-clickable="true"
          >
            <template #cell-option="{ item }">
              <span v-if="item.option === 1">슈퍼얼리</span>
              <span v-if="item.option === 2">얼리 1차</span>
              <span v-if="item.option === 3">얼리 2차</span>
              <span v-if="item.option === 4">공식</span>
              <span v-if="item.option === 5">이벤트</span>
              <span v-if="item.option === 6">현장구매</span>
              <span v-if="item.option === 7">VIP</span>
              <span v-else></span>
            </template>

            <template #cell-day="{ item }">
              <div class="fw-bold">
                <span v-if="item.day === 1">화</span>
                <span v-if="item.day === 2">수</span>
                <span v-if="item.day === 3">목</span>
                <span v-if="item.day === 4">3-day</span>
                <span v-else></span>
              </div>
            </template>
          </UiDataTable>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
</template>
