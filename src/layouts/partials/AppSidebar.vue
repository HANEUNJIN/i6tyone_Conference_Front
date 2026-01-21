<script setup>
import { computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useSidebarStore } from '@/stores/sidebar.js';
import { useBaseStore } from '@/stores/base';
import { AppSidebarNav } from '@/layouts/partials/AppSidebarNav.js';
import { AppSidebarNavNix } from '@/layouts/partials/AppSidebarNavNix.js';

import i6tyone from '@/assets/images/i6tyone_logo.svg';
import { ROUTE } from '@/constants/routeName';

const router = useRouter();
const sidebar = useSidebarStore();
const base = useBaseStore();

// 현재 선택 라벨을 스토어(storeMenuType)
const selectedLabel = computed(() => (base.storeMenuType === 'N' ? '닉스차트' : '이지스차트'));

function selectChart(type) {
  // type: 'E' | 'N'
  base.setStoreMenuType(type);
  base.setStoreHospName('');
  base.setStoreHospCd('');
  base.setStoreLicenseCd('');
  router.push({ name: ROUTE.Dashboard.Home });
}
</script>

<template>
  <CSidebar
    class="border-end"
    color-scheme="dark"
    position="fixed"
    :unfoldable="sidebar.unfoldable"
    :visible="sidebar.visible"
    @visible-change="(value) => sidebar.toggleVisible(value)"
  >
    <CSidebarHeader class="border-bottom">
      <RouterLink to="/" class="logo">
        <CImage :src="i6tyone"/>
      </RouterLink>
      <CCloseButton class="d-lg-none" dark @click="sidebar.toggleVisible()" />
    </CSidebarHeader>

<!--    <CDropdown class="p-2" direction="center">-->
<!--      <CDropdownToggle color="primary" variant="outline">{{ selectedLabel }} </CDropdownToggle>-->
<!--      <CDropdownMenu class="dropdown-menu-dark dropdown">-->
<!--        <CDropdownItem component="button" @click="selectChart('E')">이지스차트</CDropdownItem>-->
<!--        <CDropdownItem component="button" @click="selectChart('N')">닉스차트</CDropdownItem>-->
<!--      </CDropdownMenu>-->
<!--    </CDropdown>-->

    <AppSidebarNav v-if="base.storeMenuType === 'E'" />
    <AppSidebarNavNix v-else />
  </CSidebar>
</template>

<style scoped>
.logo {
  display: flex;
  margin: 0 auto;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.logo span {
  color: #fff;
  font-size: 18px;
}
</style>

<style>
.sidebar-nav .compact .nav-link {
  color: rgba(255, 255, 255, 0.5);
}
.sidebar-nav .nav-link.active,
.sidebar-nav .nav-link:hover {
  color: #fff;
}
.dropdown {
  width: calc(100% - 16px);
}
.dropdown .dropdown-item {
  cursor: pointer;
}
</style>
