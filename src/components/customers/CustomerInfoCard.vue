<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { CommonAPI } from '@/api/temp/common';
import { HospApi } from '@/api/temp/hosp';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import { datepickerFixed, formatYmd, logFormData } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiModal from '@/components/ui/UiModal.vue';
import UiAttachments from '@/components/ui/UiAttachments.vue';
import { useFileActions } from '@/composables/useFileActions';
import UiLoading from '@/components/ui/UiLoading.vue';

// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const modal = useConfirmModal();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
const { handleFile } = useFileActions();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const customerInfo = ref({});
const isLoading = ref(false); // 상세 본문용 로딩 (스피너)
const isCustomerInfoModify = ref(false); // 수정모드
const isShowUploadModal = ref(false); // 사업자 등록증 모달
const fileInfo = ref([]);
const deptOptions = ref([]);
const nixVersioniOptions = ref([]);
const sidoOptions = ref([]);
const sigunOptions = ref([{ codeId: '', codeNm: '선택' }]);

// 고객정보 필드
const customerInfoFields = computed(() => [
  {
    label1: '라이선스 코드',
    value1: customerInfo.value.licenseCd || '-',
    label2: '이지스 차트버전',
    value2:
      customerInfo.value.eghis2InstYmd !== null && customerInfo.value.eghis2InstYmd !== ''
        ? `2.0 [설치일 ${formatYmd(customerInfo.value.eghis2InstYmd)}]`
        : '1.0',
  },
  {
    label1: '상호명',
    key1: 'hospNm',
    label2: '원장명',
    key2: 'mainDoctorNm',
  },
  {
    label1: '사업자번호',
    key1: 'businessNo',
    label2: '고객구분',
    value2: customerInfo.value.hospGbNm || '-',
  },
  {
    label1: '사업자등록증',
    key1: 'oriFileName',
    label2: '챠트버전',
    key2: 'chartVersionType',
    isShow2: storeMenuType.value === 'N',
  },
  {
    label1: '요양기관번호',
    value1: customerInfo.value.hospCd || '-',
    label2: '대표번호',
    key2: 'hospTel',
  },
  {
    label1: '세금 이메일',
    key1: 'taxEmail',
    label2: 'FAX',
    key2: 'faxNo',
  },
  {
    label1: '대표진료과',
    key1: 'deptNm',
    label2: '핸드폰번호',
    key2: 'doctTel',
  },
  {
    label1: '업태구분',
    value1: customerInfo.value.cond1 || '-',
    label2: '주민번호(6자리)',
    key2: 'taxPrsnNo',
  },
  {
    label1: '계약/유지보수',
    key: 'setupYmd',
    colspan: true,
  },
  {
    label1: storeMenuType.value !== 'N' ? '개원예정월/오픈일' : '오픈일',
    key: 'openYmd',
    colspan: true,
  },
  {
    label1: '개원지역',
    key: 'sidoNm',
    colspan: true,
  },
  {
    label1: '주소',
    key: 'hospAddr1',
    colspan: true,
  },
  {
    label1: 'CRM 발신번호',
    value1: customerInfo.value.smsTelno || '-',
    colspan: true,
  },
  {
    label1: '서버IP',
    key1: 'serverIp',
    label2: '메신저IP',
    key2: 'messengerIp',
  },
  {
    label1: '펜차트 에이전트 IP',
    key1: 'penAgentInfo',
    label2: '펜차트 WIFI 이름',
    key2: 'penWifiInfo',
  },
]);

