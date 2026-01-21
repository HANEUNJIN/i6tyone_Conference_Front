<script setup>
import UiGridTable from '@/components/ui/UiGridTable.vue';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiToast } from '@/composables/useApiToast';
import { useBaseStore } from '@/stores/base';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import selectZone from '@/assets/images/selectZone.png';
import banner from '@/assets/images/banner.png';
import areaInfo from '@/assets/images/areaInfo.png';

// ----------------------
// ✨ composable / store
// ----------------------
const route = useRoute();
const router = useRouter();
const toastApi = useApiToast();
const base = useBaseStore();
const modal = useConfirmModal();
const toast = useToast();
const auth = useAuthStore();

// ----------------------
//  ✨reactive, ref state
// ----------------------
const isSubmitting = ref(false);
const optionsLoading = ref(false);
const detailInfo = reactive({
  name: '',
  phone: '',
});

const area = ref(''); //좌석구분
const areaOptions = [
  { key: '1F FLOOR', value: '1F FLOOR' },
  { key: '1F 계단석', value: '1F 계단석' },
  { key: '2F A', value: '2F A' },
  { key: '2F B', value: '2F B' },
  { key: '2F C', value: '2F C' },
];

const userInfoFields = computed(() => [
  { label1: '이름', key: 'name', colspan: true },
  { label1: '전화번호', key: 'phone', colspan: true },
]);

const handleSubmit = () => {
  alert(area.value);
};
</script>

<template>
  <CRow>
    <CCol sm="6">
      <CCard class="mb-3">
        <CImage :src="banner" />
      </CCard>
    </CCol>
  </CRow>
  <CRow>
    <CCol sm="6">
      <CCard class="mb-3">
        <CCardHeader>
          <h5 class="d-flex align-content-center gap-1 mb-0 fw-bold">
            🕊️2026 Solus CHRISTUS | 구역 우선 선택권
          </h5>
        </CCardHeader>

        <CCardBody>
          <p>2026 Isaiah6tyOne CONFERENCE | Solus CHRISTUS : 예수 그리스도</p>

          <span>다가올 2026년, 복음의 완성과 영원한 소망이 되시며 모든 것의 중심되시는</span>
          <span>예수 그리스도를 높이는 자리인 아이자야씩스티원컨퍼런스에 참석하시는 </span>
          <p>모든 예배자분들을 환영합니다🩵</p>

          <p>⏰ 신청기간 : 2025. 12. 10. 1PM - 12. 11. 8PM</p>

          <pre>
          본 신청 링크는 얼리버드로 신청하신 분들께 드리는
          [구역 우선 선택권] 혜택입니다.
          *구역 내 좌석수는 한정되어 있어 선착순으로 마감될 수 있습니다.
          *해당 링크는 외부 공유를 금합니다*
          </pre>
        </CCardBody>

        <CCardFooter>
          <p class="mb-0 fw-bold">🗓️ 2026. 01. 27 TUE - 01. 29 THU</p>
          <p class="mb-0 fw-bold">🏟️ 인천삼산월드체육관 [인천 부평구 체육관로 60]</p>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>
  <CRow>
    <CCol sm="6">
      <CCard class="mb-3">
        <CCardHeader>
          <h6 class="mb-0 fw-bold"><span class="text-danger">*</span> 등록조회</h6>
        </CCardHeader>

        <CCardBody>
          <p class="mb-0">* 신청 시 입력했던 이름과 전화번호를 동일하게 작성해주시기 바랍니다.</p>
          <p>* <b>단체 신청의 경우, 대표자분 성함</b>으로 입력해주시기 바랍니다.</p>

          <UiGridTable :fields="userInfoFields">
            <!--이름-->
            <template #value-name>
              <CFormInput v-model="detailInfo.name" size="sm" />
            </template>

            <!--전화번호-->
            <template #value-phone>
              <CFormInput v-model="detailInfo.phone" size="sm" />
            </template>
          </UiGridTable>
        </CCardBody>

        <CCardFooter>
          <div class="d-flex justify-content-end gap-2">
            <CButton color="secondary" size="sm" @click="handleSubmit">조회</CButton>
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>
  <CRow>
    <CCol sm="6">
      <CCard class="mb-3">
        <CCardHeader>
          <h6 class="mb-0 fw-bold">구역 선택 안내문</h6>
        </CCardHeader>

        <CCardBody>
          <CImage class="m-3" :src="areaInfo" />
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
  <CRow>
    <CCol sm="6">
      <CCard class="mb-3">
        <CCardHeader>
          <h6 class="mb-0 fw-bold"><span class="text-danger">*</span> 희망 구역 선택</h6>
        </CCardHeader>

        <CCardBody>
          <p class="mb-0 fw-bold">
            위 구역 선택 안내문을 확인하신 후 희망 구역을 선택해주시기 바랍니다.
          </p>

          <CImage class="m-3" :src="selectZone" />
          <div class="h6 d-flex flex-column gap-2">
            <CFormCheck
              v-for="item in areaOptions"
              :key="item.value"
              type="radio"
              name="area"
              :id="`area-${item.value}`"
              :label="item.key"
              :value="item.value"
              :checked="area === item.value"
              :label-for="`area-${item.value}`"
              @change="area = item.value"
            />
          </div>
        </CCardBody>

        <CCardFooter>
          <div class="d-flex justify-content-end gap-2">
            <CButton color="primary" size="sm" @click="handleSubmit">제출</CButton>
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>
</template>
