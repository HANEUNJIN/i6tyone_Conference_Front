<script setup>
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getDeviceToken, getConnectDevice, getConnectBrowser } from '@/utils/client';
import { ROUTE } from '@/constants/routeName';
import { useToast } from '@/composables/useToast';

import logoUrl from '@/assets/images/common/logo.png';
import UiLoading from '@/components/ui/UiLoading.vue';

const toast = useToast();
const id = ref('sonshinchul');
const password = ref('eghis2013!@1');
const loading = ref(false);

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const onSubmit = async () => {
  const params = {
    userId: id.value,
    userPw: password.value,
    deviceToken: getDeviceToken(),
    connectDevice: getConnectDevice(),
    connectBrowser: getConnectBrowser(),
  };

  try {
    loading.value = true;
    const res = await auth.login(params); // /LoginCheck 호출, token/user 저장

    if (true) {
      const redirect = route.query.redirect;
      await router.replace(
        typeof redirect === 'string' ? { path: redirect } : { name: ROUTE.Dashboard.Home },
      );
    }
  } catch (e) {
    console.error(e);
    const serverMsg = e?.error?.message || e?.message;
    toast.error(serverMsg || '아이디 또는 비밀번호를 다시 입력해주세요.');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="d-flex min-vh-100 justify-content-center align-items-center">
    <CCol md="4">
      <CImage align="center" :src="logoUrl" width="250" />
      <CCard class="p-4">
        <CCardBody style="position: relative">
          <div class="loading" v-if="loading">
            <UiLoading />
          </div>
          <CForm @submit.prevent="onSubmit">
            <h2>Login</h2>
            <p class="text-body-secondary">
              회원 가입 후 관리자 승인이 있어야 사용 가능합니다.
              <RouterLink to="/join">[회원가입]</RouterLink>
            </p>
            <CInputGroup class="mb-3">
              <CInputGroupText>
                <CIcon icon="cil-user" />
              </CInputGroupText>
              <CFormInput v-model="id" placeholder="아이디" autocomplete="id" />
            </CInputGroup>
            <CInputGroup class="mb-4">
              <CInputGroupText>
                <CIcon icon="cil-lock-locked" />
              </CInputGroupText>
              <CFormInput
                v-model="password"
                type="password"
                placeholder="비밀번호"
                autocomplete="password"
              />
            </CInputGroup>
            <CRow>
              <CButton type="submit" :disabled="loading" color="primary" class="px-4">
                Login
              </CButton>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>
    </CCol>
  </div>
</template>

<style scoped>
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}
</style>
