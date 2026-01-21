<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import { computed, onMounted, ref } from 'vue';
import { ConferenceApi } from '@/api/conference';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { CFormSelect } from '@coreui/vue';
import { datepickerFixed, getTodayYmd } from '@/utils/common';
import Datepicker from '@vuepic/vue-datepicker';
import UiAttachments from '@/components/ui/UiAttachments.vue';
import UiModal from '@/components/ui/UiModal.vue';

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
const optionsLoading = ref(false);
const isShowUploadModal = ref(false);
const fileInfo = ref([]);

const ticket = ref('0'); //티켓구분
const ticketOptions = ref([]);

const days = ref('0'); //신청일
const daysOptions = ref([]);
const fileName = ref('');

const updateYmd = ref(getTodayYmd());

const userInfoFields = computed(() => [
  { label1: '티켓구분', key: 'option', colspan: true },
  { label1: '신청일', key: 'day', colspan: true },
  { label1: '기준일', key: 'updateYmd', colspan: true },
  { label1: '.CSV 파일', key: 'file', colspan: true },
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
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
};

const handleUpload = async () => {
  if (!fileInfo.value[0]) return toast.error(`.CSV 파일을 첨부해주세요.`);

  fileName.value = fileInfo.value[0].name;
  isShowUploadModal.value = false;
};

const handleSubmit = async () => {
  const params = {
    option: ticket.value,
    day: days.value,
    updateYmd: updateYmd.value,
    file: fileInfo.value[0],
  };

  const formData = new FormData();
  formData.append('option', ticket.value);
  formData.append('day', days.value);
  formData.append('updateYmd', updateYmd.value);
  formData.append('file', fileInfo.value[0]);

  try {
    const res = await ConferenceApi.postEventUsUpload(formData);
    const successCount = res.data?.data?.successCount;

    if (!res.ok)
      return toastApi.errorFromException(res);

    toast.success(`${updateYmd.value} 기준으로 ${successCount}건의 데이터가 연동되었습니다.`);
    Clear();
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    isShowUploadModal.value = false;
  }
};

const Clear = () => {
  ticket.value = '';
  days.value = '';
  updateYmd.value = '';
  fileInfo.value = [];
};

onMounted(() => {
  fetchSearchOptions();
});
</script>

<template>
  <CRow>
    <CCol sm="4">
      <CCard class="mb-3">
        <CCardHeader><h6 class="mb-0 fw-bold">.CSV 파일 동기화</h6></CCardHeader>
        <CCardBody>
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

            <!--업데이트 날짜-->
            <template #value-updateYmd>
              <Datepicker
                v-model="updateYmd"
                v-bind="datepickerFixed"
                locale="ko"
                :ui="{ input: 'form-control form-control-sm' }"
              />
            </template>

            <!--.CSV 파일-->
            <template #value-file>
              <div class="d-flex gap-2">
                <CFormInput v-model="fileName" size="sm" disabled />
                <CButton variant="outline" size="sm" @click="() => (isShowUploadModal = true)"
                  >업로드</CButton
                >
              </div>
            </template>
          </UiGridTable>
        </CCardBody>
        <CCardFooter>
          <div class="d-flex justify-content-end gap-2">
            <CButton color="primary" size="sm" @click="handleSubmit">연동</CButton>
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>

  <UiModal v-model:visible="isShowUploadModal" title=".CSV 파일 업로드" @confirm="handleUpload">
    <template #body>
      <UiAttachments v-model="fileInfo" :accept="['text/csv']" :max-count="1" helper-text="" />
    </template>
  </UiModal>
</template>
