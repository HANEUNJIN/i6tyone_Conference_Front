<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useBaseStore } from '@/stores/base';
import { MaumPlusAPI } from '@/api/maumPlus';
import { formatMoney, formatYmd } from '@/utils/common';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import { CFormSelect, CFormTextarea } from '@coreui/vue';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');

const detailInfo = ref({});
const isLoading = ref(false);
const fareItem = ref([]);
const prodNmOptions = ref([]);
const prodId = ref('');

const centerInfoFields = computed(() => [
  {
    label1: '라이선스코드',
    value1: detailInfo.value.licenseCd || '',
    label2: '생성일자',
    value2: detailInfo.value.regDt || '',
  },
  {
    label1: '센터명',
    value1: detailInfo.value.centerNm || '',
    label2: '도메인',
    value2: detailInfo.value.domain || '',
  },
  {
    label1: '이름',
    value1: detailInfo.value.repNm || '',
    label2: '핸드폰(센터전화번호)',
    value2: `${detailInfo.value.repPhone} (${detailInfo.value.centerPhone})` || '',
  },
  {
    label1: '이메일',
    value1: detailInfo.value.repEmail || '',
    label2: '상담사이메일',
    value2: detailInfo.value.partnerEmail || '',
  },
  {
    label1: '신청서작성시요금',
    value1: detailInfo.value.clifyYn === 'O' ? '별도 협의' : `${formatMoney(detailInfo.value.joinPrice)}`,
    label2: '유입경로',
    value2: detailInfo.value.inboundInfo || '',
  },
  {
    label1: '사업자번호',
    value1: detailInfo.value.businessNo || '',
    label2: '생년월일',
    value2: '',
  },
  {
    label1: '1인센터여부',
    value1: detailInfo.value.onePersonYn || '',
    label2: '문자서비스',
    value2: detailInfo.value.smsYn || '',
  },
  {
    label1: '주소',
    value1: `${detailInfo.value.addrHd} ${detailInfo.value.addrDt} [우편번호: ${detailInfo.value.postCode}]` || '',
    colspan: true,
  },
  {
    label1: '센터생성여부',
    value1: detailInfo.value.centerSeq > 0 ? `센터 생성 완료 [센터코드 : ${detailInfo.value.centerSeq}]` : '미생성',
    colspan: true,
  },
  {
    label1: '요금제',
    key: 'prodNm',
    label2: 'Clify 가맹',
    value2: detailInfo.value.clifyYn || '',
  },
  {
    label1: '메모',
    key: 'memo',
    colspan: true,
  },
]);

const FARE_COLUMNS = [
  { key: 'regYmd', label: '날짜', width: '4%' },
  { key: 'prodId', label: '코드', width: '4%' },
  { key: 'prodNm', label: '요금제', width: '10%', align: 'left' },
  { key: 'prodAmt', label: '요금금액', width: '4%', align: 'right' },
];

const fetchOptions = async () => {
  const params = {
    keyword: '',
    pageNum: 15,
    PageSize: '',
  };

  const res = await MaumPlusAPI.getProdList(params);
  if (!res.ok) {
    toastApi.errorFromResult(res);
    return { items: [], total: 0 };
  }

  prodNmOptions.value = res.data?.resultData.list ?? [];
};

const fetchDetail = async () => {
  if (!licenseCd.value)
    return;

  isLoading.value = true;

  const params = {
    licenseCd: licenseCd.value,
  };

  try {
    const res = await MaumPlusAPI.getCenterDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchList = async () => {
  try {
    const fareParams = {
      licenseCd: licenseCd.value,
    };

    const fareRes = await MaumPlusAPI.getProdLogList(fareParams);
    if (!fareRes.ok) {
      return toastApi.errorFromResult(fareRes);
    }
    let fareList = fareRes.data?.resultData?.list ?? [];
    fareItem.value = fareList.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    return toastApi.errorFromException(e);
  }
};

//Todo: 센터 생성 테스트 필요.
const onCenterCreate = async () => {
  const confirm = await modal.show({
    title: '센터 생성',
    message: '센터 생성 하시겠습니까?',
    confirmText: '센터 생성',
  });
  if (!confirm)
    return;

  let cnt = 0;

  const checkRes = await MaumPlusAPI.getCenterProdChangeCheck({ licenseCd: licenseCd.value });
  if (!checkRes.ok) {
    toastApi.errorFromResult(checkRes);
    return;
  }
  cnt = checkRes.data.resultData;

  if (cnt > 0) {
    toast.success('요금은 매월 16일 부터 익월 15일 사이 한 번만 변경 가능 합니다.');
  }

  const params = {
    bizNo: detailInfo.value.businessNo,
    centerSeq: detailInfo.value.centerSeq,
  };

  try {
    const res = await MaumPlusAPI.putCenterSeq(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('센터 생성 성공했습니다.');
    handleBack();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const onSave = async () => {
  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm)
    return;

  const params = {
    licenseCd: licenseCd.value,
    prodId: detailInfo.value.prodId,
    memo: detailInfo.value.memo,
  };

  try {
    const res = await MaumPlusAPI.putCenter(params);

    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchOptions();
  fetchDetail();
  fetchList();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">센터정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="centerInfoFields">
        <template #value-prodNm>
          <CFormSelect v-model="detailInfo.prodNm" size="sm">
            <option v-for="opt in prodNmOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <template #value-memo>
          <CFormTextarea v-model="detailInfo.memo" rows="3" />
        </template>
      </UiGridTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="secondary" @click="router.back()">뒤로</CButton>
      <CButton color="primary" size="sm" @click="onCenterCreate" :disabled="detailInfo.centerSeq > 0">센터생성</CButton>
      <CButton color="primary" size="sm" @click="onSave">저장</CButton>
    </CCardFooter>
  </CCard>

  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">요금변경내역</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="FARE_COLUMNS" :items="fareItem">
        <!-- 요금금액 -->
        <template #cell-regYmd="{ item }">
          {{ formatYmd(item.regYmd) }}
        </template>

        <!-- 요금금액 -->
        <template #cell-prodAmt="{ item }">
          {{ formatMoney(item.prodAmt) }}
        </template>
      </UiDataTable>
    </CCardBody>
  </CCard>
</template>
