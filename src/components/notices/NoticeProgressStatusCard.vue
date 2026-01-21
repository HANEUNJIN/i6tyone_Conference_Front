<script setup>
import { computed } from 'vue';
import Datepicker from '@vuepic/vue-datepicker';
import { datepickerFixed } from '@/utils/common';

const props = defineProps({
  progressOptions: { type: Array, default: () => [] }, // 셀렉트 옵션
  detail: { type: Object, default: null }, // 하단 처리자/로그 표시용
});

// 단일 v-model 객체
const form = defineModel('form', { type: Object, default: () => ({}) });

// 필드 바인딩(부모 form의 필드에 직접 연결)
const mProgressSt = computed({
  get: () => form.value.progressSt,
  set: (v) => (form.value.progressSt = v),
});
const mDevExpYmd = computed({
  get: () => form.value.devExpYmd,
  set: (v) => (form.value.devExpYmd = v),
});
const mProgressModYmd = computed({
  get: () => form.value.progressModYmd,
  set: (v) => (form.value.progressModYmd = v),
});
const mDevNonReason = computed({
  get: () => form.value.devNonReason,
  set: (v) => (form.value.devNonReason = v),
});

// 체크박스(Y/N) <-> boolean 매핑
const qcChecked = computed({
  get: () => form.value.devNonQcYn === 'Y',
  set: (b) => (form.value.devNonQcYn = b ? 'Y' : 'N'),
});
const marketChecked = computed({
  get: () => form.value.devNonMarketYn === 'Y',
  set: (b) => (form.value.devNonMarketYn = b ? 'Y' : 'N'),
});
const bonbuChecked = computed({
  get: () => form.value.devNonBonbuYn === 'Y',
  set: (b) => (form.value.devNonBonbuYn = b ? 'Y' : 'N'),
});
const smsNoSendChecked = computed({
  get: () => form.value.smsSendChk === 'N',
  set: (b) => (form.value.smsSendChk = b ? 'N' : 'Y'),
});

const emit = defineEmits(['save', 'apply']);
function onSave() {
  emit('save');
}
</script>

<template>
  <CCard class="mt-3">
    <CCardHeader class="d-flex justify-content-between align-items-center">
      <h6 class="mb-0">진행상태</h6>
      <CButton color="primary" size="sm" @click="onSave">저장</CButton>
    </CCardHeader>
    <CCardBody>
      <CForm>
        <CRow>
          <CCol md="4">
            <CFormLabel>진행상태</CFormLabel>
            <CFormSelect v-model="mProgressSt" size="sm">
              <option v-for="option in progressOptions" :key="option.codeId" :value="option.codeId">
                {{ option.codeNm }}
              </option>
            </CFormSelect>
          </CCol>
          <CCol md="4">
            <CFormLabel>개발예정일</CFormLabel>
            <Datepicker
              v-model="mDevExpYmd"
              locale="ko"
              placeholder="노출날짜를 선택하세요"
              v-bind="datepickerFixed"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </CCol>
          <CCol md="4">
            <CFormLabel>처리일</CFormLabel>
            <Datepicker
              v-model="mProgressModYmd"
              locale="ko"
              placeholder="노출날짜를 선택하세요"
              v-bind="datepickerFixed"
              :ui="{ input: 'form-control form-control-sm' }"
            />
          </CCol>
        </CRow>

        <CRow class="mt-2">
          <CCol md="12">
            <CFormLabel>개발불가사유</CFormLabel>
            <CFormInput v-model="mDevNonReason" placeholder="어떤 이유 때문에 힘듬" />
          </CCol>
        </CRow>

        <CRow class="mt-3">
          <CCol sm="6">
            <div class="mb-2">승인여부</div>
            <div class="d-flex flex-wrap align-items-center gap-3">
              <CFormCheck class="checkbox" id="QC" label="QC" v-model="qcChecked" />
              <CFormCheck class="checkbox" id="마케팅" label="마케팅" v-model="marketChecked" />
              <CFormCheck class="checkbox" id="본부장" label="본부장" v-model="bonbuChecked" />
              <CButton color="success" size="sm" @click="emit('apply')">승인</CButton>
            </div>
          </CCol>
          <CCol sm="6">
            <div class="mb-2">SMS 전송(진행상태 배포완료시 : 자동발송)</div>
            <div class="d-flex flex-wrap gap-3">
              <CFormCheck class="checkbox" id="미전송" label="미전송" v-model="smsNoSendChecked" />
            </div>
          </CCol>
        </CRow>

        <template v-if="detail?.progressStDevUserNm || detail?.boardProcessLog !== null">
          <hr class="mt-4 mb-4" />
          <CRow>
            <div class="col-sm-1"><strong>처리자</strong></div>
            <div class="col-sm-11">
              <p>{{ detail?.progressStDevUserNm }}</p>
            </div>
          </CRow>
          <CRow>
            <div class="col-sm-1"><strong>처리로그</strong></div>
            <div class="col-sm-11">
              <p>
                <template
                  v-if="detail?.boardProcessLog !== null && detail?.boardProcessLog?.length"
                >
                  <div v-for="(item, idx) in detail.boardProcessLog" :key="idx">
                    [{{ item.regDt }}] &nbsp;&nbsp;{{ item.progressStDevNm }} ({{ item.userNm }})
                    <template v-if="item.progressStDev == 'A3908'">
                      &nbsp;&nbsp;&nbsp;[&nbsp;QC:{{ item.devNonQcYn }}, 마케팅:{{
                        item.devNonMarketYn
                      }}, 본부장:{{ item.devNonBonbuYn }}, 승인 : {{ item.devNonApplyYn }}&nbsp;]
                    </template>
                  </div>
                </template>
              </p>
            </div>
          </CRow>
        </template>
      </CForm>
    </CCardBody>
  </CCard>
</template>

<style scoped>
.checkbox {
  min-height: auto;
}
.checkbox > * {
  cursor: pointer;
}
.checkbox > :last-of-type {
  margin-bottom: 0;
}
</style>
