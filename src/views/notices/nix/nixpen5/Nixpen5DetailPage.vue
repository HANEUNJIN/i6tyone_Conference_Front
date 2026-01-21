<script setup>
import { ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { NoticesNixpenAPI, NoticesAPI } from '@/api/notices';
import { useToast } from '@/composables/useToast';
import { useApiToast } from '@/composables/useApiToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { ROUTE } from '@/constants/routeName';

import NoticeDetailCard from '@/components/notices/NoticeDetailCard.vue';
import NoticeProgressStatusCard from '@/components/notices/NoticeProgressStatusCard.vue';
import CommentCard from '@/components/nixpens/CommentCard.vue';

import { CommonAPI } from '@/api/temp/common';
import { formatYmd, logFormData, toYmdCompact } from '@/utils/common';

const props = defineProps({
  seq: { type: String, required: true },
});

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const toastApi = useApiToast();
const modal = useConfirmModal();

const progressOptions = ref([]); // 진행 상태 옵션

// 진행상태 폼(단일 객체로 통합)
const progressForm = ref({
  progressSt: '', // 진행상태 코드
  devExpYmd: '', // 개발예정일
  progressModYmd: '', // 처리일
  devNonReason: '', // 개발불가 사유
  devNonQcYn: 'N', // QC 승인
  devNonMarketYn: 'N', // 마케팅 승인
  devNonBonbuYn: 'N', // 본부장 승인
  smsSendChk: 'Y', // SMS 전송여부(Y:전송, N:미전송)
});

const detail = ref(null); // 상세 정보
const loading = ref(false); // 상세 본문용 로딩 (스피너)
const isDeleting = ref(false); // 삭제 시

const files = ref([]); // 첨부 리스트

//개발 진행상태 리스트
async function getProgressOptions() {
  try {
    const progressRes = await CommonAPI.getCode('A39');
    if (!progressRes.ok) {
      toastApi.errorFromResult(progressRes);
      return;
    }

    const progressList = progressRes.data?.resultData?.list ?? [];
    progressOptions.value = [{ codeId: '', codeNm: '진행상태' }, ...progressList];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 공지 상세(게시글 정보)
async function fetchDetail() {
  if (!props.seq) return;

  try {
    loading.value = true;
    // 상세 정보
    const res = await NoticesNixpenAPI.getDetail({
      seq: props.seq,
    });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }
    detail.value = res.data?.resultData ?? null;

    progressForm.value.devNonReason = String(detail.value?.devNonReason ?? '');
    progressForm.value.progressSt = String(detail.value?.progressStDev ?? '');
    progressForm.value.devExpYmd = formatYmd(String(detail.value?.devExpYmd, '-')) ?? '';
    progressForm.value.progressModYmd =
      formatYmd(String(detail.value?.progressModYmd, '-')) || new Date().toISOString().slice(0, 10);
    progressForm.value.devNonQcYn = String(detail.value?.devNonQcYn ?? 'N');
    progressForm.value.devNonBonbuYn = String(detail.value?.devNonBonbuYn ?? 'N');
    progressForm.value.devNonMarketYn = String(detail.value?.devNonMarketYn ?? 'N');

    // 첨부파일 조회
    const filesRes = await NoticesAPI.getListFiles({ seq: props.seq });
    if (filesRes.ok) {
      files.value = filesRes.data?.resultData?.list ?? [];
    } else {
      toastApi.errorFromResult(filesRes, '첨부파일 조회 실패');
      return;
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    loading.value = false;
  }
}

// 파일 다운로드
async function handleDownloadFile(file) {
  if (!file?.seq || !file?.fileSeq) return;

  try {
    const res = await NoticesAPI.handleDownloadFile({
      seq: file.seq,
      fileSeq: file.fileSeq,
    });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.oriFileName || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 진행상태 저장
async function handleSaveProgress() {
  if (progressForm.value.progressSt === 'A3902' && detail.value?.devNonApplyYn !== 'Y') {
    return toast.error('개발불가 요청에 대한 승인이 안되었습니다.');
  }

  if (progressForm.value.progressSt === 'A3903' && devExpYmd.value === '') {
    return toast.error('개발 예정일을 입력 해주세요.');
  }

  if (progressForm.value.progressSt === 'A3908' && String(devNonReason.value).trim() === '') {
    return toast.error('개발불가 요청 사유를 입력해주세요.');
  }

  const confirm = await modal.show({
    title: '진행상태',
    message: '저장 하시겠습니까?',
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    const params = {
      seqCry: props.seq,
      userId: auth.userInfo.userId,
      progressStDev: progressForm.value.progressSt,
      progressModYmd: toYmdCompact(progressForm.value.progressModYmd),
      devExpYmd: toYmdCompact(progressForm.value.devExpYmd),
      devNonReason: progressForm.value.devNonReason,
      devNonQcYn: progressForm.value.devNonQcYn,
      devNonMarketYn: progressForm.value.devNonMarketYn,
      devNonBonbuYn: progressForm.value.devNonBonbuYn,
      smsSendChk: progressForm.value.smsSendChk,
    };

    const res = await NoticesNixpenAPI.putProgressModify(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장되었습니다.');
    await fetchDetail();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 승인
async function handleDevApplyProgress() {
  const notAllApproved = ![
    progressForm.value.devNonQcYn,
    progressForm.value.devNonMarketYn,
    progressForm.value.devNonBonbuYn,
  ].every((v) => v === 'Y');

  if (notAllApproved) return toast.error('승인 처리시 각 부서의 체크 박스가 체크 되어야 합니다.');

  const confirm = await modal.show({
    title: '개발요청사항 게시판 2본부 수정 불가 요청 승인 처리',
    message: '승인 처리 하시겠습니까?',
    confirmText: '승인',
  });
  if (!confirm) return;

  try {
    const params = {
      seqCry: props.seq,
      userId: auth.userInfo.userId,
    };
    const res = await NoticesNixpenAPI.putApply(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    detail.value.devNonApplyYn = 'Y';
    toast.success('승인 되었습니다.');
    await fetchDetail();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 삭제하기
async function handleDelete() {
  const ok = await modal.show({
    title: '삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '삭제',
  });
  if (!ok) return;

  try {
    isDeleting.value = true;

    const res = await NoticesAPI.delete({
      seq: props.seq,
    });
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('삭제되었습니다.');
    handleGoBackToList();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isDeleting.value = false;
  }
}

// 뒤로가기
function handleGoBackToList() {
  router.push({ name: ROUTE.NixNotices.Nixpen5.List, query: route.query }); // 목록 쿼리 유지 복귀
}

// 수정하기
function handleModify() {
  router.push({
    name: ROUTE.NixNotices.Nixpen5.Modify,
    query: { ...route.query, seq: String(props.seq) },
  });
}
/** ─────────────────────────────────────────────────────────────
 * 댓글 관련
 * ──────────────────────────────────────────────────────────── */
// 댓글 상태
const replyList = ref([]);
const replyText = ref('');

// 현재 열려있는 입력창 상태: key는 'p-부모ID' 또는 'r-대댓글ID'
const editorKey = ref(null);
const editorParentId = ref(null); // 등록 시 사용할 부모 댓글 id
const replyDraft = ref({}); // { [editorKey]: '텍스트' }

// 댓글 리스트
async function fetchReply() {
  try {
    const params = { seq: props.seq };
    const res = await NoticesNixpenAPI.getReplyList(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    replyList.value = res.data?.resultData.list ?? [];
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 부모 댓글 등록
async function handleAddReply() {
  const text = replyText.value?.trim();
  if (!text) {
    toast.error('댓글 내용을 입력해주세요.');
    return;
  }

  const confirm = await modal.show({
    title: '댓글',
    message: '등록 하시겠습니까?',
    confirmText: '등록',
  });
  if (!confirm) return;

  try {
    const fd = new FormData();
    fd.append('SeqCry', props.seq);
    fd.append('GroupId', 0);
    fd.append('UserId', auth.userInfo.userId);
    fd.append('Contents', replyText.value);
    logFormData(fd);

    const res = await NoticesNixpenAPI.postReplyCreate(fd);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장 되었습니다.');
    replyText.value = '';
    await fetchReply();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 답글 등록(editorKey, editorParentId 기준)
async function handleSubmitReply({ reply, content }) {
  if (!content?.trim()) return toast.error('내용을 입력해주세요.');

  const confirm = await modal.show({
    title: '댓글',
    message: '등록 하시겠습니까?',
    confirmText: '등록',
  });
  if (!confirm) return;

  try {
    const fd = new FormData();
    fd.append('SeqCry', reply.seqCry);
    fd.append('Ord', reply.ord);
    fd.append('GroupId', reply.groupId);
    fd.append('UserId', auth.userInfo.userId);
    fd.append('PUserId', reply.userId);
    fd.append('Contents', content);
    logFormData(fd);

    const res = await NoticesNixpenAPI.postReplyCreate(fd);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장 되었습니다.');
    replyText.value = '';
    await fetchReply();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }

  cancelReply();
}

// 입력창 취소
function cancelReply() {
  if (editorKey.value) {
    delete replyDraft.value[editorKey.value];
  }
  editorKey.value = null;
  editorParentId.value = null;
}

// 댓글 삭제
async function handleDeleteReply(reply) {
  const confirm = await modal.show({
    title: '댓글 삭제',
    message: '삭제 하시겠습니까?',
    confirmText: '삭제',
  });
  if (!confirm) return;

  try {
    const params = {
      Seq: reply.seq,
      GroupId: reply.groupId,
      Ord: reply.ord,
    };
    const res = await NoticesNixpenAPI.deleteReply(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('삭제 되었습니다.');
    await fetchReply();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

watch(
  () => props.seq,
  async () => {
    if (!props.seq) return;
    await fetchDetail();
    await getProgressOptions();
    await fetchReply();
  },
  { immediate: true },
);
</script>

<template>
  <NoticeDetailCard
    :detail="detail"
    :files="files"
    :loading="loading"
    :show-back="true"
    :show-edit="true"
    :show-delete="true"
    @back="handleGoBackToList"
    @edit="handleModify"
    @delete="handleDelete"
    @download="handleDownloadFile"
  >
    <template #meta>
      <p>
        <strong>ID</strong> : {{ detail?.seq }} <br />
        <strong>요청부서</strong> : {{ detail.reqDeptNm }}<br />
        <strong>수신부서</strong> : {{ detail.resDeptNm }}<br />
        <strong>완료요청일</strong> : {{ detail.endExpYmd }}
      </p>
    </template>
  </NoticeDetailCard>

  <!-- 진행상태 -->
  <NoticeProgressStatusCard
    :progress-options="progressOptions"
    :detail="detail"
    v-model:form="progressForm"
    @save="handleSaveProgress"
    @apply="handleDevApplyProgress"
  />

  <!-- 댓글  -->
  <CommentCard
    v-model="replyText"
    :reply-list="replyList"
    @add-reply="handleAddReply"
    @submit-reply="handleSubmitReply"
    @delete-reply="handleDeleteReply"
  />
</template>
