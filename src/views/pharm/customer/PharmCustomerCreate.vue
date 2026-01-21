<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useBaseStore } from '@/stores/base';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect } from '@coreui/vue';
import { datepickerFixed, logFormData, toYmdCompact } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { CommonAPI } from '@/api/temp/common';
import { PharmAPI } from '@/api/temp/pharm';

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
const isLoading = ref(false);
const optionsLoading = ref(false);

const companyCd = ref(''); //업체
const companyCdOptions = ref([]);

const companyBusiCd = ref(''); //영업 업체
const companyBusiCdOptions = ref([]);

const prodId = ref(''); //상품선택 - QR
const prodIdOptions = ref([]);

const crmId = ref(''); //상품선택 - CRM
const crmIdOptions = ref([]);

const chkProPharm = ref(false);
const chkProCrm = ref(false);
const chkProQr = ref(false);

const form = reactive({
  program: '',
  programAmt: 0,
  pharmBsNo: '',
  pcCnt: 0,
  pharmNo: '',
  pharmNm: '',
  addr: '',
  email: '',
  phoneNo: '',
  faxNo: '',
  userNm: '',
  userPhoneNo: '',
  descMsg: '',
  applyYmd: '',
});

const createFields = computed(() => [
  {
    label1: '업체',
    key: 'companyCd',
    colspan: true,
  },
  {
    label1: '영업 업체',
    key: 'companyBusiCd',
    colspan: true,
  },
  {
    label1: '프로그램 사용 현황',
    key: 'program',
    colspan: true,
  },
  {
    label1: '이지스팜요금',
    key: 'programAmt',
    colspan: true,
  },
  {
    label1: '사업자등록번호',
    key: 'pharmBsNo',
    colspan: true,
  },
  {
    label1: '상품선택 - QR',
    key: 'prodId',
    colspan: true,
  },
  {
    label1: '상품선택 - CRM',
    key: 'crmId',
    colspan: true,
  },
  {
    label1: 'PC라이선스 제한수량',
    key: 'pcCnt',
    colspan: true,
  },
  {
    label1: '요양기관번호',
    key: 'pharmNo',
    colspan: true,
  },
  {
    label1: '약국명',
    key: 'pharmNm',
    colspan: true,
  },
  {
    label1: '주소',
    key: 'addr',
    colspan: true,
  },
  {
    label1: 'email',
    key: 'email',
    colspan: true,
  },
  {
    label1: '약국전화번호',
    key: 'phoneNo',
    colspan: true,
  },
  {
    label1: '팩스번호',
    key: 'faxNo',
    colspan: true,
  },
  {
    label1: '약국장명',
    key: 'userNm',
    colspan: true,
  },
  {
    label1: '약국장 핸드폰 번호',
    key: 'userPhoneNo',
    colspan: true,
  },
  {
    label1: '비고',
    key: 'descMsg',
    colspan: true,
  },
  {
    label1: '사용시작일',
    key: 'applyYmd',
    colspan: true,
  },
]);

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    // 업체
    const companyCdRes = await CommonAPI.getCodePharmList('01');
    if (!companyCdRes.ok) {
      toastApi.errorFromResult(companyCdRes);
    }
    const companyCdList = companyCdRes.data?.resultData?.list ?? [];
    companyCdOptions.value = [{ codeId: '', codeNm: '선택' }, ...companyCdList];

    //영업 업체
    const companyBusiCdRes = await CommonAPI.getCodePharmList('04');
    if (!companyBusiCdRes.ok) {
      toastApi.errorFromResult(companyBusiCdRes);
    }
    const companyBusiCdList = companyBusiCdRes.data?.resultData?.list ?? [];
    companyBusiCdOptions.value = [...companyBusiCdList];

    //상품선택 - QR
    const prodIdRes = await PharmAPI.getProdListNoPaging('020001');
    if (!prodIdRes.ok) {
      toastApi.errorFromResult(prodIdRes);
    }
    const prodIdList = prodIdRes.data?.resultData?.list ?? [];
    prodIdOptions.value = [{ prodId: '', prodNm: '선택' }, ...prodIdList];

    //상품선택 - CRM
    const crmIdRes = await PharmAPI.getProdListNoPaging('020002');
    if (!crmIdRes.ok) {
      toastApi.errorFromResult(crmIdRes);
    }
    const crmIdList = crmIdRes.data?.resultData?.list ?? [];
    crmIdOptions.value = [{ prodId: '', prodNm: '선택' }, ...crmIdList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const onSave = async () => {
  let chkProPharmYn = chkProPharm.value ? 'E' : '';
  let chkProCrmYn = chkProCrm.value ? 'C' : '';
  let chkProQrYn = chkProQr.value ? 'Q' : '';
  let programStatus = chkProPharmYn + chkProCrmYn + chkProQrYn;

  const errorMsg = validationCheck(form, programStatus);
  if (errorMsg)
    return toast.error(errorMsg);

  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm)
    return;

  try {
    const params = makeParams(programStatus);
    const formData = createFormData(params);
    logFormData(formData);

    const res = await PharmAPI.postLicense(formData);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const validationCheck = (i, programStatus) => {
  if (programStatus.length === 0)
    return '프로그램 사용 현황 하나 체크는 필수입니다.';

  if (!i.pharmNo?.trim())
    return '요양기관 번호 입력은 필수입니다.';

  if (!companyCd.value?.trim())
    return '업체코드를 입력해주세요.';

  if (!i.pharmBsNo?.trim())
    return '사업자등록번호를 입력해주세요.';

  if (!prodId.value?.trim())
    return '상품을 선택해주세요.';

  if (!i.pharmNm?.trim())
    return '약국명을 입력해주세요.';

  if (!i.applyYmd?.trim())
    return '사용시작일을 등록해주세요.';
};

const makeParams = (programStatus) => {
  return {
    programStatus: programStatus,
    programAmt: form.programAmt,
    email: form.email,
    prodId: prodId.value,
    companyCd: companyCd.value,
    companyBusiCd: companyBusiCd.value,
    pharmBsNo: form.pharmBsNo,
    pharmNo: form.pharmNo,
    pharmNm: form.pharmNm,
    addr: form.addr,
    phoneNo: form.phoneNo.replace('-', ''),
    faxNo: form.faxNo.replace('-', ''),
    userNm: form.userNm,
    userPhoneNo: form.userPhoneNo.replace('-', ''),
    descMsg: form.descMsg,
    applyYmd: toYmdCompact(form.applyYmd),
    pcCnt: form.pcCnt,
    crmId: crmId.value === '' ? '0' : crmId.value,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('programStatus', p.programStatus);
  append('programAmt', p.programAmt);
  append('email', p.email);
  append('prodId', p.prodId);
  append('companyCd', p.companyCd);
  append('companyBusiCd', p.companyBusiCd);
  append('pharmBsNo', p.pharmBsNo);
  append('pharmNo', p.pharmNo);
  append('pharmNm', p.pharmNm);
  append('addr', p.addr);
  append('phoneNo', p.phoneNo);
  append('faxNo', p.faxNo);
  append('userNm', p.userNm);
  append('userPhoneNo', p.userPhoneNo);
  append('descMsg', p.descMsg);
  append('applyYmd', p.applyYmd);
  append('pcCnt', p.pcCnt);
  append('crmId', p.crmId);
  return fd;
};

onMounted(() => {
  fetchSearchOptions();
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
      <UiGridTable :fields="createFields">
        <!-- 업체 -->
        <template #value-companyCd>
          <CFormSelect v-model="companyCd" size="sm">
            <option v-for="opt in companyCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!-- 영업 업체 -->
        <template #value-companyBusiCd>
          <CFormSelect v-model="companyBusiCd" size="sm">
            <option v-for="opt in companyBusiCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!-- 프로그램 사용 현황 -->
        <template #value-program>
          <div class="d-flex gap-1">
            <CFormCheck class="checkbox" id="chkProPharm" label="이지스팜" v-model="chkProPharm" />
            <CFormCheck class="checkbox" id="chkProCrm" label="CRM 서비스" v-model="chkProCrm" />
            <CFormCheck class="checkbox" id="chkProQr" label="QR 서비스" v-model="chkProQr" />
          </div>
        </template>

        <!-- 이지스팜요금 -->
        <template #value-programAmt>
          <CFormInput v-model="form.programAmt" type="number" size="sm" />
        </template>

        <!-- 사업자등록번호 -->
        <template #value-pharmBsNo>
          <CFormInput v-model="form.pharmBsNo" size="sm" />
        </template>

        <!-- 상품선택 - QR -->
        <template #value-prodId>
          <CFormSelect v-model="prodId" size="sm">
            <option v-for="opt in prodIdOptions" :key="opt.prodId" :value="opt.prodId">
              {{ opt.prodNm }}
            </option>
          </CFormSelect>
        </template>

        <!-- 상품선택 - CRM -->
        <template #value-crmId>
          <CFormSelect v-model="crmId" size="sm">
            <option v-for="opt in crmIdOptions" :key="opt.prodId" :value="opt.prodId">
              {{ opt.prodNm }}
            </option>
          </CFormSelect>
        </template>

        <!-- PC라이선스 제한수량 -->
        <template #value-pcCnt>
          <CFormInput v-model="form.pcCnt" type="number" size="sm" />
        </template>

        <!-- 요양기관번호 -->
        <template #value-pharmNo>
          <CFormInput v-model="form.pharmNo" size="sm" />
        </template>

        <!-- 약국명 -->
        <template #value-pharmNm>
          <CFormInput v-model="form.pharmNm" size="sm" />
        </template>

        <!-- 주소 -->
        <template #value-addr>
          <CFormInput v-model="form.addr" size="sm" />
        </template>

        <!-- email -->
        <template #value-email>
          <CFormInput v-model="form.email" size="sm" />
        </template>

        <!-- 약국전화번호 -->
        <template #value-phoneNo>
          <CFormInput v-model="form.phoneNo" size="sm" />
        </template>

        <!-- 팩스번호 -->
        <template #value-faxNo>
          <CFormInput v-model="form.faxNo" size="sm" />
        </template>

        <!-- 약국장명 -->
        <template #value-userNm>
          <CFormInput v-model="form.userNm" size="sm" />
        </template>

        <!-- 약국장 핸드폰 번호 -->
        <template #value-userPhoneNo>
          <CFormInput v-model="form.userPhoneNo" size="sm" />
        </template>

        <!-- 비고 -->
        <template #value-descMsg>
          <CFormInput v-model="form.descMsg" size="sm" />
        </template>

        <!-- 사용시작일 -->
        <template #value-applyYmd>
          <Datepicker v-model="form.applyYmd" v-bind="datepickerFixed" locale="ko"
                      :ui="{ input: 'form-control form-control-sm' }" />
        </template>
      </UiGridTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="secondary" @click="router.back()">뒤로</CButton>
      <CButton color="primary" size="sm" @click="onSave">저장</CButton>
    </CCardFooter>
  </CCard>
</template>
