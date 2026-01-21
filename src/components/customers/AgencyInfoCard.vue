<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBaseStore } from '@/stores/base';
import { UserAPI } from '@/api/temp/user';
import { HospApi } from '@/api/temp/hosp';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import UiGridTable from '@/components/ui/UiCustomGridTable.vue';
import titleIcon from '@/assets/images/common/title-icon.png';
import UiLoading from '@/components/ui/UiLoading.vue';

// ----------------------
//  ✨composable / store
// ----------------------
const base = useBaseStore();
const modal = useConfirmModal();
const { storeMenuType, storeLicenseCd } = storeToRefs(base); // ref 형태로 추출
const toastApi = useApiToast();
const toast = useToast();
// ----------------------
//  ✨reactive, ref state
// ----------------------
const agencyInfo = ref({});
const isEtcUser = ref(false);
const userOptions = ref([]);
const allUserOptions = ref([]);
const isLoading = ref(false);

// 담당 대리점 필드
const agencyInfoFields = computed(() => [
  {
    cols: [{ label: '담당 대리점', key: 'branchNm', labelWidth: 4, valueWidth: 8 }],
    colspan: true,
  },
  {
    cols: [
      {
        label: '계약 담당자',
        value: agencyInfo.value.contMng || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
  {
    cols: [
      {
        label: '계약 담당자 연락처',
        value: agencyInfo.value.contMngTel || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
  {
    cols: [{ label: '서비스 대리점', key: 'serviceBranchNm', labelWidth: 4, valueWidth: 8 }],
    colspan: true,
  },
  {
    cols: [{ label: '서비스 담당자', key: 'serviceUserId', labelWidth: 4, valueWidth: 8 }],
    colspan: true,
  },
  {
    cols: [
      {
        label: '서비스 담당자 연락처',
        value: agencyInfo.value.serviceUserPhone || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
  {
    cols: [
      {
        label: '기존 차트업체',
        value: agencyInfo.value.hospPchart || '-',
        labelWidth: 4,
        valueWidth: 8,
      },
    ],
    colspan: true,
  },
]);
// ----------------------
//  ✨ methods / functions/
// ----------------------
// 대리점 직원 검색> 브랜치 코드로 넘겼을 경우에도 나오게끔
const fetchUserOptions = async () => {
  try {
    const res = await UserAPI.getBranchUsersFilterEghis({
      branch: agencyInfo.value.branch,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    userOptions.value = [{ userId: '', userNm: '선택' }, ...res.data?.resultData?.list];
    if (agencyInfo.value.serviceBranchNm !== agencyInfo.value.serviceCorpNm) {
      isEtcUser.value = true;
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 대리점 직원 검색> 브랜치 코드로 넘겼을 경우에도 나오게끔
const fetchAllUserOptions = async () => {
  try {
    const res = await UserAPI.getUsers({
      branch: agencyInfo.value.branch,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    allUserOptions.value = [{ userId: '', userNm: '선택' }, ...res.data?.resultData?.list];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
};

// 담당 대리점 정보
const fetchAgencyInfo = async () => {
  isLoading.value = true;
  try {
    const res = await HospApi.getAgencyInfo({
      licenseCd: storeLicenseCd.value,
      menuType: storeMenuType.value,
    });
    if (!res.ok) return toastApi.errorFromResult(res);
    agencyInfo.value = res.data?.resultData;
    await fetchUserOptions();
    await fetchAllUserOptions();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAgencyInfo();
});
</script>

<template>
  <CCard class="h-100">
    <CCardHeader>
      <h6 class="d-flex align-content-center gap-1 mb-0">
        <CImage :src="titleIcon" width="20" /> <span>담당 대리점</span>
      </h6>
    </CCardHeader>
    <CCardBody>
      <UiLoading v-if="isLoading" />
      <UiGridTable :fields="agencyInfoFields">
        <template #value-branchNm>
          {{ agencyInfo.branchNm }}
          <span class="text-danger">[{{ agencyInfo.serviceCorpNm }}]</span>
        </template>
        <template #value-serviceBranchNm>
          <span class="text-danger">{{ agencyInfo.serviceBranchNm }}</span>
        </template>
        <template #value-serviceUserId>
          <CFormCheck id="isEtcUser" label="기타 담당자선택" v-model="isEtcUser" />
          <CFormSelect v-model="agencyInfo.serviceUserId" size="sm" v-if="isEtcUser">
            <option v-for="opt in allUserOptions" :key="opt.codeId" :value="opt.userId">
              {{ opt.userNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="agencyInfo.serviceUserId" size="sm" v-else>
            <option v-for="opt in userOptions" :key="opt.codeId" :value="opt.userId">
              {{ opt.userNm }}
            </option>
          </CFormSelect>
        </template>
      </UiGridTable>
    </CCardBody>
    <CCardFooter class="d-flex justify-content-end gap-1">
      <CButton color="primary" size="sm">저장</CButton>
    </CCardFooter>
  </CCard>
</template>

<style scoped></style>
