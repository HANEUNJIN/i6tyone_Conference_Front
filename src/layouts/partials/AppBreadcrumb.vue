<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ROUTE } from '@/constants/routeName';

const route = useRoute();

// 1) matched → meta.title 있는 것만 추출
const matchedCrumbs = computed(() => {
  return route.matched
    .filter((r) => r.meta && r.meta.title)
    .map((r) => {
      // 현재 라우트의 params를 그대로 넘겨서 동적 경로도 정상 이동
      const to = r.name ? { name: r.name, params: route.params } : undefined;
      return { label: r.meta.title, to };
    });
});

// 2) HOME 첨부 + 마지막 항목은 비활성(링크 제거)
const items = computed(() => {
  const home = { label: 'HOME', to: { name: ROUTE.Dashboard.Home } };
  const crumbs = [home, ...matchedCrumbs.value];
  if (crumbs.length) crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], to: undefined };
  return crumbs;
});
</script>

<template>
  <CBreadcrumb class="my-0">
    <CBreadcrumbItem v-for="(item, i) in items" :key="i" :active="!item.to">
      <RouterLink v-if="item.to" :to="item.to" class="text-decoration-none">
        {{ item.label }}
      </RouterLink>
      <span v-else>{{ item.label }}</span>
    </CBreadcrumbItem>
  </CBreadcrumb>
</template>