// ----------------------
//  ✨ methods / functions/
// ----------------------
// 옵션 정보
const fetchOptions = async () => {
  try {
    // 진료과목
    const deptRes = await CommonAPI.getPmMstKey1({
      path: 'A0002',
      menuType: storeMenuType.value,
    });
    if (!deptRes.ok) return toastApi.errorFromResult(deptRes);
    deptOptions.value = [{ codeId: '', codeNm: '선택' }, ...deptRes.data?.resultData?.list];

    // 닉스차트버전
    const nixVersionRes = await CommonAPI.getCode('A44');
    if (!nixVersionRes.ok) return toastApi.errorFromResult(nixVersionRes);
    nixVersioniOptions.value = nixVersionRes.data?.resultData?.list ?? [];

    // 지역시도
    const sidoRes = await CommonAPI.getAreaManagerSido();
    if (!sidoRes.ok) return toastApi.errorFromResult(sidoRes);
    sidoOptions.value = sidoRes.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 지역시군 옵션
const fetchSigunOptions = async () => {
  try {
    const sigunRes = await CommonAPI.getAreaManagerSigun({
      sidoCd: customerInfo.value.sidoCd,
    });
    if (!sigunRes.ok) return toastApi.errorFromResult(sigunRes);
    sigunOptions.value = [...sigunOptions.value, ...(sigunRes.data?.resultData?.list ?? [])];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const fetchCustomerInfo = async () => {
  isLoading.value = true;
  if (!storeLicenseCd.value) return toast.error('라이센스 정보가 없습니다.');
  try {
    const res = await HospApi.getCustomerInfo({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    customerInfo.value = res.data?.resultData;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const uploadFile = async () => {
  let formData = new FormData();
  formData.append('LicenseCd', storeLicenseCd.value);
  formData.append('FileType', 'A1901');
  formData.append('upload', fileInfo.value[0]);
  formData.append('MenuType', storeMenuType.value);
  logFormData(formData);
  try {
    const res = await HospApi.postCompanyFile(formData);
    if (!res.ok) return toastApi.errorFromException(res);
    isShowUploadModal.value = false;
    fileInfo.value = [];
    await fetchCustomerInfo();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const deleteFile = async () => {
  if (fileInfo.value[0]) return;
  try {
    const res = await HospApi.deleteCompanyFile({
      license: storeLicenseCd.value,
      seq: customerInfo.value.seq,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

const handleUpload = async () => {
  if (!fileInfo.value[0]) return toast.error('사업자등록증을 첨부해주세요.');
  await deleteFile();
  await uploadFile();
};

const handleDownload = async () => {
  try {
    const res = await HospApi.getCompanyFile({
      seq: customerInfo.value.seq,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    await handleFile(res.data, {
      fileName: customerInfo.value.oriFileName,
      confirmTitle: '사업자등록증',
      confirmMessage: '다운로드 하시겠습니까?',
      download: true,
    });
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 지역 시도 변경 시
watch(
  () => customerInfo.value.sidoCd,
  () => {
    fetchSigunOptions();
  },
);

onMounted(() => {
  fetchOptions();
  fetchCustomerInfo();
});
</script>

<template>
  <CCard>
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>고객정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <UiGridTable :fields="customerInfoFields">
        <template #value-hospNm>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.hospNm" size="sm" />
          </template>
          <template v-else>{{ customerInfo.hospNm }}</template>
        </template>
        <template #value-mainDoctorNm>
          <template v-if="isCustomerInfoModify && storeMenuType === 'N'">
            <CFormInput v-model="customerInfo.mainDoctorNm" size="sm" maxlength="8" />
          </template>
          <template v-else>{{ customerInfo.mainDoctorNm }}</template>
        </template>
        <template #value-businessNo>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.businessNo" size="sm" />
          </template>
          <template v-else>{{ customerInfo.businessNo || '-' }}</template>
        </template>
        <template #value-oriFileName>
          <div class="d-flex gap-1">
            <CButton
              v-if="customerInfo.oriFileName"
              color="success"
              size="sm"
              @click="handleDownload"
            >
              {{ customerInfo.oriFileName }}
            </CButton>
            <CButton variant="outline" size="sm" @click="() => (isShowUploadModal = true)"
              >업로드</CButton
            >
          </div>
        </template>
        <template #value-chartVersionType>
          <template v-if="isCustomerInfoModify">
            <CFormSelect v-model="customerInfo.chartVersionTypeNm" size="sm">
              <option v-for="opt in nixVersioniOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
          </template>
          <template v-else>{{ customerInfo.chartVersionTypeNm || '-' }}}</template>
        </template>
        <template #value-hospTel>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.hospTel" size="sm" />
          </template>
          <template v-else>
            <a :href="`tel:${customerInfo.hospTel}`">{{ customerInfo.hospTel }}</a>
          </template>
        </template>
        <template #value-taxEmail>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.taxEmail" size="sm" />
          </template>
          <template v-else>{{ customerInfo.taxEmail }}</template>
        </template>
        <template #value-faxNo>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.faxNo" size="sm" />
          </template>
          <template v-else>{{ customerInfo.faxNo || '-' }}</template>
        </template>
        <template #value-deptNm>
          <template v-if="isCustomerInfoModify">
            <CFormSelect v-model="customerInfo.deptNm" size="sm">
              <option v-for="opt in deptOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
          </template>
          <template v-else>{{ customerInfo.deptNm || '-' }}</template>
        </template>
        <template #value-doctTel>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.doctTel" size="sm" />
          </template>

          <template v-else
            ><a :href="`tel:${customerInfo.doctTel}`">{{ customerInfo.doctTel }}</a></template
          >
        </template>
        <template #value-taxPrsnNo>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.taxPrsnNo" size="sm" />
          </template>
          <template v-else>{{ customerInfo.taxPrsnNo || '-' }}</template>
        </template>
        <template #value-setupYmd>
          <template v-if="isCustomerInfoModify">
            <div class="d-flex gap-1">
              <Datepicker
                v-model="customerInfo.setupYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
              <Datepicker
                v-model="customerInfo.startYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
            </div>
          </template>
          <template v-else>{{ customerInfo.setupYmd }} / {{ customerInfo.startYmd }}</template>
        </template>
        <template #value-openYmd>
          <template v-if="isCustomerInfoModify && storeMenuType === 'N'">
            <Datepicker
              v-model="customerInfo.openYmd"
              v-bind="datepickerFixed"
              locale="ko"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </template>
          <template v-else>
            <template v-if="customerInfo.meetYmd">
              {{ customerInfo.meetYmd.substring(0, 4) }}-{{ customerInfo.meetYmd.substring(4, 6) }}
              /
            </template>
            {{ customerInfo.openYmd }}
          </template>
        </template>
        <template #value-sidoNm>
          <template v-if="isCustomerInfoModify">
            <div class="d-flex gap-1">
              <CFormSelect v-model="customerInfo.sidoCd" size="sm">
                <option v-for="opt in sidoOptions" :key="opt.codeId" :value="opt.codeId">
                  {{ opt.codeNm }}
                </option>
              </CFormSelect>
              <CFormSelect v-model="customerInfo.sigunCd" size="sm">
                <option v-for="opt in sigunOptions" :key="opt.codeId" :value="opt.codeId">
                  {{ opt.codeNm }}
                </option>
              </CFormSelect>
            </div>
          </template>
          <template v-else>{{ customerInfo.sidoNm }} {{ customerInfo.sigunNm }}</template>
        </template>
        <template #value-hospAddr1>
          <template v-if="isCustomerInfoModify">
            <div class="d-flex gap-1">
              <CFormInput
                v-model="customerInfo.hospAddr1"
                size="sm"
                placeholder="주소 입력"
                maxlength="50"
              />
              <CFormInput
                v-model="customerInfo.hospAddr2"
                size="sm"
                placeholder="상세 주소 입력"
                maxlength="50"
              />
            </div>
          </template>
          <template v-else>
            {{ customerInfo.hospAddr1 || '-' }} &nbsp;&nbsp;{{ customerInfo.hospAddr2 || '' }}
          </template>
        </template>
        <template #value-serverIp>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.serverIp" size="sm" maxlength="15" />
          </template>
          <template v-else>{{ customerInfo.serverIp || '-' }}</template>
        </template>
        <template #value-messengerIp>
          <template v-if="isCustomerInfoModify">
            <CFormInput v-model="customerInfo.messengerIp" size="sm" maxlength="15" />
          </template>
          <template v-else>{{ customerInfo.messengerIp || '-' }}</template>
        </template>
        <template #value-penAgentInfo>
          <template v-if="isCustomerInfoModify">
            <CFormTextarea v-model="customerInfo.penAgentInfo" size="sm" maxlength="15" />
          </template>
          <template v-else>{{ customerInfo.penAgentInfo || '-' }}</template>
        </template>
        <template #value-penWifiInfo>
          <template v-if="isCustomerInfoModify">
            <CFormTextarea v-model="customerInfo.penWifiInfo" size="sm" maxlength="15" />
          </template>
          <template v-else>{{ customerInfo.penWifiInfo || '-' }}</template>
        </template>
      </UiGridTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="secondary" size="sm">2.0 신청</CButton>
      <CButton color="danger" size="sm">해지</CButton>
      <template v-if="!isCustomerInfoModify">
        <CButton color="warning" size="sm" @click="() => (isCustomerInfoModify = true)"
          >수정</CButton
        >
      </template>
      <template v-else>
        <CButton color="danger" size="sm" @click="() => (isCustomerInfoModify = false)">
          취소
        </CButton>
        <CButton color="primary" size="sm">저장</CButton>
      </template>
    </CCardFooter>
  </CCard>
  <UiModal
    v-model:visible="isShowUploadModal"
    title="사업자 등록증 변경"
    @cancel="() => console.log('cancel')"
    @confirm="handleUpload"
  >
    <template #body>
      <UiAttachments v-model="fileInfo" :accept="['image/*']" :max-count="1" helper-text="" />
    </template>
  </UiModal>
</template>

<style scoped></style>
