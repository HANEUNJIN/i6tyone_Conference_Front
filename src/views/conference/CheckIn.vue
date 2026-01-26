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
    <CCol sm="4">
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
              <div class="d-flex align-items-center gap-2">
                <h6 class="fw-bold mb-0 text-danger">{{ successMsg }}</h6>
              </div>
            </template>
          </UiSearchBar>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
  <CRow>
    <CCol sm="4">
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
  </CRow>
</template>
