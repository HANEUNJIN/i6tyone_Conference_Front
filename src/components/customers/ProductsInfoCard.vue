<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { HospApi } from '@/api/temp/hosp';
import { datepickerFixed, formatYmd } from '@/utils/common';
import { useApiToast } from '@/composables/useApiToast';
import { useToast } from '@/composables/useToast';
import Datepicker from '@vuepic/vue-datepicker';
import UiModal from '@/components/ui/UiModal.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import titleIcon from '@/assets/images/common/title-icon.png';

// 테이블 헤더 정의
const PRODUCT_INFO_COLUMNS = [
  { key: 'checkbox', label: '', width: '24px' },
  { key: 'startYm', label: '과금시작월', width: '10%' },
  { key: 'expYmd', label: '폐기월', width: '10%' },
  { key: 'itemNm', label: '제품명', width: 'auto', align: 'left' },
  { key: 'price', label: '기본금액', width: '70px', align: 'right' },
  { key: 'qty', label: '수량', width: '40px' },
  { key: 'lastCost', label: '실판매가', width: '70px', align: 'right' },
];
// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const productList = ref([]);
const isShowConfirmModal = ref(false);
const isShowUninstallModal = ref(false);
const isLoading = ref(false);

// ----------------------
//  ✨ methods / functions/
// ----------------------
const fetchProductInfo = async () => {
  isLoading.value = true;
  try {
    // 설치비
    const installRes = await HospApi.getProductInfo({
      menuType: storeMenuType.value,
      licenseCd: storeLicenseCd.value,
      searchType: '01',
    });
    if (!installRes.ok) return toastApi.errorFromResult(installRes);
    productList.value = installRes.data?.resultData?.list ?? [];
    // 월회비
    const monthRes = await HospApi.getProductInfo({
      menuType: storeMenuType.value,
      licenseCd: storeLicenseCd.value,
      searchType: '02',
    });
    if (!monthRes.ok) return toastApi.errorFromResult(monthRes);
    const monthList = monthRes.data?.resultData?.list ?? [];
    productList.value = [...productList.value, ...monthList];
    productList.value.map((item) => {
      item.sum = item.lastCost * item.qty;
      item.selected = false;
    });
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchProductInfo();
});
</script>

<template>
  <CCard>
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>사용 제품정보</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiDataTable :loading="isLoading" :columns="PRODUCT_INFO_COLUMNS" :items="productList">
        <template #cell-checkbox="{ item, index }">
          <template v-if="item.itemType === '10' && item.expYmd === null">
            <CFormCheck :id="`${item.itemCd}${index}`" v-model="item.selected" />
          </template>
        </template>
        <template #cell-startYm="{ item }">
          {{ formatYmd(item.startYm || item.startYmd || '') }}
        </template>
        <template #cell-itemNm="{ item, index }">
          <label
            v-if="item.itemType === '10' && item.expYmd === null"
            :for="`${item.itemCd}${index}`"
            style="cursor: pointer"
          >
            {{ (item.itemType === '00' ? '[설치비] ' : '[월회비] ') + item.itemNm }}
          </label>
        </template>
        <template #cell-price="{ item }">
          {{ item.price.toLocaleString('ko-KR') }}
        </template>
        <template #cell-lastCost="{ item }">
          {{ item.lastCost.toLocaleString('ko-KR') }}
        </template>
      </UiDataTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton
        :disabled="!productList.some((item) => item.selected === true)"
        color="danger"
        size="sm"
        @click="() => (isShowUninstallModal = true)"
        >제품 해제</CButton
      >
      <CButton color="primary" size="sm" @click="() => (isShowConfirmModal = true)"
        >제품 추가</CButton
      >
    </CCardFooter>
  </CCard>
  <UiModal
    v-model:visible="isShowConfirmModal"
    title="계약자 정보 확인 및 저장"
    @cancel="() => console.log('cancel')"
    @confirm="() => console.log('confirm')"
  >
    <template #body>
      <div class="d-flex flex-column gap-3">
        <CCol>
          <CFormLabel>계약자명</CFormLabel>
          <CFormInput placeholder="계약자명 입력" />
        </CCol>
        <CCol>
          <CFormLabel>계약자 연락처</CFormLabel>
          <CFormInput placeholder="계약자 연락처 입력" />
        </CCol>
        <CCol>
          <CFormLabel>계약자 이메일</CFormLabel>
          <CFormInput placeholder="계약자 이메일 입력" />
        </CCol>
        <p class="text-center">
          <span class="text-danger">* 위의 정보로 본인 인증 및 계약 사인이 진행 됩니다.</span
          ><br /><br />
          (계약자명이 정확히 입력 안되었을 경우<br />
          위의 입력란을 통해 다시 한번 정확히 입력해주세요)
        </p>
      </div>
    </template>
  </UiModal>
  <UiModal
    v-model:visible="isShowUninstallModal"
    title="해제 진행"
    @cancel="() => console.log('cancel')"
    @confirm="() => console.log('confirm')"
  >
    <template #body>
      <div class="d-flex flex-column gap-3">
        <CCol>
          <CFormLabel>계약자명</CFormLabel>
          <CFormInput placeholder="계약자명 입력" />
        </CCol>
        <CCol>
          <CFormLabel>계약자 연락처</CFormLabel>
          <CFormInput placeholder="계약자 연락처 입력" />
        </CCol>
        <CCol>
          <CFormLabel>계약자 이메일</CFormLabel>
          <CFormInput placeholder="계약자 이메일 입력" />
        </CCol>
        <CCol>
          <CFormLabel>해제일</CFormLabel>
          <Datepicker
            v-bind="datepickerFixed"
            locale="ko"
            :ui="{ input: 'form-control form-control-sm' }"
          />
        </CCol>
        <CCol>
          <CFormLabel>특이사항</CFormLabel>
          <CFormInput placeholder="특이사항 입력" />
        </CCol>
        <p class="text-center">
          <span class="text-danger">* 위의 정보로 본인 인증 및 계약 사인이 진행 됩니다.</span
          ><br /><br />
          (계약자명이 정확히 입력 안되었을 경우<br />
          위의 입력란을 통해 다시 한번 정확히 입력해주세요)
        </p>
      </div>
    </template>
  </UiModal>
</template>

<style scoped></style>
