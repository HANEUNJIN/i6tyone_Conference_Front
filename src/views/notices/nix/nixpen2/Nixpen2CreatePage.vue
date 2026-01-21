<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { useApiToast } from '@/composables/useApiToast';
import { datepickerFixed, logFormData, toYmdCompact } from '@/utils/common';
import { useAuthStore } from '@/stores/auth';
import { NoticesAPI, NoticesNixpenAPI } from '@/api/notices';
import { ROUTE } from '@/constants/routeName';
import NoticeCreateCard from '@/components/notices/NoticeCreateCard.vue';
import { NixBoardType } from '@/constants';
import { CommonAPI } from '@/api/temp/common';
import Datepicker from '@vuepic/vue-datepicker';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toastApi = useApiToast();
const toast = useToast();
const modal = useConfirmModal();

const BOARD_OPTIONS = { boardType: NixBoardType.Nixpen2 };

const deptOptions = ref([]); // 요청 부서 옵션
const recDeptOptions = ref([]); // 수진 부서 옵션
const writeUserOptions = ref([]); // 작성자 옵션

const reqDept = ref(''); // 요청부서
const resDept = ref(''); // 수신부서
const endExpYmd = ref(new Date().toISOString().slice(0, 10)); // 완료요청일
const selectWriteUser = ref(''); // 담당자 지정

const form = reactive({
  subject: '', // 공지 제목
  inputType: '', // 공지 타입
  contents: '', // v-model로 바인딩
});
const files = ref([]); // 첨부파일 v-model 대상
const isSubmitting = ref(false); //중복 제출 방지용

// 검색조건 옵션 리스트
const DEPT_ALLOW_LIST = ['0076', '0077', '0078', '0079'];

async function getSearchOptions() {
  try {
    //작성자 리스트
    const writeUserRes = await NoticesAPI.getWriteUserList(BOARD_OPTIONS.boardType);
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
    console.error(e);
    toastApi.errorFromException(e);
  }
}

function validateForm(f) {
  if (!f.subject?.trim()) return '제목을 입력하세요.';
  if (!f.contents?.trim()) return '내용을 입력하세요.';
  return '';
}

function buildParams() {
  return {
    boardType: BOARD_OPTIONS.boardType,
    subject: form.subject.trim(),
    contents: form.contents || '',
    userId: selectWriteUser.value || auth?.userInfo?.userId,
    reqDept: reqDept.value,
    resDept: resDept.value,
    endExpYmd: toYmdCompact(endExpYmd.value),
    files: Array.isArray(files.value) ? files.value : [],
  };
}

function createFormData(p, { includeFiles = true } = {}) {
  const fd = new FormData();
  // 파일(여러개면 같은 키로 반복 append)
  if (includeFiles) {
    for (const file of p.files) {
      if (file) fd.append('upload', file);
    }
  }
  const append = (k, v) => fd.append(k, v ?? '');
  append('BoardType', p.boardType);
  append('Subject', p.subject);
  append('Contents', p.contents);
  append('UserId', p.userId);
  append('ReqDept', p.reqDept);
  append('ResDept', p.resDept);
  append('EndYn', 'N');
  append('EndExpYmd', p.endExpYmd);
  return fd;
}

async function handleSubmit() {
  if (isSubmitting.value) return; // 연속 클릭 방지
  const msg = validateForm(form);
  if (msg) return toast.error(msg);
  if (resDept.value === '' || reqDept.value === '') return toast.error('부서를 선택해주세요.');

  const confirm = await modal.show({
    title: '등록',
    message: '등록 하시겠습니까?',
    confirmText: '등록',
  });
  if (!confirm) return;

  try {
    isSubmitting.value = true;
    const params = buildParams();
    const formData = createFormData(params);
    logFormData(formData);

    const res = await NoticesNixpenAPI.postCreate(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('저장되었습니다.');
    handleBack();
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    isSubmitting.value = false;
  }
}

//임시저장
async function saveDraft() {
  const msg = validateForm(form);
  if (msg) return toast.error(msg);
  const confirm = await modal.show({
    title: '임시저장',
    message: `첨부파일은 임시저장에서 제외 됩니다.\n임시저장은 공지사항의 각 메뉴별로 따로 저장하게 됩니다. 저장하시겠습니까?`,
    confirmText: '저장',
  });
  if (!confirm) return;

  try {
    const params = buildParams();
    const formData = createFormData(params, { includeFiles: false }); // ← 첨부 제외
    logFormData(formData);
    const res = await NoticesAPI.postSaveDraft(formData);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('임시 저장되었습니다.');
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

// 임시저장 불러오기
async function loadDraft() {
  const confirm = await modal.show({
    title: '임시저장 불러오기',
    message: '마지막 임시저장한 내용을 불러 오겠습니까?',
    confirmText: '불러오기',
  });
  if (!confirm) return;

  try {
    const params = {
      userId: auth?.userInfo?.userId,
      boardType: BOARD_OPTIONS.boardType,
    };
    const res = await NoticesAPI.getLoadDraft(params);
    if (!res.ok) {
      toastApi.errorFromResult(res);
      return;
    }
    const subject = res.data?.resultData?.subject;
    const contents = res.data?.resultData?.contents;
    if (subject != null || contents != null) {
      form.subject = subject ?? '';
      form.contents = contents ?? '';
      toast.success('임시저장 데이터를 불러왔습니다.');
    } else {
      toast.info('임시 저장한 데이터가 없습니다.');
    }
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  }
}

function handleBack() {
  router.push({ name: ROUTE.NixNotices.Nixpen2.List, query: route.query });
}

onMounted(() => {
  getSearchOptions();
});
</script>

<template>
  <NoticeCreateCard
    v-model="form"
    v-model:files="files"
    :board-options="BOARD_OPTIONS"
    :show-subtitle="false"
    :show-visibility="false"
    :disabled="isSubmitting"
    @submit="handleSubmit"
    @cancel="handleBack"
    @save-draft="saveDraft"
    @load-draft="loadDraft"
  >
    <template #extra-fields>
      <CRow class="mb-3">
        <CCol sm="6">
          <CFormLabel>요청부서</CFormLabel>
          <CFormSelect v-model="reqDept" :disabled="isSubmitting">
            <option v-for="(opt, idx) in deptOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </CCol>
        <CCol sm="6">
          <CFormLabel>수신부서</CFormLabel>
          <CFormSelect v-model="resDept" :disabled="isSubmitting">
            <option v-for="(opt, idx) in recDeptOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </CCol>
      </CRow>
      <CRow class="mb-3">
        <CCol sm="6">
          <CFormLabel>완료요청일</CFormLabel>
          <Datepicker
            v-model="endExpYmd"
            v-bind="datepickerFixed"
            locale="ko"
            placeholder="노출날짜를 선택하세요"
            :ui="{ input: 'form-control form-control-sm' }"
          />
        </CCol>
        <CCol sm="6">
          <CFormLabel>담당자 지정</CFormLabel>
          <CFormSelect v-model="selectWriteUser" :disabled="isSubmitting">
            <option v-for="(opt, idx) in writeUserOptions" :key="idx" :value="opt.codeId">
              {{ opt.codeNm }}
            </option>
          </CFormSelect>
        </CCol>
      </CRow>
    </template>
  </NoticeCreateCard>
</template>
