<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useBaseStore } from '@/stores/base';
import { ROUTE } from '@/constants/routeName';
import { PharmAPI } from '@/api/temp/pharm';
import {
  datepickerFixed,
  formatMoney,
  formatPhoneKR,
  formatYmd,
  getTodayYmd,
  logFormData,
  normalizeYmd,
  toYmdCompact,
} from '@/utils/common';
import { useFileActions } from '@/composables/useFileActions';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiAttachments from '@/components/ui/UiAttachments.vue';
import UiModal from '@/components/ui/UiModal.vue';
import Datepicker from '@vuepic/vue-datepicker';
import { CFormSelect } from '@coreui/vue';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();
const { handleFile } = useFileActions();

// ----------------------
// ✨ reactive state
// ----------------------
const licenseCd = computed(() => route.query.licenseCd || '');
const applyYmd = computed(() => route.query.applyYmd || '');

const detailInfo = ref({});
const isLoading = ref(false);
const isDeleting = ref(false);

//갱신예정정보
const renewItems = ref([]);
const amtItems = ref([]);

//계약서
const QRContractItems = ref([]);
const pharmContractItems = ref([]);
const cancelContractItems = ref([]);
const licenseContractItems = ref([]);

const isShowUploadModal = ref(false);
const isShowUploadModal2 = ref(false);
const isShowUploadModal3 = ref(false);
const isShowUploadModal4 = ref(false);
const fileInfo = ref([]);

const pcItems = ref([]); //등록된 PC 정보 (QR리딩)
const loginInfoItems = ref([]); //로그인 PC 정보 (약국라이선스)
const qrHistoryItems = ref([]); //QR 상품 갱신 내역

// QR 갱신 Modal
const startYmd = ref('');
const expYmd = ref('');
const prodId = ref('');
const prodIdOptions = ref([]);
const isShowUpdateRenewModal = ref(false);

// Amt 갱신 Modal
const amtStartYmd = ref('');
const amt = ref(0);
const isShowUpdateAmtModal = ref(false);

const createFields = computed(() => [
  {
    label1: '라이선스코드',
    value1: detailInfo.value.licenseCd || '',
    label2: '요양기관번호',
    value2: detailInfo.value.pharmNo || '',
  },
  {
    label1: '업체',
    value1: detailInfo.value.companyCdNm || '',
    label2: '영업 업체',
    value2: detailInfo.value.companyBusiCdNm || '',
  },
  {
    label1: '프로그램 현황 (검색 용도)',
    value1: detailInfo.value.programStatus || '',
    label2: '이지스팜요금',
    value2: detailInfo.value.programAmt || '',
  },
  {
    label1: '사업자등록번호',
    value1: detailInfo.value.pharmBsNo || '',
    label2: 'PC라이선스 제한수량',
    value2: detailInfo.value.pcCnt || '',
  },
  {
    label1: 'QR 상품',
    value1: detailInfo.value.prodNm || '',
    label2: 'CRM 상품',
    value2: detailInfo.value.crmNm || '',
  },
  {
    label1: '약국명',
    value1: detailInfo.value.pharmNm || '',
    label2: 'email',
    value2: detailInfo.value.email || '',
  },
  {
    label1: '주소',
    value1: detailInfo.value.addr || '',
    colspan: true,
  },
  {
    label1: '약국전화번호',
    value1: detailInfo.value.phoneNo || '',
    label2: '팩스번호',
    value2: detailInfo.value.faxNo || '',
  },
  {
    label1: '약국장명',
    value1: detailInfo.value.userNm || '',
    label2: '약국장 핸드폰 번호',
    value2: formatPhoneKR(detailInfo.value.userPhoneNo) || '',
  },
  {
    label1: '비고',
    value1: detailInfo.value.descMsg || '',
    colspan: true,
  },
  {
    label1: '상품갱신일',
    value1: detailInfo.value.applyYmd || '',
    label2: '최초등록일',
    value2: detailInfo.value.firstRegDt?.substring(0, 10) || '',
  },
  {
    label1: '만료일',
    value1: detailInfo.value.expYmd || '',
    label2: '수정일',
    value2: detailInfo.value.modDt?.substring(0, 10) || '',
  },
]);

