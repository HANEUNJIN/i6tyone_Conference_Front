<script setup>
import staff from '@/assets/images/staff.png';
</script>

<template>
  <CCard class="mb-3">
    <CCardHeader>
      <p class="fw-bold mb-0">등록팀 STAFF 조직도</p>
    </CCardHeader>

    <CCardBody>
      <CImage :src="staff" />
    </CCardBody>
  </CCard>
</template>
