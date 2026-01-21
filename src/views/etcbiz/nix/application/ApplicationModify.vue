<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect } from '@coreui/vue';
import { datepickerFixed, formatYmd, getTodayYmd, logFormData, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { NixEtcbizApi } from '@/api/nixetcbiz';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

const licenseCd = computed(() => route.query.licenseCd || '');
const procCode = computed(() => route.query.procCode || '');

const detailInfo = ref({}); // 상세 정보
const isLoading = ref(false); // 상세 본문용 로딩 (스피너)
const isSubmitting = ref(false); //중복 제출 방지용

const statusOptions = ref([
  { value: 'N', name: '미완료' },
  { value: 'Y', name: '완료' },
]);

const procStatusOptions = ref([
  { value: 'N', name: '-' },
  { value: 'I', name: '진행' },
  { value: 'E', name: '완료' },
  { value: 'H', name: '보류' },
]);

const fmtAddress = (addr, zoneCode) => {
  if (!addr) return '';
  const z =
    zoneCode && zoneCode !== 'null' && String(zoneCode).trim() !== ''
      ? ` [우편번호 : ${zoneCode}]`
      : '';
  return `${addr}${z}`;
};

async function fetchDetail() {
  if (!licenseCd.value) return;
  const params = {
    licenseCd: licenseCd.value,
    procCode: procCode.value,
  };
  isLoading.value = true;
  try {
    const res = await NixEtcbizApi.getApplicationDetail(params);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};
    detailInfo.value.happyCallYmd = formatYmd(detailInfo.value.happyCallYmd);
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
}

const applyInfoFields = computed(() => [
  {
    label1: '병원명',
    value1: detailInfo.value.hospNm || '',
    label2: '대리점',
    value2: detailInfo.value.corpNm || '',
  },
  {
    label1: '라이센스번호',
    value1: detailInfo.value.licenseCd || '',
    label2: '요양기관번호',
    value2: detailInfo.value.hospNo || '',
  },
  {
    label1: '전화번호',
    value1: detailInfo.value.telNo || '',
    label2: '대표자',
    value2: detailInfo.value.capNm || '',
  },
  {
    label1: '진료과',
    value1: detailInfo.value.deptNm || '',
    label2: '수량',
    value2: detailInfo.value.reqCnt || '',
  },
  {
    label1: '주소',
    value1: fmtAddress(detailInfo.value.addr, detailInfo.value.zoneCode),
    label2: '이메일',
    value2: detailInfo.value.email || '',
  },
  {
    label1: '사업자등록증(사업자번호)',
    value1: detailInfo.value.businessNo || '',
    label2: '헬로100사용여부',
    value2: detailInfo.value.hello100Yn || '',
  },
  {
    label1: '개인정보 제3자 제공 동의 체크',
    value1: detailInfo.value.thirdTermsYn || '',
    colspan: true,
  },
  {
    label1: '금액',
    value1: `단가:${detailInfo.value.reqPrice || 0} 합계금액 :${detailInfo.value.reqPriceSum || 0}`,
    colspan: true,
  },
]);

const statusInfoFields = computed(() => {
  const fields = [
    { label1: '피드백여부', colspan: true, key: 'procAccYn' },
    { label1: '진행상태', colspan: true, key: 'procSetYn' },
    { label1: '계약완료여부', colspan: true, key: 'procFinalYn' },
    { label1: '영업특이사항', colspan: true, key: 'memo' },
  ];

  // 해피콜 관련 필드 조건부 추가
  if (detailInfo.value.happyCallYn === 'N') {
    fields.splice(3, 0, {
      label1: '해피콜여부',
      colspan: true,
      key: 'happyCallYn',
    });
  } else {
    fields.splice(3, 0, {
      label1: '해피콜여부',
      label2: '완료날짜',
      key1: 'happyCallYn',
      key2: 'happyCallYmd',
    });
  }

  return fields;
});

function buildParams() {
  return {
    happyCallYmd: detailInfo.value.happyCallYn === 'Y' ? detailInfo.value.happyCallYmd : '',
    happyCallYn: detailInfo.value.happyCallYn,
    procCode: detailInfo.value.procCode,
    licenseCd: licenseCd.value,
    procAccYn: detailInfo.value.procAccYn,
    procSetYn: detailInfo.value.procSetYn,
    procFinalYn: detailInfo.value.procFinalYn,
    memo: (detailInfo.value.memo || '').trim(),
  };
}

function createFormData(p) {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('HappyCallYmd', p.happyCallYmd);
  append('HappyCallYn', p.happyCallYn);
  append('ProcCode', p.procCode);
  append('LicenseCd', p.licenseCd);
  append('ProcAccYn', p.procAccYn);
  append('ProcSetYn', p.procSetYn);
  append('ProcFinalYn', p.procFinalYn);
  append('Memo', p.memo);
  return fd;
}

async function handleSubmit() {
  if (isSubmitting.value) return;

  if (detailInfo.value.happyCallYn === 'Y') {
    const temp = detailInfo.value.entYmd;
    const temp2 = toYmdCompact(getTodayYmd());

    if (temp2 < temp) {
      toast.error('신청일자 이전으로 설정할 수 없습니다.');
      return;
    }
  }

  if (detailInfo.value.procSetYn === '2' && detailInfo.value.procSetYnNm === '') {
    toast.error('설치완료 날짜를 입력해주세요.');
    return;
  }

  if (detailInfo.value.happyCallYn === 'Y' && detailInfo.value.procCode === 'Kiosk2') {
    if (detailInfo.value.happyCallYmd === null || detailInfo.value.happyCallYmd === '') {
      toast.error('해피콜 날짜를 입력해주세요.');
      return;
    }
  }

  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    isSubmitting.value = true;

    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await NixEtcbizApi.putApplicationModify(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

watch(
  () => detailInfo.value,
  (val) => console.log(val),
  { deep: true },
);

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader><h6 class="mb-0">신청정보</h6></CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="applyInfoFields" />
    </CCardBody>
  </CCard>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">진행상태</h6>
      <div class="d-flex justify-content-end gap-2">
        <CButton color="secondary" size="sm" @click="router.back()">뒤로</CButton>
        <CButton color="primary" size="sm" @click="handleSubmit">저장</CButton>
      </div>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="statusInfoFields">
        <template #value-procAccYn>
          <CFormSelect v-model="detailInfo.procAccYn" size="sm">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
        <template #value-procSetYn>
          <CFormSelect v-model="detailInfo.procSetYn" size="sm">
            <option v-for="opt in procStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
        <template #value-procFinalYn>
          <CFormSelect v-model="detailInfo.procFinalYn" size="sm">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
        <template #value-happyCallYn>
          <CFormSelect v-model="detailInfo.happyCallYn" size="sm">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.name }}
            </option>
          </CFormSelect>
        </template>
        <template #value-happyCallYmd>
          <Datepicker v-model="detailInfo.happyCallYmd" v-bind="datepickerFixed" locale="ko" :ui="{ input: 'form-control form-control-sm' }" />
        </template>
        <template #value-memo>
          <CFormTextarea v-model="detailInfo.memo" rows="3" />
        </template>
      </UiGridTable>
    </CCardBody>
  </CCard>
</template>

<style scoped>
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
</style>
