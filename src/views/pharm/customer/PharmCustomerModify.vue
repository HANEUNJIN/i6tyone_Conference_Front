<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useBaseStore } from '@/stores/base';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect } from '@coreui/vue';
import { datepickerFixed, formatMoney, logFormData, toYmdCompact } from '@/utils/common';
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
const licenseCd = computed(() => route.query.licenseCd || '');
const applyYmd = computed(() => route.query.applyYmd || '');

const isLoading = ref(false);
const detailInfo = ref({});

const companyCd = ref(''); //업체
const companyCdOptions = ref([]);

const companyBusiCd = ref(''); //영업 업체
const companyBusiCdOptions = ref([]);

const chkProPharm = ref(false);
const chkProCrm = ref(false);
const chkProQr = ref(false);

const createFields = computed(() => [
  {
    label1: '라이선스코드',
    value1: detailInfo.value.licenseCd || '',
    label2: '요양기관번호',
    key2: 'pharmNo',
  },
  {
    label1: '업체',
    key1: 'companyCd',
    label2: '영업 업체',
    key2: 'companyBusiCd',
  },
  {
    label1: '프로그램 현황 (검색 용도)',
    key1: 'programStatus',
    label2: '이지스팜요금',
    value2: formatMoney(detailInfo.value.programAmt) || '',
  },
  {
    label1: '사업자등록번호',
    key1: 'pharmBsNo',
    label2: 'PC라이선스 제한수량',
    key2: 'pcCnt',
  },
  {
    label1: 'QR 상품',
    value1: detailInfo.value.prodNm || '',
    label2: 'CRM 상품',
    value2: detailInfo.value.crmNm || '',
  },
  {
    label1: '약국명',
    key1: 'pharmNm',
    label2: 'email',
    key2: 'email',
  },
  {
    label1: '주소',
    key: 'addr',
    colspan: true,
  },
  {
    label1: '약국전화번호',
    key1: 'phoneNo',
    label2: '팩스번호',
    key2: 'faxNo',
  },
  {
    label1: '원장명',
    key1: 'userNm',
    label2: '원장 핸드폰 번호',
    key2: 'userPhoneNo',
  },
  {
    label1: '비고',
    key: 'descMsg',
    colspan: true,
  },
  {
    label1: 'QR 사용시작일(갱신일)',
    key1: 'applyYmd',
    label2: 'QR 만료일',
    key2: 'expYmd',
  },
]);

