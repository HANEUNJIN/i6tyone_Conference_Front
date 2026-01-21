<script setup>
import { onMounted, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import { HospApi } from '@/api/temp/hosp';
import { ContractApi } from '@/api/temp/contract';
import { CommonAPI } from '@/api/temp/common';
import { cardMm, cardYy } from '@/utils/dataTime';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiGridTable from '@/components/ui/UiCustomGridTable.vue';
import UiModal from '@/components/ui/UiModal.vue';
import UiLoading from '@/components/ui/UiLoading.vue';

const taxGbOptions = [
  { codeId: '01', codeNm: '계좌' },
  { codeId: '02', codeNm: '카드' },
];

// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const modal = useConfirmModal();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const isShowModal = ref(false);
const isLoading = ref(false);
const paymentInfo = ref({});
const paymentAfterYn = ref('');
const modalPaymentInfo = ref({});
const customerInfo = ref({});
const bankOptions = ref([]);
const cardOptions = ref([]);
const PAYMENT_FIELDS = computed(() => [
  {
    cols: [
      {
        label: '결제방법',
        value: paymentInfo.value.taxGb === '01' ? '계좌이체' : '카드',
        labelWidth: 2,
        valueWidth: 2,
      },
      { label: '예금주/명의자', value: paymentInfo.value.taxOwner, labelWidth: 2, valueWidth: 2 },
      { label: '생년월일', value: paymentInfo.value.taxPrsnNo, labelWidth: 2, valueWidth: 2 },
    ],
  },
  {
    cols: [
      {
        label: '은행',
        value: paymentInfo.value.bankNm,
        labelWidth: 2,
        valueWidth: 2,
      },
      {
        label: '계좌번호',
        value: paymentInfo.value.taxNo,
        labelWidth: 2,
        valueWidth: 6,
      },
    ],
    isShowRow: paymentInfo.value.taxGb === '01',
  },
  {
    cols: [
      { label: '카드사', value: paymentInfo.value.cardNm, labelWidth: 2, valueWidth: 2 },
      { label: '카드번호', value: paymentInfo.value.taxNo, labelWidth: 2, valueWidth: 6 },
    ],
    isShowRow: paymentInfo.value.taxGb === '02',
  },
  {
    cols: [
      {
        label: '개인/법인',
        value: paymentInfo.value.personType || '-',
        labelWidth: 2,
        valueWidth: 2,
      },
      {
        label: '더빌 아이디',
        value: paymentInfo.value.theBilId || '-',
        labelWidth: 2,
        valueWidth: 6,
      },
    ],
  },
  {
    cols: [{ label: '원장 E-mail', value: paymentInfo.value.doctEmail || '-' }],
    colspan: true,
  },
  {
    cols: [{ label: '세금 E-mail', value: paymentInfo.value.taxEmail || '-' }],
    colspan: true,
  },
]);
// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchPaymentInfo = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getPaymentInfo({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    paymentInfo.value = res.data?.resultData;
    modalPaymentInfo.value = res.data?.resultData;
    if (modalPaymentInfo.value.taxGb === '01') {
      modalPaymentInfo.value.bankCd = modalPaymentInfo.value.taxCd;
      modalPaymentInfo.value.cardCd = '';
    } else {
      if (modalPaymentInfo.value.taxExpiryYm != '' && modalPaymentInfo.value.taxExpiryYm != null) {
        modalPaymentInfo.value.taxExpiryYm = modalPaymentInfo.value.taxExpiryYm.replace('/', '');
        modalPaymentInfo.value.taxExpiryYm1 = modalPaymentInfo.value.taxExpiryYm.substring(0, 2);
        modalPaymentInfo.value.taxExpiryYm2 = modalPaymentInfo.value.taxExpiryYm.substring(2, 4);
      }
      modalPaymentInfo.value.bankCd = '';
      modalPaymentInfo.value.cardCd = modalPaymentInfo.value.taxCd;
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchPaymentAfterYn = async () => {
  try {
    const res = await HospApi.getPaymentInfoAfterYn({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    paymentAfterYn.value = res.data?.resultData?.payAfterYn || 'N';
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const fetchContractLogList = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getContractLog({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    let contractLogList = [];
    contractLogList.value = res.data?.resultData?.list ?? [];
    if (contractLogList.value.length > 0) {
      // 암호화 된 정보 가져오기
      const reportUserRes = await ContractApi.getReportUserInfo({
        reportNo: contractLogList.value[0].reportNo,
        licenseCd: storeLicenseCd.value,
      });
      if (!reportUserRes.ok) return toastApi.errorFromResult(reportUserRes);
      let reportUserInfo = reportUserRes.data?.resultData?.list ?? [];
      if (reportUserInfo.length > 0) {
        customerInfo.value = reportUserInfo.find((e) => e.userTypeCd === 'A0701');
        customerInfo.value.doctNm = customerInfo.value.userNm;
        customerInfo.value.doctTel = customerInfo.value.userTel;
        customerInfo.value.doctEmail = customerInfo.value.userEmail;
      }
    } else {
      const customerInfoRes = await HospApi.getCustomerInfo({
        licenseCd: storeLicenseCd.value,
        menuType: storeMenuType.value,
      });
      if (!customerInfoRes.ok) return toastApi.errorFromResult(customerInfoRes);
      customerInfo.value.doctNm = customerInfoRes.data?.resultData?.userNm;
      customerInfo.value.doctTel = customerInfoRes.data?.resultData?.userTel;
      customerInfo.value.doctEmail = customerInfoRes.data?.resultData?.userEmail;
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchOptions = async () => {
  try {
    const [cardRes, bankRes] = await Promise.all([
      CommonAPI.getPmMstClinicCode('LiSCard'),
      CommonAPI.getPmMstClinicCode('LiSBank'),
    ]);
    const responses = { cardRes, bankRes };
    for (const [key, res] of Object.entries(responses)) {
      if (!res?.ok) return toastApi.errorFromResult(res);
    }
    cardOptions.value = [{ codeId: '', codeNm: '선택' }, ...cardRes.data?.resultData?.list];
    bankOptions.value = [{ codeId: '', codeNm: '선택' }, ...bankRes.data?.resultData?.list];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

function validateForm() {
  if (!customerInfo.value.doctNm?.trim()) return '계약자명은 필수 입니다.';
  if (!customerInfo.value.doctTel?.trim()) return '계약자 연락처는 필수 입니다.';
  if (!customerInfo.value.doctEmail?.trim()) return '계약자 이메일은 필수 입니다.';
  if (modalPaymentInfo.value.taxGb === '01') {
    if (!modalPaymentInfo.value.bankCd) return '은행을 선택해주세요.';
    if (!modalPaymentInfo.value.taxNo?.trim()) return '계좌번호를 입력해주세요.';
  } else {
    if (!modalPaymentInfo.value.cardCd) return '카드사를 선택해주세요.';
    if (!modalPaymentInfo.value.taxNo?.trim()) return '카드번호를 입력해주세요.';
    if (!modalPaymentInfo.value.taxExpiryYm2) return '유효기간 월을 입력해주세요.';
    if (!modalPaymentInfo.value.taxExpiryYm1) return '유효기간 년을 입력해주세요.';
  }

  return '';
}

const updatePaymentInfo = async () => {
  const msg = validateForm();
  if (msg) return toast.error(msg);
  toast.success('추우 작업 예정');
  isShowModal.value = false;
};

const handleChangeTaxGb = () => {
  modalPaymentInfo.value.taxNo = '';
  modalPaymentInfo.value.bankCd = '';
  modalPaymentInfo.value.cardCd = '';
};

onMounted(() => {
  fetchPaymentInfo();
  fetchPaymentAfterYn();
  fetchContractLogList();
  fetchOptions();
});
</script>

<template>
  <CCard class="h-100">
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>결제정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <UiGridTable :fields="PAYMENT_FIELDS" />
      <p v-if="paymentAfterYn === 'Y'" class="text-danger mb-0 mt-2">
        *전자계약서 결제정보 추후 입력 체크됨
      </p>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end">
      <CButton color="warning" size="sm" @click="() => (isShowModal = true)"> 변경</CButton>
    </CCardFooter>
  </CCard>

  <UiModal
    v-model:visible="isShowModal"
    title="계약자 정보 확인 및 저장"
    @cancel="() => console.log('cancel')"
    @confirm="updatePaymentInfo"
  >
    <template #body>
      <div class="d-flex flex-column gap-3">
        <CRow>
          <CCol sm="6">
            <CFormLabel>계약자명</CFormLabel>
            <CFormInput v-model="customerInfo.doctNm" placeholder="계약자명 입력" />
          </CCol>
          <CCol sm="6">
            <CFormLabel>계약자 연락처</CFormLabel>
            <CFormInput v-model="customerInfo.doctTel" maxlength="13" placeholder="(-)없이 입력" />
          </CCol>
        </CRow>
        <CCol>
          <CFormLabel>계약자 이메일</CFormLabel>
          <CFormInput v-model="customerInfo.doctEmail" placeholder="계약자 이메일 입력" />
        </CCol>
        <CRow>
          <CCol sm="6">
            <CFormLabel>계좌/카드</CFormLabel>
            <CFormSelect v-model="modalPaymentInfo.taxGb" @change="handleChangeTaxGb">
              <option v-for="opt in taxGbOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
          </CCol>
          <CCol sm="6">
            <CFormLabel>{{ modalPaymentInfo.taxGb === '01' ? '은행명' : '카드사' }}</CFormLabel>
            <CFormSelect v-if="modalPaymentInfo.taxGb === '01'" v-model="modalPaymentInfo.bankCd">
              <option v-for="opt in bankOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <CFormSelect v-else v-model="modalPaymentInfo.cardCd">
              <option v-for="opt in cardOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
          </CCol>
        </CRow>
        <CRow>
          <CCol sm="6">
            <CFormLabel>{{ modalPaymentInfo.taxGb === '01' ? '계좌번호' : '카드번호' }}</CFormLabel>
            <CFormInput
              v-model="modalPaymentInfo.taxNo"
              maxlength="19"
              placeholder="카드번호 입력"
            />
          </CCol>
          <CCol sm="6" v-if="modalPaymentInfo.taxGb === '02'">
            <CFormLabel>유효기간</CFormLabel>
            <div class="d-flex gap-1">
              <CFormSelect v-model="modalPaymentInfo.taxExpiryYm2">
                <option v-for="opt in cardYy" :key="opt.codeId" :value="opt.codeId">
                  {{ opt.codeNm }}
                </option>
              </CFormSelect>
              <CFormSelect v-model="modalPaymentInfo.taxExpiryYm1">
                <option v-for="opt in cardMm" :key="opt.codeId" :value="opt.codeId">
                  {{ opt.codeNm }}
                </option>
              </CFormSelect>
            </div>
          </CCol>
        </CRow>
        <CRow>
          <CCol sm="6">
            <CFormLabel>주민번호</CFormLabel>
            <CFormInput
              v-model="modalPaymentInfo.taxPrsnNo"
              maxlength="6"
              placeholder="주민번호 6자리 입력"
            />
          </CCol>
          <CCol sm="6">
            <CFormLabel>명의자</CFormLabel>
            <CFormInput v-model="modalPaymentInfo.taxOwner" placeholder="명의자 입력" />
          </CCol>
        </CRow>
        <p class="text-center mb-0">
          <span class="text-danger">* 위의 정보로 본인 인증 및 계약 사인이 진행 됩니다.</span
          ><br /><br />
          (계약자명이 정확히 입력 안되었을 경우<br />
          위의 입력란을 통해 다시 한번 정확히 입력해주세요)
        </p>
      </div>
    </template>
  </UiModal>
</template>