const COLUMNS = [
  { key: 'no', label: '순번', width: '4%' },
  { key: 'applyYmd', label: '사용시작일', width: '5%' },
  { key: 'expYmd', label: '만료일', width: '5%' },
  { key: 'prodNm', label: '상품명', width: '10%', align: 'left' },
  { key: 'prodAmt', label: '상품가격', width: '5%', align: 'right' },
  { key: 'delete', label: '', width: '5%' },
];

const COLUMNS3 = [
  { key: 'no', label: '순번', width: '4%' },
  { key: 'applyYmd', label: '사용시작일', width: '10%' },
  { key: 'programAmt', label: '이용요금', width: '10%', align: 'right' },
  { key: 'delete', label: '', width: '10%' },
];

const COLUMNS4 = [
  { key: 'no', label: '순번', width: '2%' },
  { key: 'oriFileName', label: '파일명', width: '20%', align: 'left' },
  { key: 'regDt', label: '등록일', width: '5%' },
  { key: 'fileUri', label: '파일', width: '5%' },
];

const COLUMNS5 = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'pcMac', label: 'Mac주소', width: '10%' },
  { key: 'certiNo', label: '인증코드', width: '10%' },
  { key: 'descMsg', label: '비고', width: '20%' },
  { key: 'regDt', label: '등록일', width: '10%' },
  { key: 'modDt', label: '수정일', width: '10%' },
  { key: 'useYn', label: '사용여부', width: '5%' },
];

const COLUMNS6 = [
  { key: 'no', label: '순번', width: '4%' },
  { key: 'pcMac', label: 'Mac주소', width: '10%' },
  { key: 'ip', label: 'IP', width: '10%' },
  { key: 'regDt', label: '날짜', width: '10%' },
  { key: 'cnt', label: '라이선스 초과횟수', width: '10%', align: 'right' },
];

const COLUMNS7 = [
  { key: 'no', label: '순번', width: '4%' },
  { key: 'prodNm', label: 'QR상품', width: '10%', align: 'left' },
  { key: 'applyYmd', label: '날짜', width: '5%' },
];

// 상세정보 조회
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
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 뒤로
const goBackToList = () => {
  router.push({ name: ROUTE.Pharm.PharmCustomer.List, query: route.query });
};

// 수정
const goModify = () => {
  router.push({
    name: ROUTE.Pharm.PharmCustomer.Modify,
    query: { ...route.query, licenseCd: licenseCd.value, applyYmd: applyYmd.value },
  });
};

