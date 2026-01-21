<script setup></script>
<template>
  <div class="loading"><CSpinner /></div>
</template>
<style scoped>
.loading {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  background-color: rgba(255, 255, 255, 0.5);
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 1000;
}
</style>
