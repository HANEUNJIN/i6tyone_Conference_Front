<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import UiGridTable from '@/components/ui/UiGridTable.vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { formatYmd, logFormData, toYmdCompact } from '@/utils/common';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { GoodocAPI } from '@/api/goodoc';
import { ConferenceApi } from '@/api/conference';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

// ----------------------
// ✨ reactive state
// ----------------------
const uniqueId = computed(() => route.query.uniqueId || '');

const isLoading = ref(false);
const isSubmitting = ref(false);
const optionsLoading = ref(false);
const detailInfo = ref({});

const ticket = ref('0'); //티켓구분
const ticketOptions = ref([]);

const days = ref('0'); //신청일
const daysOptions = ref([]);

const area = ref(''); //좌석구분
const areaOptions = ref([]);

const gender = ref(''); //성별
const genderOptions = ref([
  { key: '', value: '성별선택' },
  { key: 'M', value: '남' },
  { key: 'F', value: '여' },
]);

const isEtc = ref('');

const denom = ref(''); //교단
const denomOptions = ref([
  { key: '교단선택', value: '교단선택' },
  { key: '예장합동', value: '예장합동' },
  { key: '예장통합', value: '예장통합' },
  { key: '예장고신', value: '예장고신' },
  { key: '예장백석', value: '예장백석' },
  { key: '예장합신', value: '예장합신' },
  { key: '예장대신', value: '예장대신' },
  { key: '예장개혁', value: '예장개혁' },
  { key: '기장', value: '기장' },
  { key: '기하성', value: '기하성' },
  { key: '감리교', value: '감리교' },
  { key: '침례교', value: '침례교' },
  { key: '성결교', value: '성결교' },
  { key: 'KAICAM', value: 'KAICAM' },
  { key: '기타', value: '기타' },
]);

const userInfoFields = computed(() => [
  {
    label1: '티켓구분',
    key1: 'option',
    label2: '신청일',
    key2: 'day',
  },
  {
    label1: '구매자',
    key1: 'buyer',
    label2: '참석자',
    key2: 'attender',
  },
  {
    label1: '전화번호',
    key1: 'phone',
    label2: '성별',
    key2: 'gender',
  },
  {
    label1: '나이',
    key1: 'age',
    label2: '교회',
    key2: 'church',
  },
  {
    label1: '거주지역',
    key1: 'local',
    label2: '교단',
    key2: 'denom',
  },
  {
    label1: '구매수량',
    key1: 'count',
    label2: '좌석구역',
    key2: 'area',
  },
  {
    label1: '메모',
    key: 'memo',
    colspan: true,
  },
]);

