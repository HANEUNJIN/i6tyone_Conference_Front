<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

import UiReplyEditor from '@/components/ui/UiReplyEditor.vue';
import { CFormTextarea } from '@coreui/vue';

const props = defineProps({
  modelValue: { type: String, default: '' }, //새 댓글 입력 v-model
  replyList: { type: Array, required: true }, //댓글 목록
});

const emit = defineEmits([
  'update:modelValue', // v-model update
  'add-reply',         // 새 댓글 등록
  'submit-reply',      // 대댓글 등록
  'delete-reply'       // 댓글 삭제
]);

const auth = useAuthStore();

//현재 열려있는 입력창 상태: key는 'p-부모ID' 또는 'r-대댓글ID'
const editorKey = ref(null);
const editorParentId = ref(null); // 등록 시 사용할 부모 댓글 id
const replyDraft = ref({}); // { [editorKey]: '텍스트' }

const replyText = computed({
  get: () => props.modelValue,                // 부모 → 자식
  set: (v) => emit('update:modelValue', v),   // 자식 → 부모
});

//새 댓글 등록
const addReply = () => {
  emit('add-reply');
}

//댓글 삭제
const deleteReply = (reply) => {
  emit('delete-reply', reply);
}

//대댓글 등록
const submitReply = (reply) => {
  const content = replyDraft.value[editorKey.value];
  if (!content.trim())
    return;

  emit('submit-reply', { reply, content });
  replyDraft.value[editorKey.value] = '';
  editorKey.value = null;
}

//댓글창 열기
const openReply = (reply) => {
  editorKey.value = `p-${reply.ord}`;
  replyDraft.value[editorKey.value] = '';
}

//댓글창 취소
const cancelReply = () => {
  if (editorKey.value)
    delete replyDraft.value[editorKey.value];

  editorKey.value = null;
  editorParentId.value = null;
}
</script>

<template>
  <CCard class="mt-3">
    <CCardHeader>
      <h6 class="mb-0">
        댓글
        <CBadge color="info" shape="rounded-pill">
          {{ replyList.length }}
        </CBadge>
      </h6>
    </CCardHeader>
    <CCardBody>
      <!-- 댓글 목록 -->
      <CListGroup class="mb-3" v-if="replyList.length">
        <CListGroupItem
          v-for="reply in replyList"
          :key="reply.ord"
          :class="{ 'reply-reply': reply.pUserId !== null }"
        >
          <!-- 댓글 헤더 -->
          <div
            class="d-flex justify-content-between align-items-start pt-1 pb-1"
            :class="{ 'border-start ms-4 ps-3': reply.pUserId !== null }"
          >
            <div>
              <strong class="me-2">{{ reply.userNm }}</strong>
              <small class="text-body-secondary">{{ reply.regDt }}</small>
              <div v-if="reply.pUserNm !== null">@{{ reply.pUserNm }}</div>
              <div class="mt-2">
                <p
                  v-if="reply.contents"
                  v-html="reply.contents.replace(/\n/g, '<br>')"
                  class="mb-0 white-space-pre-line"
                />
                <p v-else class="mb-0 white-space-pre-line text-muted">내용없음</p>
              </div>
            </div>
            <div class="ms-3 d-flex gap-2 text-nowrap">
              <CButton color="secondary" variant="outline" size="sm" @click="openReply(reply)"
              >답글</CButton
              >
              <CButton
                v-if="auth.userInfo.userId === reply.userId"
                color="danger"
                variant="outline"
                size="sm"
                @click="deleteReply(reply)"
              >삭제</CButton
              >
            </div>
          </div>

          <!-- 댓글 아래 입력창 -->
          <div
            v-if="editorKey === `p-${reply.ord}`"
            class="mt-2"
            :class="{ 'ms-4 ps-3': reply.pUserId !== null }"
          >
            <UiReplyEditor
              v-model="replyDraft[editorKey]"
              @submit="submitReply(reply)"
              @cancel="cancelReply()"
            />
          </div>
        </CListGroupItem>
      </CListGroup>

      <!-- 새 댓글 입력 -->
      <CRow>
        <CCol sm="auto" class="mt-2"
        ><strong>{{ auth?.userInfo.userNm }}</strong>
        </CCol>
        <CCol class="flex-grow-1">
          <CFormTextarea v-model="replyText" rows="3" placeholder="댓글을 입력하세요" />
        </CCol>
        <CCol sm="auto">
          <CButton color="primary" @click="addReply">등록</CButton>
        </CCol>
      </CRow>
    </CCardBody>
  </CCard>
</template>

<style scoped>
.white-space-pre-line {
  white-space: pre-line;
}

.reply-reply {
  background-color: var(--cui-gray-100);
}

[data-coreui-theme='dark'] .reply-reply {
  background-color: var(--cui-gray-700);
}
</style>
