<script setup>
import { computed, onMounted, ref } from 'vue';
import { useApiToast } from '@/composables/useApiToast';
import UiModal from '@/components/ui/UiModal.vue';
import UiGridTable from '@/components/ui/UiCustomGridTable.vue';
import UiLoading from '@/components/ui/UiLoading.vue';
import { CFormSelect, CFormTextarea } from '@coreui/vue';
import { ConferenceApi } from '@/api/conference';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { getTodayYmd } from '@/utils/common';

// ----------------------
//  ✨ Props & Emits
// ----------------------
const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible', 'confirm']);

const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

// ----------------------
//  ✨composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

// ----------------------
//  ✨reactive, ref state
// ----------------------
const isLoading = ref(false);
const isSubmitting = ref(false);
const optionsLoading = ref(false);
const detailInfo = ref({
  buyer: '',
  attender: '',
  phone: '',
  age: '0',
  church: '',
  local: '',
  count: '1',
  memo: '',
});

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

const attend = ref('');
const attendOptions = ref([
  { key: '', value: '출석여부' },
  { key: 'Y', value: 'Y' },
  { key: 'N', value: 'N' },
]);

const newBelieverYn = ref(false);
const notionSmsYn = ref(false);

const newBelieverOptions = ref([
  { key: '', value: '새신자여부' },
  { key: 'Y', value: 'Y' },
  { key: 'N', value: 'N' },
]);

const notionSmsOptions = ref([
  { key: '', value: '가이드북 발송여부' },
  { key: 'Y', value: 'Y' },
  { key: 'N', value: 'N' },
]);

const userInfoFields = computed(() => [
  {
    cols: [
      { label: '티켓구분', key: 'option' },
      { label: '신청일', key: 'day' },
    ],
  },
  {
    cols: [
      { label: '구매자', key: 'buyer' },
      { label: '참석자', key: 'attender' },
    ],
  },
  {
    cols: [
      { label: '전화번호', key: 'phone' },
      { label: '성별', key: 'gender' },
    ],
  },
  {
    cols: [
      { label: '나이', key: 'age' },
      { label: '교회', key: 'church' },
    ],
  },
  {
    cols: [
      { label: '거주지역', key: 'local' },
      { label: '교단', key: 'denom' },
    ],
  },
  {
    cols: [
      { label: '구매수량', key: 'count' },
      { label: '좌석구역', key: 'area' },
    ],
  },
  {
    cols: [
      { label: '출석여부', key: 'attend' },
      { label: '새신자여부', key: 'newBelieverYn' },
    ],
  },
  {
    cols: [
      { label: '가이드북 발송여부', key: 'notionSmsYn' },
      { label: '', key: '' },
    ],
  },
  {
    cols: [{ label: '메모', key: 'memo' }],
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

const handleSubmit = async () => {
  if (isSubmitting.value)
    return;

  const confirm = await modal.show({
    title: '등록',
    message: '등록하시겠습니까?',
    confirmText: '등록',
  });
  if (!confirm)
    return;

  try {
    isSubmitting.value = true;

    const params = {
      option: ticket.value,
      day: days.value,
      buyer: detailInfo.value.buyer,
      attender: detailInfo.value.attender,
      phone: detailInfo.value.phone,
      gender: gender.value,
      age: detailInfo.value.age,
      church: detailInfo.value.church,
      local: detailInfo.value.local,
      denom: detailInfo.value.denom === '기타' ? isEtc.value : '',
      count: detailInfo.value.count,
      area: area.value,
      memo: detailInfo.value.memo,
      newBelieverYn: newBelieverYn.value ? 'Y' : 'N',
      notionSmsYn: notionSmsYn.value ? 'Y' : 'N',
      applyYmd: getTodayYmd(),
    };

    const msg = validateForm(params);
    if (msg)
      return toast.error(msg);

    const res = await ConferenceApi.postCreate(params);
    if (!res.ok)
      return toastApi.errorFromResult(res);

    toast.success('등록되었습니다.');
    emit('confirm');
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isSubmitting.value = false;
  }
};

const validateForm = (f) => {
  if (!f.option?.trim())
    return '티켓구분을 선택하세요.';

  if (!f.day?.trim())
    return '신청일을 선택하세요.';

  if (!f.day?.trim())
    return '구매자를 입력하세요.';

  if (!f.phone?.trim())
    return '전화번호를 입력하세요.';

  if (!f.count?.trim())
    return '구매수량을 입력하세요.';

  return '';
}

const handleCancel = () => {
  modalVisible.value = false;
};

onMounted(() => {
  fetchSearchOptions();
});
</script>

<template>
  <UiModal
    v-model:visible="modalVisible"
    title="등록추가"
    cancel-text="닫기"
    confirm-text="등록"
    @confirm="handleSubmit"
    @cancel="handleCancel"
  >
    <template #body>
      <UiLoading v-if="isLoading" />

      <UiGridTable :fields="userInfoFields">
        <!--티켓구분-->
        <template #value-option>
          <CFormSelect v-model="ticket" size="sm">
            <option v-for="opt in ticketOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>
        </template>

        <!--신청일-->
        <template #value-day>
          <CFormSelect v-model="days" size="sm">
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
          <CFormSelect v-model="gender" size="sm">
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
          <CFormSelect v-model="area" size="sm">
            <option v-for="opt in areaOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>
        </template>

        <!--출석여부-->
        <template #value-attend>
          <CFormSelect v-model="attend" size="sm">
            <option v-for="opt in attendOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>
        </template>

        <!--새신자여부-->
        <template #value-newBelieverYn>
          <CFormSelect v-model="detailInfo.newBelieverYn" size="sm">
            <option v-for="opt in newBelieverOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>
        </template>

        <!--Notion 링크 발송-->
        <template #value-notionSmsYn>
          <CFormSelect v-model="detailInfo.notionSmsYn" size="sm">
            <option v-for="opt in notionSmsOptions" :key="opt.key" :value="opt.key">
              {{ opt.value }}
            </option>
          </CFormSelect>
        </template>

        <!--메모-->
        <template #value-memo>
          <CFormTextarea v-model="detailInfo.memo" rows="3" />
        </template>
      </UiGridTable>
    </template>
  </UiModal>
</template>