const fetchSearchOptions = async () => {
  optionsLoading.value = true;

  try {
    // 티켓구분
    const ticketRes = await ConferenceApi.getOptions();
    if (!ticketRes.ok) {
      toastApi.errorFromResult(ticketRes);
    }
    const ticketList = ticketRes.data?.data?.list ?? [];
    ticketOptions.value = [{ key: '0', value: '티켓구분' }, ...ticketList];

    // 신청일
    const dayRes = await ConferenceApi.getDays();
    if (!dayRes.ok) {
      toastApi.errorFromResult(dayRes);
    }
    const dayList = dayRes.data?.data?.list ?? [];
    daysOptions.value = [{ key: '0', value: '신청일' }, ...dayList];

    //좌석구분
    const areaRes = await ConferenceApi.getAreas();
    if (!areaRes.ok) {
      toastApi.errorFromResult(areaRes);
    }
    const areaList = areaRes.data?.data?.list ?? [];
    areaOptions.value = [{ key: '', value: '좌석구분' }, ...areaList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const fetchDetail = async () => {
  if (!uniqueId.value) return;

  isLoading.value = true;

  try {
    const res = await ConferenceApi.getDetail(uniqueId.value);
    if (!res.ok) return toastApi.errorFromResult(res);

    detailInfo.value = res.data?.data ?? {};
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

const buildParams = () => {
  return {
    licenseCd: licenseCd.value,
    hospNo: detailInfo.value.hospNo,
    hospNm: detailInfo.value.hospNm,
    deptCd: detailInfo.value.deptCd,
    addr: detailInfo.value.addr,
    telNo: detailInfo.value.telNo,
    wifiYn: detailInfo.value.wifiYn,

    capNm: detailInfo.value.capNm,
    capTelNo: detailInfo.value.capTelNo,
    plusId: detailInfo.value.plusId,
    plusTelNo: detailInfo.value.plusTelNo,
    entYmd: toYmdCompact(detailInfo.value.entYmd),
    entTime: detailInfo.value.entTime,
    entEmplNm: detailInfo.value.entEmplNm,
    entIp: detailInfo.value.entIp,

    goodocAccStep: detailInfo.value.goodocAccStep,
    GoodocTrsYn:
      detailInfo.value.goodocTrsYn !== 'N' ? toYmdCompact(detailInfo.value.goodocTrsYnYmd) : 'N',
    branchSetYn:
      detailInfo.value.branchSetYn !== 'N' ? toYmdCompact(detailInfo.value.branchSetYnYmd) : 'N',
    goodocFinalYn: detailInfo.value.goodocFinalYn,
    memo: detailInfo.value.memo,
  };
};

const createFormData = (p) => {
  const fd = new FormData();
  const append = (k, v) => fd.append(k, v ?? '');
  append('LicenseCd', p.licenseCd);
  append('HospNo', p.hospNo);
  append('HospNm', p.hospNm);
  append('DeptCd', p.deptCd);
  append('Addr', p.addr);
  append('TelNo', p.telNo);
  append('WifiYn', p.wifiYn);

  append('CapNm', p.capNm);
  append('CapTelNo', p.capTelNo);
  append('PlusId', p.plusId);
  append('PlusTelNo', p.plusTelNo);
  append('EntYmd', p.entYmd);
  append('EntTime', p.entTime);
  append('EntEmplNm', p.entEmplNm);
  append('EntIp', p.entIp);

  append('goodocAccStep', p.goodocAccStep);
  append('GoodocTrsYn', p.GoodocTrsYn);
  append('branchSetYn', p.branchSetYn);
  append('goodocFinalYn', p.goodocFinalYn);
  append('memo', p.memo);

  return fd;
};

const handleSubmit = async () => {
  if (isSubmitting.value)
    return;

  const confirm = await modal.show({
    title: '저장',
    message: '수정 내용을 저장하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm)
    return;

  try {
    isSubmitting.value = true;

    const params = {
      uniqueIdKey: uniqueId.value,
      option: detailInfo.value.option,
      day: detailInfo.value.day,
      buyer: detailInfo.value.buyer,
      attender: detailInfo.value.attender,
      phone: detailInfo.value.phone,
      gender: detailInfo.value.gender,
      age: detailInfo.value.age,
      church: detailInfo.value.church,
      local: detailInfo.value.local,
      denom: detailInfo.value.denom,
      count: detailInfo.value.count,
      area: detailInfo.value.area,
      memo: detailInfo.value.memo,
    };

    const res = await ConferenceApi.postModify(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('저장되었습니다.');
    router.back();
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

onMounted(() => {
  fetchSearchOptions();
  fetchDetail();
});

watch(
  () => detailInfo.value.denom,
  () => (isEtc.value = ''),
);
</script>

<template>
  <CRow>
    <CCol sm="6">
      <CCard class="mb-3">
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <h6 class="mb-0 fw-bold">등록자 정보수정</h6>
        </CCardHeader>

        <CCardBody>
          <div class="loading" v-if="isLoading">
            <UiLoading />
          </div>
          <UiGridTable :fields="userInfoFields">
            <!--티켓구분-->
            <template #value-option>
              <CFormSelect v-model="detailInfo.option" size="sm">
                <option v-for="opt in ticketOptions" :key="opt.key" :value="opt.key">
                  {{ opt.value }}
                </option>
              </CFormSelect>
            </template>

            <!--신청일-->
            <template #value-day>
              <CFormSelect v-model="detailInfo.day" size="sm">
                <option v-for="opt in daysOptions" :key="opt.key" :value="opt.key">
                  {{ opt.value }}
                </option>
              </CFormSelect>
            </template>

            <!--구매자-->
            <template #value-buyer>
              <CFormInput v-model="detailInfo.buyer" size="sm" />
            </template>

            <!--참석자-->
            <template #value-attender>
              <CFormInput v-model="detailInfo.attender" size="sm" />
            </template>

            <!--전화번호-->
            <template #value-phone>
              <CFormInput v-model="detailInfo.phone" size="sm" />
            </template>

            <!--성별-->
            <template #value-gender>
              <CFormSelect v-model="detailInfo.gender" size="sm">
                <option v-for="opt in genderOptions" :key="opt.key" :value="opt.key">
                  {{ opt.value }}
                </option>
              </CFormSelect>
            </template>

            <!--나이-->
            <template #value-age>
              <CFormInput v-model="detailInfo.age" type="number" size="sm" />
            </template>

            <!--교회-->
            <template #value-church>
              <CFormInput v-model="detailInfo.church" size="sm" />
            </template>

            <!--거주지역-->
            <template #value-local>
              <CFormInput v-model="detailInfo.local" size="sm" />
            </template>

            <!--교단-->
            <template #value-denom>
              <div class="d-flex align-items-center">
                <CFormSelect v-model="detailInfo.denom" size="sm">
                  <option v-for="opt in denomOptions" :key="opt.key" :value="opt.key">
                    {{ opt.value }}
                  </option>
                </CFormSelect>

                <div v-if="detailInfo.denom === '기타'" class="ms-2">
                  <CFormInput v-model="isEtc" size="sm" style="width: 140px" />
                </div>
              </div>
            </template>

            <!--구매수량-->
            <template #value-count>
              <CFormInput v-model="detailInfo.count" type="number" size="sm" />
            </template>

            <!--좌석구역-->
            <template #value-area>
              <CFormSelect v-model="detailInfo.area" size="sm">
                <option v-for="opt in areaOptions" :key="opt.key" :value="opt.key">
                  {{ opt.value }}
                </option>
              </CFormSelect>
            </template>

            <!--메모-->
            <template #value-memo>
              <CFormTextarea v-model="detailInfo.memo" rows="3" />
            </template>
          </UiGridTable>
        </CCardBody>
      </CCard>

      <div class="d-flex justify-content-end gap-2">
        <CButton color="secondary" size="sm" @click="router.back()">뒤로</CButton>
        <CButton color="primary" size="sm" @click="handleSubmit">저장</CButton>
      </div>
    </CCol>
  </CRow>
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