const fetchSearchOptions = async () => {
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
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const fetchDetail = async () => {
  try {
    const params = {
      licenseCd: licenseCd.value,
      applyYmd: applyYmd.value,
    };

    const res = await PharmAPI.getLicenseDetail(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.resultData ?? {};

    const statusMap = {
      E: '이지스팜',
      C: 'CRM 서비스',
      Q: 'QR서비스',
    };

    const codes = detailInfo.value.programStatus.split('');
    detailInfo.value.programStatus = codes.map(code => statusMap[code]).filter(Boolean).join(', ');

    chkProPharm.value = codes.includes('E'); // 이지스팜
    chkProCrm.value = codes.includes('C'); // CRM 서비스
    chkProQr.value = codes.includes('Q'); // QR 서비스

    detailInfo.value.programAmt = detailInfo.value.programAmt ?? -999;
    detailInfo.value.companyBusiCd = detailInfo.value.companyBusiCd ?? '040000';
    detailInfo.value.oriPcCnt = detailInfo.value.pcCnt;
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const onSave = async () => {
  // const errorMsg = validationCheck(detailInfo.value);
  // if (errorMsg)
  //   return toast.error(errorMsg);

  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm)
    return;

  try {
    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await PharmAPI.putLicense(formData);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const validationCheck = (f) => {
  if (!f.companyCd?.trim())
    return '업체코드를 입력해주세요.';

  if (!f.pharmBsNo?.trim())
    return '사업자등록번호를 입력해주세요.';

  if (!f.pharmNm?.trim())
    return '약국명을 입력해주세요.';

  if (!f.applyYmd?.trim())
    return '사용시작일을 등록해주세요.';
};

const buildParams = () => {
  let chkProPharmYn = chkProPharm.value ? 'E' : '';
  let chkProCrmYn = chkProCrm.value ? 'C' : '';
  let chkProQrYn = chkProQr.value ? 'Q' : '';
  let programStatus = chkProPharmYn + chkProCrmYn + chkProQrYn;

  let updatePcCnt = 0;
  let updatePcCntFlag = '';

  if (detailInfo.value.pcCnt >= detailInfo.value.oriPcCnt) {
    updatePcCnt = detailInfo.value.pcCnt - detailInfo.value.oriPcCnt;
    updatePcCntFlag = 'I';
  } else {
    updatePcCnt = detailInfo.value.oriPcCnt - detailInfo.value.pcCnt;
    updatePcCntFlag = 'M';
  }

  return {
    programStatus: programStatus,
    programAmt: detailInfo.value.programAmt,
    email: detailInfo.value.email,
    licenseCd: licenseCd.value,
    companyCd: detailInfo.value.companyCd,
    companyBusiCd: detailInfo.value.companyBusiCd,
    pharmBsNo: detailInfo.value.pharmBsNo,
    pharmNo: detailInfo.value.pharmNo,
    pharmNm: detailInfo.value.pharmNm,
    addr: detailInfo.value.addr,
    phoneNo: detailInfo.value.phoneNo.replace('-', ''),
    faxNo: detailInfo.value.faxNo.replace('-', ''),
    userNm: detailInfo.value.userNm,
    userPhoneNo: detailInfo.value.userPhoneNo.replace('-', ''),
    descMsg: detailInfo.value.descMsg,
    prodId: detailInfo.value.prodId,
    updatePcCnt: updatePcCnt,
    updatePcCntFlag: updatePcCntFlag,
    pcCnt: detailInfo.value.pcCnt,
    oriApplyYmd: toYmdCompact(detailInfo.value.applyYmd),
    applyYmd: toYmdCompact(detailInfo.value.applyYmd),
    expYmd: toYmdCompact(detailInfo.value.expYmd),
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('ProgramStatus', p.programStatus);
  append('ProgramAmt', p.programAmt);
  append('Email', p.email);
  append('LicenseCd', p.licenseCd);
  append('CompanyCd', p.companyCd);
  append('CompanyBusiCd', p.companyBusiCd);
  append('PharmBsNo', p.pharmBsNo);
  append('PharmNo', p.pharmNo);
  append('PharmNm', p.pharmNm);
  append('Addr', p.addr);
  append('PhoneNo', p.phoneNo);
  append('FaxNo', p.faxNo);
  append('UserNm', p.userNm);
  append('UserPhoneNo', p.userPhoneNo);
  append('DescMsg', p.descMsg);
  append('prodId', p.prodId);
  append('UpdatePcCnt', p.updatePcCnt);
  append('UpdatePcCntFlag', p.updatePcCntFlag);
  append('PcCnt', p.pcCnt);
  append('OriApplyYmd', p.oriApplyYmd);
  append('ApplyYmd', p.applyYmd);
  append('ExpYmd', p.expYmd);
  return fd;
};

onMounted(() => {
  fetchSearchOptions();
  fetchDetail();
});
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">약국정보수정</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="createFields">
        <!-- 요양기관번호 -->
        <template #value-pharmNo>
          <CFormInput v-model="detailInfo.pharmNo" size="sm" />
        </template>

        <!-- 업체 -->
        <template #value-companyCd>
          <CFormSelect v-model="detailInfo.companyCd" size="sm">
            <option v-for="opt in companyCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!-- 영업 업체 -->
        <template #value-companyBusiCd>
          <CFormSelect v-model="detailInfo.companyBusiCd" size="sm">
            <option v-for="opt in companyBusiCdOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>

        <!-- 프로그램 현황 (검색 용도) -->
        <template #value-programStatus>
          <div class="d-flex gap-1">
            <CFormCheck class="checkbox" id="chkProPharm" label="이지스팜" v-model="chkProPharm" />
            <CFormCheck class="checkbox" id="chkProCrm" label="CRM 서비스" v-model="chkProCrm" />
            <CFormCheck class="checkbox" id="chkProQr" label="QR 서비스" v-model="chkProQr" />
          </div>
        </template>

        <!-- 사업자등록번호 -->
        <template #value-pharmBsNo>
          <CFormInput v-model="detailInfo.pharmBsNo" size="sm" />
        </template>

        <!-- PC라이선스 제한수량 -->
        <template #value-pcCnt>
          <CFormInput v-model="detailInfo.pcCnt" type="number" size="sm" />
        </template>

        <!-- 약국명 -->
        <template #value-pharmNm>
          <CFormInput v-model="detailInfo.pharmNm" size="sm" />
        </template>

        <!-- email -->
        <template #value-email>
          <CFormInput v-model="detailInfo.email" size="sm" />
        </template>

        <!-- 주소 -->
        <template #value-addr>
          <CFormInput v-model="detailInfo.addr" size="sm" />
        </template>

        <!-- 약국전화번호 -->
        <template #value-phoneNo>
          <CFormInput v-model="detailInfo.phoneNo" size="sm" />
        </template>

        <!-- 팩스번호 -->
        <template #value-faxNo>
          <CFormInput v-model="detailInfo.faxNo" size="sm" />
        </template>

        <!-- 원장명 -->
        <template #value-userNm>
          <CFormInput v-model="detailInfo.userNm" size="sm" />
        </template>

        <!-- 원장 핸드폰 번호 -->
        <template #value-userPhoneNo>
          <CFormInput v-model="detailInfo.userPhoneNo" size="sm" />
        </template>

        <!-- 비고 -->
        <template #value-descMsg>
          <CFormInput v-model="detailInfo.descMsg" size="sm" />
        </template>

        <!-- 사용시작일 -->
        <template #value-applyYmd>
          <Datepicker v-model="detailInfo.applyYmd" v-bind="datepickerFixed" locale="ko"
                      :ui="{ input: 'form-control form-control-sm' }" />
        </template>

        <!-- 만료일	-->
        <template #value-expYmd>
          <Datepicker v-model="detailInfo.expYmd" v-bind="datepickerFixed" locale="ko"
                      :ui="{ input: 'form-control form-control-sm' }" />
        </template>
      </UiGridTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="secondary" size="sm" @click="router.back()">뒤로</CButton>
      <CButton color="primary" size="sm" @click="onSave">저장</CButton>
    </CCardFooter>
  </CCard>
</template>
