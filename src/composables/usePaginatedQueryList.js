import { ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { usePrefsStore } from '@/stores/preferences';
import { normalizeExtra } from '@/utils/queryExtra';
import { storeToRefs } from 'pinia';

/**
 * 페이징 목록 공통 훅
 * - 페이지/사이즈/키워드 + (옵션) 추가 필터들을 URL 쿼리와 동기화
 * - 새로고침/공유/뒤로가기에도 동일 상태 복원
 * - fetcher에는 표준 인자 + 추가 필터를 함께 전달
 */
export function usePaginatedQueryList(fetcher, opts = {}) {
  const {
    defaultPage = 1,
    defaultSize = 15,
    defaultKeyword = '',
    searchPushHistory = true, // 검색 시 push로 히스토리 남길지
    queryKeys = { page: 'page', size: 'size', keyword: 'keyword' },
    extra = {}, // 추가 필터(쿼리-상태 동기화 대상)
    autoSearchOnExtraChange = false,
    autoSearchExclude = [], // 자동 검색에서 제외할 extra 키 목록
    disableUrlSync = false,
  } = opts;

  const route = useRoute(); //URL 정보(쿼리 포함)
  const router = useRouter();
  const toast = useToast();
  const prefs = usePrefsStore(); // 페이지 사이즈
  const { storePageSize, setStorePageSize } = storeToRefs(prefs);

  const loading = ref(false); // 초기 1회 블로킹 로딩용
  const updating = ref(false); //  갱신용(원하면 UI에 써도 됨)
  const didFirstLoad = ref(false); // 초기 1회 여부

  const items = ref([]);
  const total = ref(0);

  // 페이지/사이즈/키워드 초기값
  // const page = ref(defaultPage);
  // const size = ref(Number(route.query[queryKeys.size]) || Number(storePageSize) || defaultSize);
  // const keyword = ref(defaultKeyword);
  const page = ref(
    disableUrlSync ? defaultPage : Number(route.query[queryKeys.page]) || defaultPage,
  );
  const size = ref(
    disableUrlSync
      ? defaultSize
      : Number(route.query[queryKeys.size]) || Number(storePageSize.value) || defaultSize,
  );
  const keyword = ref(
    disableUrlSync
      ? defaultKeyword
      : typeof route.query[queryKeys.keyword] === 'string'
        ? route.query[queryKeys.keyword]
        : defaultKeyword,
  );

  // 총 페이지 수(= 마지막 페이지)
  const maxPage = computed(() => Math.max(1, Math.ceil(total.value / size.value)));

  // 추가 필터
  const _extra = normalizeExtra(extra);
  const extraEntries = Object.entries(_extra);

  // 현재 추가 필터들의 ref 값을 키-값 객체로 취합해 fetcher에 전달
  const getExtraValues = () => {
    const o = {};
    for (const [name, cfg] of extraEntries) {
      o[name] = cfg?.ref?.value;
    }
    return o;
  };
  // URL 쿼리 → 추가 필터 ref로 복원
  const setExtraFromQuery = () => {
    if (disableUrlSync) return;
    for (const [, cfg] of extraEntries) {
      const qVal = route.query[cfg.queryKey];
      const parse = cfg.parse || ((v) => (typeof v === 'string' ? v : cfg.default));
      cfg.ref.value = parse(qVal ?? cfg.default);
    }
  };

  // 추가 필터 ref → URL 쿼리로 반영(next 객체 수정). 변경 여부를 반환
  const applyExtraToQuery = (next) => {
    if (disableUrlSync) return false;
    let changed = false;
    for (const [, cfg] of extraEntries) {
      const v = cfg.ref.value;
      const ser = cfg.serialize || ((x) => (x == null ? '' : String(x)));
      const sv = ser(v);
      const has = sv !== '' && sv != null;
      const curr = route.query[cfg.queryKey]; // 현재 쿼리의 기존 값

      if (has) {
        if (curr !== sv) changed = true; // 값이 달라지면 변경 플래그
        next[cfg.queryKey] = sv;
      } else {
        if (curr != null) changed = true; // 기존에 있었던 값을 제거하면 변경
        delete next[cfg.queryKey];
      }
    }
    return changed;
  };

  // 현재 ref 상태가 URL 쿼리와 다른지 검사(뒤로가기 등 외부 변경 감지에 사용)
  const isExtraChangedAgainstQuery = () => {
    if (disableUrlSync) return false;
    for (const [, cfg] of extraEntries) {
      const ser = cfg.serialize || ((x) => (x == null ? '' : String(x)));
      const sv = ser(cfg.ref.value) || '';
      const curr = route.query[cfg.queryKey] ?? '';
      if (String(curr) !== String(sv)) return true;
    }
    return false;
  };

  // 쿼리 → 상태 동기화(초기 진입/뒤로가기 등)
  function syncFromQuery() {
    if (disableUrlSync) {
      // URL 동기화 비활성화 시, default 값으로만 설정
      page.value = defaultPage;
      size.value = defaultSize; // 전역 스토어 사이즈는 유지
      keyword.value = defaultKeyword;
      // extra 필터도 default로 초기화
      for (const [, cfg] of extraEntries) {
        cfg.ref.value = cfg.default;
      }
      return;
    }

    const q = route.query;
    const qPage = Number(q[queryKeys.page]) || defaultPage;
    const qSize = Number(q[queryKeys.size]) || Number(storePageSize) || defaultSize;
    const qKeyword =
      typeof q[queryKeys.keyword] === 'string' ? q[queryKeys.keyword] : defaultKeyword;

    page.value = Math.max(1, qPage);
    size.value = qSize;
    keyword.value = qKeyword;

    // 추가 필터 복원
    setExtraFromQuery();
  }

  // 상태 → 쿼리 동기화(사용자 액션 시 URL 갱신)
  // - push: true면 히스토리에 남기고(push), false면 교체(replace)
  function syncToQuery({ push = false } = {}) {
    if (disableUrlSync) return;
    const next = {
      ...route.query,
      [queryKeys.page]: String(page.value),
      [queryKeys.size]: String(size.value),
    };
    // 키워드 반영(빈 값이면 쿼리에서 제거)
    if (keyword.value && keyword.value.trim()) {
      next[queryKeys.keyword] = keyword.value.trim();
    } else {
      delete next[queryKeys.keyword];
    }

    // 추가 필터를 쿼리에 반영
    const extraChanged = applyExtraToQuery(next);

    // 변경 없으면 skip
    const same =
      String(route.query[queryKeys.page] ?? String(defaultPage)) === next[queryKeys.page] &&
      String(route.query[queryKeys.size] ?? String(defaultSize)) === next[queryKeys.size] &&
      (route.query[queryKeys.keyword] ?? '') === (next[queryKeys.keyword] ?? '') &&
      !extraChanged;

    if (same) return;

    const nav = push ? router.push : router.replace;
    nav({ query: next });
  }

  // ─────────────────────────────────────────────────────────────
  // 목록 데이터 조회 (mode: 'blocking' | 'soft' | 'auto')
  // - blocking: 초기 진입 등 전체 오버레이 로딩
  // - soft: 기존 리스트 유지하며 업데이트(UX↑)
  // - auto: 최초 1회는 blocking, 이후 soft
  // ─────────────────────────────────────────────────────────────
  async function fetchList({ mode = 'auto' } = {}) {
    const isInitial = !didFirstLoad.value;
    const block = mode === 'blocking' || (mode === 'auto' && isInitial);
    const soft = mode === 'soft' || (mode === 'auto' && !isInitial);

    if (block) loading.value = true;
    if (soft) updating.value = true;

    try {
      // fetcher에는 표준 인자 + 추가 필터들을 함께 넘김
      const result = await fetcher({
        page: page.value,
        size: size.value,
        keyword: keyword.value,
        ...getExtraValues(), // 추가 필터도 함께 전달
      });
      items.value = result?.items ?? [];
      total.value = Number(result?.total ?? 0) || 0;
    } catch (e) {
      console.error(e);
      toast.error(e?.message || '목록 조회 중 오류가 발생했습니다.');
    } finally {
      if (block) loading.value = false;
      if (soft) updating.value = false;
      didFirstLoad.value = true;
    }
  }

  // 핸들러
  function onSearch() {
    page.value = 1;
    if (!disableUrlSync) {
      syncToQuery({ push: searchPushHistory });
    }

    fetchList({ mode: 'blocking' });
  }

  function onReset() {
    keyword.value = '';
    page.value = 1;
    // 추가 필터도 기본값으로 초기화
    for (const [, cfg] of extraEntries) {
      cfg.ref.value = cfg.default;
    }
    if (!disableUrlSync) {
      // URL 동기화 비활성화 시 syncToQuery 호출 안함
      syncToQuery();
    }
    fetchList({ mode: 'blocking' });
  }

  function onPageChanged({ page: p, size: s }) {
    page.value = p;
    size.value = s;
    if (!disableUrlSync) {
      // URL 동기화 비활성화 시 syncToQuery 호출 안함
      syncToQuery({ push: searchPushHistory });
    }
    fetchList({ mode: 'blocking' });
  }

  // 페이지 사이즈가 바뀌면 전역 선호에 저장(영속화)
  watch(size, (v) => {
    setStorePageSize(v);
  });

  // URL 쿼리 변경 감지(뒤로가기/앞으로가기/외부 변경)
  // 쿼리와 현재 상태가 다르면, 상태를 갱신하고 소프트 페치
  if (!disableUrlSync) {
    watch(
      () => route.query,
      (q) => {
        const newPage = Number(q[queryKeys.page]) || defaultPage;
        const newSize = Number(q[queryKeys.size]) || Number(storePageSize) || defaultSize;
        const newKw =
          typeof q[queryKeys.keyword] === 'string' ? q[queryKeys.keyword] : defaultKeyword;

        const pageChanged = newPage !== page.value;
        const sizeChanged = newSize !== size.value;
        const kwChanged = newKw !== keyword.value;
        const extraChanged = isExtraChangedAgainstQuery(); // 추가 필터들이 쿼리와 달라졌는지 비교

        if (pageChanged || sizeChanged || kwChanged || extraChanged) {
          page.value = Math.max(1, newPage);
          size.value = newSize;
          keyword.value = newKw;
          setExtraFromQuery(); // 추가 필터 복원
          fetchList({ mode: 'soft' });
        }
      },
    );
  }

  // 총 페이지 수가 줄어들면 현재 페이지를 보정(예: 삭제 등으로 마지막 페이지가 줄어든 경우)
  watch(maxPage, (newMax) => {
    if (page.value > newMax) {
      page.value = newMax;
      if (!disableUrlSync) {
        // URL 동기화 비활성화 시 syncToQuery 호출 안함
        syncToQuery();
      }
      fetchList({ mode: 'soft' });
    }
  });

  //  extra 변경 시 자동 검색(제외 목록 지원)
  // extra 변경 시 자동 검색 - disableUrlSync일 때 watch 비활성화
  if (autoSearchOnExtraChange && extraEntries.length > 0 && !disableUrlSync) {
    const refs = extraEntries
      .filter(([name]) => !autoSearchExclude.includes(name))
      .map(([, cfg]) => cfg.ref);
    if (refs.length > 0) {
      watch(refs, async () => {
        await nextTick();
        if (!isExtraChangedAgainstQuery()) {
          return;
        }
        onSearch();
      });
    }
  } else if (autoSearchOnExtraChange && extraEntries.length > 0 && disableUrlSync) {
    // disableUrlSync 일 때 extra 변경 시에도 자동 검색을 원한다면
    // 이 else if 블록을 사용하여 쿼리 관련 isExtraChangedAgainstQuery 체크를 제외하고 onSearch를 호출
    const refs = extraEntries
      .filter(([name]) => !autoSearchExclude.includes(name))
      .map(([, cfg]) => cfg.ref);
    if (refs.length > 0) {
      watch(refs, () => {
        onSearch(); // 쿼리 비교 없이 바로 검색
      });
    }
  }

  // 초기 진입용
  function init() {
    syncFromQuery(); // 진입 시 URL에서 복원
    fetchList({ mode: 'blocking' }); // 초기 진입은 blocking 1회
  }

  return {
    // 상태
    loading, // 초기 1회 로딩(오버레이)
    updating, // 이후 조용한 갱신 여부(필요시 UI에 활용)
    items,
    total,
    page,
    size,
    keyword,
    maxPage,
    // 메서드
    init,
    fetchList,
    onSearch,
    onReset,
    onPageChanged,
    syncFromQuery,
    syncToQuery,
  };
}
