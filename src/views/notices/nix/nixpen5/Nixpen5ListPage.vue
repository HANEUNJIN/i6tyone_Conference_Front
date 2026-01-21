<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { NoticesAPI, NoticesNixpenAPI } from '@/api/notices';
import { CommonAPI } from '@/api/temp/common';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { ROUTE } from '@/constants/routeName';

import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import newIcon from '@/assets/images/new-icon.gif';
import { CFormSelect } from '@coreui/vue';
import { NixBoardType } from '@/constants';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();

const deptOptions = ref([]); // 요청 부서 옵션
const recDeptOptions = ref([]); // 수진 부서 옵션
const progressOptions = ref([]); // 진행 상태 옵션
const writeUserOptions = ref([]); // 작성자 옵션
const optionsLoading = ref(false); // 옵션 로딩 상태

const searchId = ref('');
const deptId = ref('');
const recDeptId = ref('');
const progressSt = ref('');
const writeUserId = ref('');

const COLUMNS = [
  { key: 'totNo', label: '순번', width: '40px' },
  { key: 'seq', label: 'ID', width: '50px' },
  { key: 'reqDeptNm', label: '요청부서', width: '120px' },
  { key: 'resDeptNm', label: '수신부서', width: '120px' },
  { key: 'subject', label: '제목', align: 'left' },
  { key: 'replyCnt', label: '댓글', width: '40px' },
  { key: 'userNm', label: '작성자', width: '90px' },
  { key: 'progressStDevNm', label: '진행상태', width: '80px' },
  { key: 'progressSt1UserNm', label: '처리자', width: '60px' },
  { key: 'progressModYmd', label: '처리일', width: '100px' },
  { key: 'regDt', label: '등록일', width: '100px' },
];

// 검색조건 옵션 리스트
const DEPT_ALLOW_LIST = ['0076', '0077', '0078', '0079'];

async function getSearchOptions() {
  optionsLoading.value = true;

  try {
    //개발 진행상태 리스트
    const progressRes = await CommonAPI.getCode('A39');
    if (!progressRes.ok) {
      toastApi.errorFromResult(progressRes);
      return;
    }

    const progressList = progressRes.data?.resultData?.list ?? [];
    progressOptions.value = [{ codeId: '', codeNm: '진행상태' }, ...progressList];

    //작성자 리스트
    const writeUserRes = await NoticesAPI.getWriteUserList(NixBoardType.Nixpen5);
    if (!writeUserRes.ok) {
      toastApi.errorFromResult(writeUserRes);
      return;
    }

    const writeUserList = writeUserRes.data?.resultData?.list ?? [];
    const wuOptions = writeUserList.map((it) => ({
      codeId: it.userId ?? '',
      codeNm: it.userNm ?? '',
    }));

    writeUserOptions.value = [{ codeId: '', codeNm: '작성자' }, ...wuOptions];

    //부서 리스트
    const deptRes = await CommonAPI.getDept();
    if (!deptRes.ok) {
      toastApi.errorFromResult(deptRes);
      return;
    }

    const deptList =
      deptRes.data?.resultData?.list.filter((x) => DEPT_ALLOW_LIST.includes(x?.codeId)) ?? [];
    deptOptions.value = [{ codeId: '', codeNm: '요청부서' }, ...deptList];
    recDeptOptions.value = [{ codeId: '', codeNm: '수신부서' }, ...deptList];
  } catch (e) {
    toastApi.errorFromException(e);
  } finally {
    optionsLoading.value = false;
  }
}

// usePaginatedQueryList 훅
const { loading, items, total, page, size, keyword, init, onSearch, onReset, handlePageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    extra: {
      deptId,
      recDeptId,
      searchId,
      progressSt,
      writeUserId,
    },
    autoSearchOnExtraChange: true,
    autoSearchExclude: ['searchId'],
  });

// 리스트 API 호출
async function fetchList({
  page,
  size,
  keyword,
  searchId,
  progressSt,
  deptId,
  recDeptId,
  writeUserId,
}) {
  const params = {
    boardType: NixBoardType.Nixpen5,
    progressSt: progressSt,
    keyword: keyword || '',
    deptId: deptId,
    recDeptId: recDeptId,
    pageNum: page,
    pageSize: size,
    writeUserId: writeUserId,
    searchId: searchId,
  };

  try {
    const res = await NoticesNixpenAPI.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { items: [], total: 0 };
    }

    const list = res.data?.resultData?.list ?? [];
    const total = res.data?.resultData?.totCnt ?? list?.[0]?.totCnt ?? 0;
    return { items: list, total: Number(total) || 0 };
  } catch (e) {
    toastApi.errorFromException(e);
    return { items: [], total: 0 };
  }
}

function handleRowDetail(item) {
  const seq = item.seqCry;
  if (!seq) return;

  router.push({
    name: ROUTE.NixNotices.Nixpen5.Detail,
    query: { ...route.query, seq: String(seq) },
  });
}

const handleAddNotice = () => {
  router.push({
    name: ROUTE.NixNotices.Nixpen5.Create,
  });
};

onMounted(() => {
  getSearchOptions();
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-3">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        :loading="loading"
        :show-reset="true"
        placeholder="제목/내용"
        @submit="onSearch"
        @reset="onReset"
      >
        <template #extra-back>
          <!--ID검색-->
          <CFormInput v-model="searchId" placeholder="ID검색" size="sm" style="width: 120px" />

          <!--요청부서-->
          <CFormSelect v-model="deptId" style="width: 120px" size="sm">
            <option v-for="(opt, idx) in deptOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--수신부서-->
          <CFormSelect v-model="recDeptId" style="width: 120px" size="sm">
            <option v-for="(opt, idx) in recDeptOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--진행상태-->
          <CFormSelect v-model="progressSt" style="width: 120px" size="sm">
            <option v-for="(opt, idx) in progressOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>

          <!--작성자-->
          <CFormSelect v-model="writeUserId" style="width: 120px" size="sm">
            <option v-for="(opt, idx) in writeUserOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </template>
        <template #extra-btn>
          <CButton color="dark" size="sm" type="button" @click="handleAddNotice"
            >공지 등록
          </CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-grow-1">
    <CCardBody class="ccard-body">
      <UiDataTable
        :columns="COLUMNS"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        :row-key="(row, idx) => row.totNo ?? idx"
        @row-click="({ row }) => handleRowDetail(row)"
      >
        <template #cell-subject="{ item }">
          {{ item?.subject ?? '(제목 없음)' }}
          <CImage
            v-if="item?.createNewFlag === 'Y' || item?.modifyNewFlag === 'Y'"
            :src="newIcon"
          />
        </template>
      </UiDataTable>

      <div v-if="total > 0" class="mt-auto">
        <UiPagination
          v-model:page="page"
          v-model:size="size"
          :total="total"
          @change="handlePageChanged"
        />
      </div>
    </CCardBody>
  </CCard>
</template>
