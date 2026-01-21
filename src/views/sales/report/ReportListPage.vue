<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useBaseStore } from '@/stores/base';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { nextTick, onMounted, ref, watch } from 'vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import { CommonAPI } from '@/api/temp/common';
import { UserAPI } from '@/api/temp/user';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { SalesAPI } from '@/api/temp/sales';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const base = useBaseStore();
const toast = useToast();
const toastApi = useApiToast();

const progressOptions = ref([
  { codeId: '00', codeNm: '진행상태' },
  { codeId: '01', codeNm: '영업중' },
  { codeId: '02', codeNm: '계약완료' },
  { codeId: '03', codeNm: '계약불발' },
  { codeId: '04', codeNm: '타대리점계약' },
  { codeId: '05', codeNm: '영업권소멸' },
]);
const branchOptions = ref([]);
const userOptions = ref([]);

const isOptionsLoading = ref(false);
const isBranchView = ref(false);
const myListCheck = ref(false);
const progress = ref('00');
const branch = ref('');
const user = ref('');

// 테이블 헤더 정의
const COLUMNS = [
  { key: 'totNo', label: '순번', width: '5%' },
  { key: 'regDt', label: '등록일', width: '7%' },
  { key: 'ddays', label: 'D-day(영업권상실)', width: '10%' },
  { key: 'corpNm', label: '지사', width: '10%' },
  { key: 'progress', label: '상태', width: '7%' },
  { key: 'cNm', label: '의사명', width: '7%' },
  { key: 'deptNm', label: '진료과목', width: '8%' },
  { key: 'memo', label: '내용', width: '38%', align: 'left' },
  { key: 'userNm', label: '등록자', width: '7%' },
];

// 대리점 옵션
async function fetchBranchOptions() {
  try {
    // 대리점 옵션
    const branchRes = await CommonAPI.getBranchCorp({
      bonsaFlag: '',
      menuType: base.storeMenuType,
    });
    if (!branchRes.ok) {
      toastApi.errorFromResult(branchRes);
      return;
    }
    const branchList = branchRes.data?.resultData?.list ?? [];
    branchOptions.value = [{ codeId: '', codeNm: '전체' }, ...branchList];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 직원 옵션
async function fetchUserOptions() {
  isOptionsLoading.value = true;
  try {
    if (auth.userInfo.agencyYn !== 'Y') {
      isBranchView.value = true;
      const params = {
        branch: branch.value,
      };
      const res = await UserAPI.getBranchUsers(params);
      if (!res.ok) return toastApi.errorFromResult(res);
      const userList = res.data?.resultData?.list ?? [];
      userOptions.value = [{ userId: '', userNm: '직원' }, ...userList];
      user.value = '';
      await fetchBranchOptions();
    } else {
      isBranchView.value = false;
      const params = {
        userId: auth.userInfo.userId,
        userType: auth.userInfo.userType,
        menuType: base.storeMenuType,
      };
      const res = await UserAPI.getGroupUsers(params);
      if (!res.ok) return toastApi.errorFromResult(res);
      const userList = res.data?.resultData?.list ?? [];
      userOptions.value = [{ userId: '', userNm: '직원' }, ...userList];
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isOptionsLoading.value = false;
  }
}

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onReset, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    extra: { branch, progress, user },
    autoSearchOnExtraChange: true,
  });

// 리스트
async function fetchList({ page, size, keyword, progress, branch, user }) {
  const params = {
    userId: auth.userInfo.userId,
    pageNum: page,
    pageSize: size,
    keyword: keyword || '',
    progress: progress,
    branch: branch,
    regUserId: user,
    userType: 'A',
    menuType: base.storeMenuType,
    myListCheck: myListCheck.value ? 'Y' : 'N',
  };
  try {
    const res = await SalesAPI.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
}

// 상세 페이지 이동
function goDetail(item) {
  router.push({
    name: ROUTE.Sales.Report.Detail,
    query: { ...route.query, seq: item.seqCry },
  });
}

watch(branch, () => {
  fetchUserOptions();
});

watch(myListCheck, () => {
  init();
});

onMounted(() => {
  fetchUserOptions();
  init();
});
</script>

<template>
  <!--검색-->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="isOptionsLoading"
        :show-reset="true"
        placeholder="키워드를 검색해주세요."
        @submit="onSearch"
        @reset="onReset"
      >
        <template #extra-front>
          <CFormSelect v-model="progress" size="sm" style="width: 120px">
            <option v-for="opt in progressOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-if="isBranchView" v-model="branch" size="sm" style="width: 120px">
            <option v-for="opt in branchOptions" :key="opt.codeId" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
          <CFormSelect v-model="user" size="sm" style="width: 120px">
            <option v-for="opt in userOptions" :key="opt.userId" :value="opt.userId">
              {{ opt.userNm }}
            </option>
          </CFormSelect>
        </template>
        <template #extra-btn>
          <CFormCheck class="checkbox" id="내리스트" label="내리스트" v-model="myListCheck" />
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>
  <CCard class="flex-grow-1">
    <CCardBody>
      <UiDataTable
        :loading="loading || isOptionsLoading"
        :columns="COLUMNS"
        :items="items"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => goDetail(row)"
      >
        <template #cell-ddays="{ item }">
          <span class="text-danger">{{ item.ddays }}</span>
        </template>
      </UiDataTable>
      <UiPagination
        v-if="total > 0"
        v-model:page="page"
        v-model:size="size"
        :total="total"
        :size-options="[15, 20, 50]"
        :edge-count="4"
        :mid-count="3"
        @change="onPageChanged"
      />
    </CCardBody>
  </CCard>
</template>

<style scoped>
.checkbox {
  margin-left: 5px;
  min-height: auto;
}
.checkbox > * {
  cursor: pointer;
}
.checkbox > :last-of-type {
  margin-bottom: 0;
}
</style>