// QR 상품갱신예정정보
const fetchRenewItems = async () => {
  try {
    const renewRes = await PharmAPI.getRenewList(licenseCd.value);
    if (!renewRes.ok)
      return toastApi.errorFromResult(renewRes);

    let renewList = renewRes.data?.resultData?.list ?? [];
    renewItems.value = renewList.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 이지스팜 상품갱신예정정보
const fetchAmtItems = async () => {
  try {
    const res = await PharmAPI.getAmtList(licenseCd.value);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    let list = res.data?.resultData?.list ?? [];
    amtItems.value = list.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 갱신예정정보 삭제
const deleteRow = async (type, applyYmd) => {
  const ok = await modal.show({
    title: '삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '삭제',
  });
  if (!ok)
    return;

  const actionMap = {
    renew: { api: PharmAPI.deleteLicense, fetch: fetchRenewItems },
    amt: { api: PharmAPI.deleteAmt, fetch: fetchAmtItems },
  };

  const action = actionMap[type];
  if (!action) {
    return;
  }

  try {
    isDeleting.value = true;

    const params = {
      licenseCd: licenseCd.value,
      applyYmd: normalizeYmd(applyYmd),
    };

    const res = await action.api(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('삭제되었습니다.');
    await action.fetch();
  } catch (error) {
    toastApi.errorFromException(error);
  } finally {
    isDeleting.value = false;
  }
};

// 계약서 리스트
const fetchFileItems = async (fileType, targetRef) => {
  try {
    const params = {
      licenseCd: detailInfo.value.licenseCd,
      fileType,
    };

    const res = await PharmAPI.getFileList(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    let list = res.data?.resultData?.list ?? [];
    targetRef.value = list.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const handlePdfOpenConfirm = (pdfUrl, pdfTitle) => {
  handleFile(pdfUrl, {
    fileName: `${pdfTitle}.pdf`,
    confirmTitle: '계약서',
    confirmMessage: `${pdfTitle} 파일을 여시겠습니까?`,
  });
};

const handleUpload = async (pdfTitle, FileType) => {
  if (!fileInfo.value[0])
    return toast.error(`${pdfTitle}를 첨부해주세요.`);

  let formData = new FormData();
  formData.append('LicenseCd', detailInfo.value.licenseCd);
  formData.append('FileType', FileType);
  formData.append('upload', fileInfo.value[0]);
  logFormData(formData);

  const fileTypeActions = {
    '110001': { modal: isShowUploadModal, items: QRContractItems },      // 이지스 QR 계약서
    '110002': { modal: isShowUploadModal2, items: pharmContractItems },  // 이지스팜 계약서
    '110003': { modal: isShowUploadModal3, items: cancelContractItems }, // 해지 계약서
    '110004': { modal: isShowUploadModal4, items: licenseContractItems }, // 사업자등록증
  };

  try {
    const res = await PharmAPI.postFileInfo(formData);
    if (!res.ok) return toastApi.errorFromException(res);

    const action = fileTypeActions[FileType];

    if (action) {
      action.modal.value = false;
      fetchFileItems(FileType, action.items);
    }
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 등록된 PC 정보 (QR리딩)
const fetchPcItems = async () => {
  try {
    const params = {
      licenseCd: licenseCd.value,
      Keyword: '',
      PageNum: 1,
      PageSize: 15,
    };

    const res = await PharmAPI.getPcList(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    let list = res.data?.resultData?.list ?? [];
    pcItems.value = list.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// 로그인 PC정보 (약국라이선스)
const fetchLoginInfoItems = async () => {
  try {
    const res = await PharmAPI.getLoginInfo(licenseCd.value);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    let list = res.data?.resultData?.list ?? [];
    loginInfoItems.value = list.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// QR 상품 갱신 내역
const fetchQrHistoryItems = async () => {
  try {
    const res = await PharmAPI.getQRHistoryList(licenseCd.value);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    let list = res.data?.resultData?.list ?? [];
    qrHistoryItems.value = list.map((item, index) => ({ ...item, no: index + 1 }));
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

//상품선택 - QR
const fetchSearchOptions = async () => {
  try {
    const prodIdRes = await PharmAPI.getProdListNoPaging('020001');
    if (!prodIdRes.ok) {
      toastApi.errorFromResult(prodIdRes);
    }
    const prodIdList = prodIdRes.data?.resultData?.list ?? [];
    prodIdOptions.value = [{ prodId: '', prodNm: '선택' }, ...prodIdList];
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

// QR 상품 갱신
const onClickOpenRenewModal = () => {
  if (renewItems.value.length > 0) {
    toast.error('QR 갱신 정보가 이미 있습니다.\nQR 갱신 예정 정보는 하나만 등록할 수 있습니다.');
    return;
  }

  isShowUpdateRenewModal.value = true;
};

const onUpdateRenew = async () => {
  if (formatYmd(startYmd.value) === '')
    return toast.error('사용 시작일을 입력해주세요.');

  if (prodId.value === '')
    return toast.error('상품을 선택해주세요.');

  if (formatYmd(startYmd.value) < getTodayYmd())
    return toast.error('갱신 예정일은 오늘 이후의 날짜로 입력해주세요.');

  const confirm = await modal.show({
    title: '저장',
    message: '저장 하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm)
    return;

  try {
    const formData = new FormData();
    formData.append('LicenseCd', licenseCd.value ?? '');
    formData.append('ApplyYmd', toYmdCompact(startYmd.value) ?? '');
    formData.append('ExpYmd', toYmdCompact(expYmd.value) ?? '');
    formData.append('ProdId', prodId.value ?? '');
    logFormData(formData);

    const res = await PharmAPI.putLicenseRenew(formData);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    fetchRenewItems();
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isShowUpdateRenewModal.value = false;
  }
};

// 이지스팜 상품 갱신
const onClickOpenAmtModal = async () => {
  if (amtItems.value.length > 0) {
    toast.error('이지스팜 이용 요금 정보가 이미 있습니다. 이용요금 갱신 예정 정보는 하나만 등록할 수 있습니다.');
    return;
  }

  isShowUpdateAmtModal.value = true;
};

const onUpdateAmt = async () => {
  if (amtStartYmd.value === '')
    return toast.error('사용 시작일을 입력해주세요.');

  if (amt.value === '')
    return toast.error('요금을 입력 해주세요.');

  if (formatYmd(`${amtStartYmd.value}-01`) < getTodayYmd())
    return toast.error('갱신 예정일은 오늘 이후의 날짜로 입력해주세요.');

  try {
    const formData = new FormData();
    formData.append('LicenseCd', licenseCd.value ?? '');
    formData.append('ProgramAmt', amt.value ?? '');
    formData.append('ApplyYmd', normalizeYmd(`${amtStartYmd.value}-01`) ?? '');
    logFormData(formData);

    const res = await PharmAPI.putLicenseAmt(formData);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    fetchAmtItems();
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isShowUpdateAmtModal.value = false;
  }
};

// 사용여부 변경
const changeUserYn = async (pcMac, state) => {
  const stateLabels = {
    Y: '미사용',
    N: '사용중',
  };

  const newState = state === 'Y' ? 'N' : 'Y';
  const stateNm = stateLabels[state];

  if (!stateNm) {
    toast.error('알 수 없는 변경 타입입니다.');
    return;
  }

  const confirmed = await modal.show({
    title: '사용여부 변경',
    message: `${stateNm}으로 변경하시겠습니까?`,
    confirmText: '변경',
  });
  if (!confirmed)
    return;

  try {
    const formData = new FormData();
    formData.append('LicenseCd', licenseCd.value ?? '');
    formData.append('PcMac', pcMac ?? '');
    formData.append('UseYn', newState);
    logFormData(formData);

    const res = await PharmAPI.putPcUserYn(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('변경되었습니다.');
    fetchPcItems();
  } catch (error) {
    toastApi.errorFromException(error);
  }
};

// 맥클리어
const macClear = async (type) => {
  const confirm = await modal.show({
    title: 'MAC 초기화',
    message: 'MAC 초기화 하시겠습니까?',
    confirmText: 'MAC 초기화',
  });
  if (!confirm)
    return;

  try {
    const formData = new FormData();
    formData.append('LicenseCd', detailInfo.value.licenseCd ?? '');
    logFormData(formData);

    let res;

    if (type === 'qr') {
      res = await PharmAPI.putQRMacClear(formData);
    } else if (type === 'pc') {
      res = await PharmAPI.putLicenseMacClear(formData);
    }

    if (!res.ok)
      return toastApi.errorFromResult(res);

    if (res.data.resultData !== '0')
      toast.success('초기화되었습니다.');
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchDetail();
    fetchRenewItems();
    fetchFileItems('110001', QRContractItems);   // 이지스 QR 계약서
    fetchAmtItems();
    fetchFileItems('110002', pharmContractItems); // 이지스팜 계약서
    fetchFileItems('110003', cancelContractItems); // 해지 계약서
    fetchFileItems('110004', licenseContractItems); // 사업자등록증
    fetchPcItems();
    fetchLoginInfoItems();
    fetchQrHistoryItems();

    fetchSearchOptions();
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <!-- 상세정보 -->
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">상세정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="createFields" />
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="secondary" size="sm" @click="goBackToList">뒤로</CButton>
      <CButton color="warning" size="sm" @click="goModify">수정</CButton>
    </CCardFooter>
  </CCard>

  <!-- QR 상품 -->
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">QR 상품</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <CRow>
        <!-- 갱신예정정보 -->
        <CCol sm="6" style="border-right:1px solid #ddd;">
          <h6 class="mb-3">갱신예정정보</h6>
          <UiDataTable :loading="isLoading" :columns="COLUMNS" :items="renewItems">
            <template #cell-prodAmt="{ item }">
              {{ formatMoney(item.prodAmt) }}
            </template>

            <template #cell-delete="{ item }">
              <CButton color="danger" size="sm" @click="deleteRow('renew', item.applyYmd)">
                삭제
              </CButton>
            </template>
          </UiDataTable>
        </CCol>

        <!-- 계약서 -->
        <CCol sm="6">
          <h6 class="mb-3">계약서</h6>
          <UiDataTable :loading="isLoading" :columns="COLUMNS4" :items="QRContractItems">
            <!-- 파일 -->
            <template #cell-fileUri="{ item }">
              <CButton color="success" size="sm" @click="handlePdfOpenConfirm(item.fileUri, '이지스 QR 계약서')">
                <CIcon name="cil-file" />
              </CButton>
            </template>
          </UiDataTable>
        </CCol>
      </CRow>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="primary" size="sm" @click="onClickOpenRenewModal">갱신</CButton>
      <CButton variant="primary" size="sm" @click="() => (isShowUploadModal = true)">업로드</CButton>
    </CCardFooter>
  </CCard>

  <!-- 이지스팜 상품 -->
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">이지스팜 상품</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <CRow>
        <!-- 갱신예정정보 -->
        <CCol sm="6" style="border-right:1px solid #ddd;">
          <h6 class="mb-3">갱신예정정보</h6>
          <UiDataTable :loading="isLoading" :columns="COLUMNS3" :items="amtItems">
            <!-- 사용시작일 -->
            <template #cell-applyYmd="{ item }">
              {{ formatYmd(item.applyYmd) }}
            </template>

            <!-- 이용요금 -->
            <template #cell-programAmt="{ item }">
              {{ formatMoney(item.programAmt) }}
            </template>

            <template #cell-delete="{ item }">
              <CButton color="danger" size="sm" @click="deleteRow('amt', item.applyYmd)">
                삭제
              </CButton>
            </template>
          </UiDataTable>
        </CCol>

        <!-- 계약서 -->
        <CCol sm="6">
          <h6 class="mb-3">계약서</h6>
          <UiDataTable :loading="isLoading" :columns="COLUMNS4" :items="pharmContractItems">
            <!-- 파일 -->
            <template #cell-fileUri="{ item }">
              <CButton color="success" size="sm" @click="handlePdfOpenConfirm(item.fileUri, '이지스 팜 계약서')">
                <CIcon name="cil-file" />
              </CButton>
            </template>
          </UiDataTable>
        </CCol>
      </CRow>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="primary" size="sm" @click="onClickOpenAmtModal()">갱신</CButton>
      <CButton variant="primary" size="sm" @click="() => (isShowUploadModal2 = true)">업로드</CButton>
    </CCardFooter>
  </CCard>

  <CRow>
    <!-- 해지 계약서 -->
    <CCol sm="6">
      <CCard class="mb-3">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <h6 class="mb-0">해지 계약서</h6>
        </CCardHeader>
        <CCardBody>
          <div class="loading" v-if="isLoading">
            <UiLoading />
          </div>
          <UiDataTable :loading="isLoading" :columns="COLUMNS4" :items="cancelContractItems">
            <!-- 파일 -->
            <template #cell-fileUri="{ item }">
              <CButton color="success" size="sm" @click="handlePdfOpenConfirm(item.fileUri, '해지 계약서')">
                <CIcon name="cil-file" />
              </CButton>
            </template>
          </UiDataTable>
        </CCardBody>
        <CCardFooter class="d-flex justify-content-end gap-1">
          <CButton variant="primary" size="sm" @click="() => (isShowUploadModal3 = true)">업로드</CButton>
        </CCardFooter>
      </CCard>
    </CCol>

    <!-- 사업자등록증 -->
    <CCol sm="6">
      <CCard class="mb-3">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <h6 class="mb-0">사업자등록증</h6>
        </CCardHeader>
        <CCardBody>
          <div class="loading" v-if="isLoading">
            <UiLoading />
          </div>
          <UiDataTable :loading="isLoading" :columns="COLUMNS4" :items="licenseContractItems">
            <!-- 파일 -->
            <template #cell-fileUri="{ item }">
              <CButton color="success" size="sm" @click="handlePdfOpenConfirm(item.fileUri, '사업자등록증')">
                <CIcon name="cil-file" />
              </CButton>
            </template>
          </UiDataTable>
        </CCardBody>
        <CCardFooter class="d-flex justify-content-end gap-1">
          <CButton variant="primary" size="sm" @click="() => (isShowUploadModal4 = true)">업로드</CButton>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>

  <!-- 등록된 PC 정보 (QR리딩) -->
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">등록된 PC 정보 (QR리딩)</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS5" :items="pcItems">
        <!-- 사용여부 -->
        <template #cell-useYn="{ item }">
          <CButton v-if="item.useYn === 'Y'" color="success" size="sm" @click="changeUserYn(item.pcMac, 'Y')">사용중
          </CButton>
          <CButton v-else color="secondary" size="sm" @click="changeUserYn(item.pcMac, 'N')">미사용</CButton>
        </template>
      </UiDataTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton variant="secondary" size="sm" @click="macClear('qr')">MAC 초기화</CButton>
    </CCardFooter>
  </CCard>

  <!-- 로그인 PC 정보 (약국라이선스) -->
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">로그인 PC 정보 (약국라이선스)</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS6" :items="loginInfoItems" />
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton variant="secondary" size="sm" @click="macClear('pc')">MAC 초기화</CButton>
    </CCardFooter>
  </CCard>

  <!-- QR 상품 갱신 내역 -->
  <CCard class="mb-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">QR 상품 갱신 내역</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiDataTable :loading="isLoading" :columns="COLUMNS7" :items="qrHistoryItems">
        <!-- 사용여부 -->
        <template #cell-applyYmd="{ item }">
          {{ formatYmd(item.applyYmd) }}
        </template>
      </UiDataTable>
    </CCardBody>
  </CCard>

  <!-- 갱신-QR -->
  <UiModal
    v-model:visible="isShowUpdateRenewModal"
    title="상품갱신"
    confirmText="저장"
    @confirm="onUpdateRenew"
  >
    <template #body>
      <div class="d-flex flex-column gap-3">
        <CCol>
          <CFormLabel>사용시작일</CFormLabel>
          <Datepicker v-model="startYmd" v-bind="datepickerFixed" locale="ko"
                      :ui="{ input: 'form-control form-control-sm' }" />
        </CCol>
        <CCol>
          <CFormLabel>만료일</CFormLabel>
          <Datepicker v-model="expYmd" v-bind="datepickerFixed" locale="ko"
                      :ui="{ input: 'form-control form-control-sm' }" />
        </CCol>
        <CCol>
          <CFormLabel>상품선택</CFormLabel>
          <CFormSelect v-model="prodId" size="sm">
            <option v-for="opt in prodIdOptions" :key="opt.prodId" :value="opt.prodId">
              {{ opt.prodNm }}
            </option>
          </CFormSelect>
        </CCol>
      </div>
    </template>
  </UiModal>

  <!-- 갱신-이용요금 -->
  <UiModal
    v-model:visible="isShowUpdateAmtModal"
    title="프로그램 이용 요금 갱신"
    confirmText="저장"
    @confirm="onUpdateAmt"
  >
    <template #body>
      <div class="d-flex flex-column gap-3">
        <CCol>
          <CFormLabel>사용시작일</CFormLabel>
          <Datepicker
            v-model="amtStartYmd"
            v-bind="datepickerFixed"
            format="yyyy-MM"
            model-type="yyyy-MM"
            locale="ko"
            style="width: 140px"
            month-picker
            :clearable="false"
            :ui="{ input: 'form-control form-control-sm' }"
          />
        </CCol>
        <CCol>
          <CFormLabel>이용요금</CFormLabel>
          <CFormInput v-model="amt" type="number" />
        </CCol>
      </div>
    </template>
  </UiModal>

  <!-- 파일 업로드 모달 -->
  <UiModal
    v-model:visible="isShowUploadModal"
    title="이지스 QR 계약서"
    @confirm="handleUpload('이지스 QR 계약서', '110001')"
  >
    <template #body>
      <UiAttachments v-model="fileInfo" :accept="['image/*']" :max-count="1" helper-text="" />
    </template>
  </UiModal>
  <UiModal
    v-model:visible="isShowUploadModal2"
    title="이지스 팜 계약서"
    @confirm="handleUpload('이지스 팜 계약서', '110002')"
  >
    <template #body>
      <UiAttachments v-model="fileInfo" :accept="['image/*']" :max-count="1" helper-text="" />
    </template>
  </UiModal>
  <UiModal
    v-model:visible="isShowUploadModal3"
    title="해지 계약서"
    @confirm="handleUpload('해지 계약서', '110003')"
  >
    <template #body>
      <UiAttachments v-model="fileInfo" :accept="['image/*']" :max-count="1" helper-text="" />
    </template>
  </UiModal>
  <UiModal
    v-model:visible="isShowUploadModal4"
    title="사업자등록증"
    @confirm="handleUpload('사업자등록증', '110004')"
  >
    <template #body>
      <UiAttachments v-model="fileInfo" :max-count="1" helper-text="" />
    </template>
  </UiModal>
</template>
