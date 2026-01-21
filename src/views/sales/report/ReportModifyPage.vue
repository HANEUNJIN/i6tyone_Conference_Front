<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBaseStore } from '@/stores/base';
import { useAuthStore } from '@/stores/auth';
import { SalesAPI } from '@/api/temp/sales';
import { CommonAPI } from '@/api/temp/common';
import { datepickerFixed, isValidateEmpty } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import useContacts from '@/composables/useContacts';
import { ROUTE } from '@/constants/routeName';

const props = defineProps({
  seq: { type: String, required: true }, // 라우터 props에서 전달됨
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

const auth = useAuthStore();
const base = useBaseStore();
const detailInfo = ref({}); // 상세 정보
const isLoading = ref(false); // 상세 본문용 로딩 (스피너)
const isSubmitting = ref(false); //중복 제출 방지용

const inRouteOptions = ref([]); // 유입경로 옵션
const cTypeOptions = ref([]); // 연락처 옵션
const chartCustOptions = ref([]); // 기존차트업체 옵션
const deptOptions = ref([]); // 진료과목 옵션
const areaSidoOptions = ref([]); // 지역 시도 옵션
const areaSigunOptions = ref([]); // 지역 시군 옵션
const progressOptions = [
  { codeId: '01', codeNm: '영업중' },
  { codeId: '02', codeNm: '계약완료' },
  { codeId: '03', codeNm: '계약불발' },
  { codeId: '04', codeNm: '타대리점계약' },
  { codeId: '05', codeNm: '영업권상실' },
];
const chartInfoOptions = [
  { codeId: '01', codeNm: '신규' },
  { codeId: '02', codeNm: '컨버전' },
];

// 영업정보 필드
const salesInfoFields = computed(() => [
  {
    label1: '지사/담당자',
    value1: detailInfo.value.userNm || '',
    label2: '유입경로',
    key2: 'inRoute',
  },
  {
    label1: '연락처',
    key: 'cType',
    colspan: true,
  },
  {
    label1: '내용',
    key: 'memo',
    colspan: true,
  },
]);

// 병원 정보 필드
const hopsInfoFields = computed(() => [
  {
    label1: '진행상태',
    key1: 'progress',
    label2: '사업자번호',
    key2: 'businessNo',
    isShow2: detailInfo.value.progress === '02',
  },
  {
    label1: '오픈지역',
    key1: 'area',
    label2: '계약예정일',
    key2: 'startYmd',
  },
  {
    label1: '진료과목',
    key1: 'dept',
    label2: '요양기관명',
    key2: 'hospNm',
  },
  {
    label1: 'PC사용대수',
    key1: 'pcCnt',
    label2: '의사수',
    key2: 'doctorCnt',
  },
  {
    label1: '신규여부',
    key1: 'chartInfo',
    label2: '기존챠트업체',
    key2: 'chartCust',
    isShow2: detailInfo.value.chartInfo === '02',
  },
  {
    label1: '불발조건',
    key: 'failedSales',
    colspan: true,
    isShowRow: detailInfo.value.progress === '03',
  },
]);

// 옵션 정보
async function fetchOptions() {
  try {
    // 유입경로
    const routeRes = await CommonAPI.getCode('A06');
    if (!routeRes.ok) return toastApi.errorFromResult(routeRes);
    inRouteOptions.value = routeRes.data?.resultData?.list ?? [];
    //연락처 구분
    const cTypeRes = await CommonAPI.getCode('A07');
    if (!cTypeRes.ok) return toastApi.errorFromResult(cTypeRes);
    cTypeOptions.value = cTypeRes.data?.resultData?.list ?? [];
    // 기존차트업체
    const chartRes = await CommonAPI.getPmMstClinicCode('LiSPChart');
    if (!chartRes.ok) return toastApi.errorFromResult(chartRes);
    chartCustOptions.value = chartRes.data?.resultData?.list ?? [];
    // 진료과목
    const deptRes = await CommonAPI.getPmMstKey1({
      path: 'A0002',
      menuType: base.storeMenuType,
    });
    if (!deptRes.ok) return toastApi.errorFromResult(deptRes);
    deptOptions.value = deptRes.data?.resultData?.list ?? [];
    // 지역 시도
    const areaSidoRes = await CommonAPI.getAreaCode({
      searchType: 'D',
      areaCode: '',
    });
    if (!areaSidoRes.ok) return toastApi.errorFromResult(areaSidoRes);
    areaSidoOptions.value = areaSidoRes.data?.resultData?.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 상세 정보
async function fetchDetail() {
  if (!props.seq) return;
  isLoading.value = true;
  const params = {
    seq: props.seq,
    menuType: base.storeMenuType,
  };
  try {
    const res = await SalesAPI.getDetail(params);
    if (!res.ok) return toastApi.errorFromResult(res);
    detailInfo.value = res.data?.resultData ?? {};

    const contacts = [];
    for (let i = 1; i < 4; i++) {
      const idx = i === 1 ? '' : String(i);
      const cType = detailInfo.value[`cType${idx}`];
      const cNm = detailInfo.value[`cNm${idx}`];
      const cPhoneNo = detailInfo.value[`cPhoneNo${idx}`];
      if (!cNm) {
        continue;
      }

      const item =
        i === 1
          ? { cType, cNm, cPhoneNo }
          : {
              [`cType${i}`]: cType,
              [`cNm${i}`]: cNm,
              [`cPhoneNo${i}`]: cPhoneNo,
            };
      contacts.push(item);
    }
    detailInfo.value.contacts = contacts;
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
}

// 연락처 추가
const {
  isDupiFlag,
  dupiList,
  contactsRefs,
  addCType,
  removeCType,
  isPhoneDuplicated,
  isPhoneEmpty,
  fetchDuplicatedCheck,
} = useContacts(detailInfo);

// 유효성 체크
function validateForm(f) {
  if (f.inRoute === 'A0606') {
    if (isValidateEmpty(f.inRouteEtc)) {
      return '유입경로를 입력해주세요.';
    }
  }
  if (f.progress === '02') {
    if (isValidateEmpty(f.businessNo)) {
      return '계약완료 사업자번호 7자리를 입력해주세요.';
    }
  }
  if (isPhoneDuplicated()) {
    return '전화번호가 중복되었습니다.';
  }
  if (isValidateEmpty(f.areaSigun)) {
    return '오픈 예정 지역을 시군까지 선택해주세요.';
  }
  if (isValidateEmpty(f.deptCd)) {
    return '진료과목을 선택해주세요.';
  }
  if (f.progress === '03') {
    if (isValidateEmpty(f.failedSales)) {
      return '불발 사유를 입력해주세요.';
    }
  }
  return '';
}

// 저장
async function handleSubmit() {
  if (isSubmitting.value) return;
  if (isPhoneEmpty()) {
    return;
  }
  const msg = validateForm(detailInfo.value);
  if (msg) return toast.error(msg);

  const confirm = await modal.show({
    title: '수정',
    message: '수정 하시겠습니까?',
    confirmText: '수정',
  });
  if (!confirm) return;

  const params = {
    UserId: auth.userInfo.userId,
    InRoute: detailInfo.value.inRoute,
    InRouteEtc: detailInfo.value.inRouteEtc,
    CType: detailInfo.value.contacts[0]?.cType,
    CNm: detailInfo.value.contacts[0]?.cNm,
    CPhoneNo: detailInfo.value.contacts[0]?.cPhoneNo,
    CType2: detailInfo.value.contacts[1]?.cType2,
    CNm2: detailInfo.value.contacts[1]?.cNm2,
    CPhoneNo2: detailInfo.value.contacts[1]?.cPhoneNo2,
    CType3: detailInfo.value.contacts[2]?.cType3,
    CNm3: detailInfo.value.contacts[2]?.cNm3,
    CPhoneNo3: detailInfo.value.contacts[2]?.cPhoneNo3,
    Memo: detailInfo.value.memo,
    Progress: detailInfo.value.progress,
    BusinessNo: detailInfo.value.businessNo,
    Area: detailInfo.value.areaSigun,
    StartYmd: detailInfo.value.startYmd,
    ChartCust: detailInfo.value.chartCust,
    ChartInfo: detailInfo.value.chartInfo,
    HospNm: detailInfo.value.hospNm,
    ChartEtc: detailInfo.value.chartEtc,
    FailedSales: detailInfo.value.failedSales,
    DeptCd: detailInfo.value.deptCd,
    DoctorCnt: detailInfo.value.doctorCnt,
    PcCnt: detailInfo.value.pcCnt,
    Agency: detailInfo.value.agency,
    Seq: props.seq,
  };
  try {
    isSubmitting.value = true;
    const res = await SalesAPI.putModify(params);
    if (!res.ok) return toastApi.errorFromResult(res);
    toast.success('수정되었습니다.');
    router.back();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isSubmitting.value = false;
  }
}

// 지역 시도 변경 시
watch(
  () => detailInfo.value.areaSido,
  async () => {
    try {
      // 지역 시군
      const areaSigunRes = await CommonAPI.getAreaCode({
        searchType: 'G',
        areaCode: detailInfo.value.areaSido || '',
      });
      if (!areaSigunRes.ok) return toastApi.errorFromResult(areaSigunRes);
      areaSigunOptions.value = [
        { codeId: '', codeNm: '선택' },
        ...(areaSigunRes.data?.resultData?.list ?? []),
      ];
    } catch (e) {
      console.error(e);
      toastApi.errorFromException(e);
    }
  },
  { deep: true },
);

// 보러가기 이동
function goDetail(seq) {
  router.push({
    name: ROUTE.Sales.Report.Detail,
    query: { ...route.query, seq: seq },
  });
}

onMounted(() => {
  fetchOptions();
  fetchDetail();
});
</script>
/ 010-5449-4857
<template>
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">영업정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="salesInfoFields">
        <template #value-inRoute>
          <div class="d-flex gap-2">
            <CFormSelect v-model="detailInfo.inRoute" size="sm">
              <option v-for="opt in inRouteOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <CFormInput
              v-model="detailInfo.inRouteEtc"
              size="sm"
              v-if="detailInfo.inRoute === 'A0606'"
            />
          </div>
        </template>
        <template #value-cType>
          <div v-for="(_, idx) in detailInfo.contacts" :key="idx" class="d-flex gap-2 mb-2">
            <CFormSelect v-model="contactsRefs[idx].cType" size="sm" style="width: auto">
              <option v-for="opt in cTypeOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <CFormInput
              v-model="contactsRefs[idx].cNm"
              size="sm"
              @keyup="fetchDuplicatedCheck"
              placeholder="이름"
            />
            <CFormInput
              v-model="contactsRefs[idx].cPhoneNo"
              size="sm"
              maxlength="11"
              placeholder="휴대폰( - 빼고입력)"
              style="min-width: 120px"
            />
            <CButton
              v-if="idx === 0"
              color="secondary"
              size="sm"
              @click="addCType(detailInfo.contacts.length + 1)"
              :disabled="detailInfo.contacts.length > 2"
              >추가</CButton
            >
            <CButton v-else color="danger" size="sm" @click="removeCType(idx)">삭제</CButton>
          </div>
          <template v-if="isDupiFlag">
            <hr />
            <p class="text-danger">중복된 데이터가 있습니다.</p>
            <CListGroup v-for="(item, idx) in dupiList" :key="idx">
              <CListGroupItem
                color="danger"
                class="d-flex justify-content-between align-items-center"
              >
                <p class="mb-0">
                  seq:{{ item.seq }} | 지사 : {{ item.branchNm }} | 영업게시일 : {{ item.regDt }} |
                  성명 : {{ item.cNm }} {{ item.cNm2 }} {{ item.cNm3 }} | 연락처:{{
                    item.cPhoneNo
                  }}
                  {{ item.cPhoneNo2 }} {{ item.cPhoneNo3 }}
                </p>
                <CButton color="success" size="sm" @click="goDetail(item.seqCry)">보러가기</CButton>
              </CListGroupItem>
            </CListGroup>
          </template>
        </template>
        <template #value-memo>
          <CFormTextarea v-model="detailInfo.memo" rows="3" />
        </template>
      </UiGridTable>
    </CCardBody>
  </CCard>
  <CCard class="mb-3">
    <CCardHeader>
      <h6 class="mb-0">병원정보</h6>
    </CCardHeader>
    <CCardBody>
      <div class="loading" v-if="isLoading">
        <UiLoading />
      </div>
      <UiGridTable :fields="hopsInfoFields">
        <template #value-progress>
          <CFormSelect v-model="detailInfo.progress" size="sm">
            <option v-for="opt in progressOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #value-businessNo>
          <CFormInput
            v-model="detailInfo.businessNo"
            size="sm"
            placeholder="계약완료시 사업자번호 필수"
          />
        </template>
        <template #value-area>
          <div class="d-flex gap-2">
            <CFormSelect
              v-model="detailInfo.areaSido"
              size="sm"
              @change="() => (detailInfo.areaSigun = '')"
            >
              <option v-for="opt in areaSidoOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
            <CFormSelect v-model="detailInfo.areaSigun" size="sm">
              <option v-for="opt in areaSigunOptions" :key="opt.codeId" :value="opt.codeId">
                {{ opt.codeNm }}
              </option>
            </CFormSelect>
          </div>
        </template>
        <template #value-startYmd>
          <Datepicker
            v-model="detailInfo.startYmd"
            v-bind="datepickerFixed"
            locale="ko"
            :ui="{ input: 'form-control form-control-sm' }"
          />
        </template>
        <template #value-dept>
          <CFormSelect v-model="detailInfo.dept" size="sm">
            <option v-for="opt in deptOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #value-hospNm>
          <CFormInput v-model="detailInfo.hospNm" size="sm" />
        </template>
        <template #value-pcCnt>
          <CFormInput v-model="detailInfo.pcCnt" size="sm" />
        </template>
        <template #value-doctorCnt>
          <CFormInput v-model="detailInfo.doctorCnt" size="sm" />
        </template>
        <template #value-chartInfo>
          <CFormSelect v-model="detailInfo.chartInfo" size="sm">
            <option v-for="opt in chartInfoOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #value-chartCust>
          <CFormSelect v-model="detailInfo.chartCust" size="sm">
            <option v-for="opt in chartCustOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #value-failedSales>
          <CFormTextarea v-model="detailInfo.failedSales" rows="3" />
        </template>
      </UiGridTable>
    </CCardBody>
  </CCard>
  <div class="d-flex justify-content-end gap-2">
    <CButton color="secondary" @click="() => router.back()">취소</CButton>
    <CButton color="primary" @click="handleSubmit">저장</CButton>
  </div>
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
