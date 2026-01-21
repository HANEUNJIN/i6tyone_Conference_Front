<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePaginatedQueryList } from '@/composables/usePaginatedQueryList';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useAuthStore } from '@/stores/auth';
import { NixBoardType } from '@/constants';
import { NoticesAPI } from '@/api/notices';
import UiDataTable from '@/components/ui/UiDataTable.vue';
import UiSearchBar from '@/components/ui/UiSearchBar.vue';
import UiPagination from '@/components/ui/UiPagination.vue';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();

const columns = [
  { key: 'totNo', label: '순번', width: '7%' },
  { key: 'inputTypeNm', label: '공지타입', width: '10%' },
  { key: 'subject', label: '제목', width: '30%', align: 'left' },
  { key: 'readCnt', label: '조회수', width: '10%' },
  { key: 'readYn', label: '읽음여부', width: '10%' },
  { key: 'userNm', label: '작성자', width: '10%' },
  { key: 'regDt', label: '작성일', width: '10%' },
];

const fetchList = async ({ page, size, keyword }) => {
  const params = {
    id: auth.userInfo.userId,
    boardType: NixBoardType.TipAndEtc,
    branch: auth.userInfo.branch,
    keyword: keyword,
    pageNum: page,
    pageSize: size,
  };

  try {
    const res = await NoticesAPI.getList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return { item: [], total: 0 };
    }

    const { list = [], totCnt } = res.data?.resultData ?? {};
    const total = Number(totCnt ?? list[0]?.totCnt ?? 0);

    return { items: list, total };
  } catch (e) {
    toastApi.errorFromException(e);
  }
};

const { loading, items, total, page, size, keyword, init, onSearch, onPageChanged } =
  usePaginatedQueryList(fetchList, {
    defaultKeyword: '',
    searchPushHistory: true,
    queryKeys: { page: 'page', size: 'size', keyword: 'keyword' },
    autoSearchOnExtraChange: true,
  });

const handleAddClick = () => {
  router.push({ name: ROUTE.NixNotices.Etc.Create });
};

const handleRowClick = (row) => {
  if (!row.seq) return;

  router.push({
    name: ROUTE.NixNotices.Etc.Detail,
    query: { ...route.query, seq: String(row.seqCry) },
  });
};

onMounted(() => {
  init();
});
</script>

<template>
  <!-- 검색 -->
  <CCard class="mb-2">
    <CCardBody>
      <UiSearchBar
        v-model="keyword"
        placeholder="제목,내용"
        :loading="loading"
        :show-reset="false"
        @submit="onSearch"
      >
        <template #extra-btn>
          <CButton type="button" size="sm" color="dark" @click="handleAddClick"> 등록 </CButton>
        </template>
      </UiSearchBar>
    </CCardBody>
  </CCard>

  <!-- 목록 -->
  <CCard class="flex-fill">
    <CCardBody class="ccard-body">
      <UiDataTable
        :columns="columns"
        :items="items"
        :loading="loading"
        :row-clickable="true"
        @row-click="({ row }) => handleRowClick(row)"
      />

      <div v-if="total > 0" class="mt-auto">
        <UiPagination
          v-model:page="page"
          v-model:size="size"
          :total="total"
          @change="onPageChanged"
        />
      </div>
    </CCardBody>
  </CCard>
</template>
