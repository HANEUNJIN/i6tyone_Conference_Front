<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  formatPhoneKR,
  buildEqualPattern,
  PHONE_KR_PATTERN,
  onlyDigits,
  logFormData,
} from '@/utils/common';
import { MemberAPI } from '@/api/temp/member';
import { useToast } from '@/composables/useToast';
import { useConfirmModal } from '@/composables/useConfirmModal';
import { cilUser } from '@coreui/icons';
import { useImageUpload } from '@/composables/useImageUpload';
import { useApiToast } from '@/composables/useApiToast';
import { ROUTE } from '@/constants/routeName';

const router = useRouter();
const toastApi = useApiToast();
const toast = useToast();
const modal = useConfirmModal();

const wasValidated = ref(false);
const submitting = ref(false);

const optionBranch = ref([{ value: '', label: '선택' }]);
const optionSpot = [
  { value: '', label: '선택' },
  { value: '00', label: '대표이사' },
  { value: '01', label: '사장' },
  { value: '02', label: '이사' },
  { value: '03', label: '부장' },
  { value: '04', label: '차장' },
  { value: '05', label: '과장' },
  { value: '06', label: '대리' },
  { value: '07', label: '주임' },
  { value: '08', label: '사원' },
  { value: '09', label: '본부장' },
  { value: '10', label: '프로(선임)' },
  { value: '11', label: '프로' },
];

const form = reactive({
  id: '',
  password: '',
  password2: '',
  name: '',
  phone: '',
  email: '',
  branch: '',
  position: '',
});

const photoPreview = ref(null); // ★ 미리보기 URL

// 전화 입력 포맷팅
function onPhoneInput(e) {
  const formatted = formatPhoneKR(e.target.value);
  form.phone = formatted;
  e.target.value = formatted;
}

const confirmPattern = computed(() => buildEqualPattern(form.password));

// 소속 정보
async function getMemberBranch() {
  try {
    const { ok, data, error } = await MemberAPI.getBranch();
    if (!ok || !data || data.resultCd !== 0) {
      throw new Error(error?.message || '네트워크 오류');
    }

    const list = data?.resultData?.list ?? [];
    const options = list.map((it) => ({
      value: it.codeId ?? '',
      label: it.codeNm ?? '',
    }));

    optionBranch.value = [{ value: '', label: '선택' }, ...options];
  } catch (e) {
    console.error(e);
    toast.error(e?.message || '소속 정보를 불러오지 못했습니다.');
  }
}
// 이미지 업로드
const photo = useImageUpload();
const fileInputRef = ref(null);
onMounted(() => photo.setInputEl(fileInputRef.value));
// 검증 에러를 토스트로 노출 (선택)
watch(
  () => photo.error.value,
  (msg) => {
    if (msg) toast.error(msg);
  },
);

// FormData 생성
function joinFormData(f) {
  const fd = new FormData();
  if (photo.file.value) fd.append('upload', photo.file.value);
  fd.append('UserId', (f.id || '').trim());
  fd.append('UserNm', (f.name || '').trim());
  fd.append('Branch', f.branch || '');
  fd.append('Spot', f.position || '');
  fd.append('Phone', onlyDigits(f.phone));
  fd.append('Email', (f.email || '').trim());
  fd.append('UserPw', f.password || '');
  fd.append('Auth', '');
  fd.append('Flag', 'N');
  return fd;
}

// 회원가입
async function onSubmit(e) {
  const el = e.currentTarget;
  if (!el.checkValidity()) {
    e.stopPropagation();
    wasValidated.value = true;
    return;
  }

  wasValidated.value = true;
  submitting.value = true;
  try {
    // 확인 모달
    const confirm = await modal.show({
      title: '회원가입',
      message: '회원가입을 하시겠습니까?',
      confirmText: '가입',
    });
    if (!confirm) {
      submitting.value = false;
      return;
    }
    // 아이디 중복 체크
    const checkData = await MemberAPI.getDuplicationCheck(form.id);
    if (!checkData.ok || !checkData.data?.resultCd !== 0) {
      toastApi.errorFromResult(checkData, '중복 확인 실패');
      return;
    }

    if (checkData.data.resultData.duplicCheck === 'Y') {
      toast.error('중복된 아이디 입니다.');
      return;
    }
    // 가입요청
    const formData = joinFormData(form);
    logFormData(formData);
    const res = await MemberAPI.postJoin(formData);
    if (!res.ok || !res.data || res.data.resultData === 0) {
      toastApi.errorFromResult(res);
      return;
    }

    toast.success('가입되었습니다.');
    await router.replace({ name: ROUTE.Auth.Login });
  } catch (e) {
    console.error(e);
    toastApi.errorFromException(e);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  getMemberBranch();
});
</script>

<template>
  <div class="bwrapper min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="9">
          <CCard class="mx-4">
            <CCardBody class="p-4">
              <CForm novalidate :validated="wasValidated" @submit.prevent="onSubmit">
                <h1>회원 가입</h1>
                <p class="text-body-secondary">
                  회원 가입 후 관리자 승인이 있어야 사용 가능합니다. (가입 후 손신철프로에게 승인
                  요청 해주세요).
                </p>

                <!-- 사진 업로드 -->
                <div class="photo-item">
                  <div class="photo-container">
                    <div class="img">
                      <CImage v-if="photo.preview.value" :src="photo.preview.value" />
                      <CIcon v-else :icon="cilUser" class="icon" />
                    </div>
                    <label
                      v-if="!photo.preview.value"
                      class="add-btn btn btn-outline-secondary btn-sm"
                    >
                      <input
                        ref="fileInputRef"
                        type="file"
                        accept="image/*"
                        @change="photo.onChange"
                      />
                      <span>사진 등록</span>
                    </label>
                    <CButton
                      v-else
                      color="secondary"
                      variant="outline"
                      size="sm"
                      @click="photo.remove()"
                    >
                      사진 삭제
                    </CButton>
                  </div>
                </div>

                <!-- 아이디 -->
                <CInputGroup class="mb-2">
                  <CInputGroupText>아이디</CInputGroupText>
                  <CFormInput
                    v-model.trim="form.id"
                    name="id"
                    placeholder="ID"
                    required
                    minlength="4"
                    maxlength="20"
                    pattern="[A-Za-z0-9_\-]{4,20}"
                    autocomplete="username"
                  />
                  <CFormFeedback invalid>아이디는 영문/숫자/(_ -)만, 4~20자입니다.</CFormFeedback>
                </CInputGroup>

                <!-- 비밀번호 -->
                <CInputGroup class="mb-2">
                  <CInputGroupText>비밀번호</CInputGroupText>
                  <CFormInput
                    v-model="form.password"
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                  />
                  <CFormFeedback invalid>비밀번호는 8자 이상이어야 합니다.</CFormFeedback>
                </CInputGroup>

                <!-- 비밀번호 확인: password와 완전 동일해야 함 -->
                <CInputGroup class="mb-2">
                  <CInputGroupText>비밀번호 확인</CInputGroupText>
                  <CFormInput
                    v-model="form.password2"
                    type="password"
                    name="password2"
                    placeholder="Repeat password"
                    required
                    :pattern="confirmPattern"
                    autocomplete="new-password"
                  />
                  <CFormFeedback invalid>비밀번호가 일치하지 않습니다.</CFormFeedback>
                </CInputGroup>

                <!-- 이름 -->
                <CInputGroup class="mb-2">
                  <CInputGroupText>이름</CInputGroupText>
                  <CFormInput v-model.trim="form.name" name="name" placeholder="name" required />
                  <CFormFeedback invalid>이름을 입력하세요.</CFormFeedback>
                </CInputGroup>

                <!-- 연락처 -->
                <CInputGroup class="mb-2">
                  <CInputGroupText>연락처</CInputGroupText>
                  <CFormInput
                    v-model.trim="form.phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    required
                    :pattern="PHONE_KR_PATTERN"
                    inputmode="numeric"
                    maxlength="13"
                    @input="onPhoneInput"
                  />
                  <CFormFeedback invalid>형식: 010-1234-5678</CFormFeedback>
                </CInputGroup>

                <!-- 이메일 -->
                <CInputGroup class="mb-2">
                  <CInputGroupText>E-mail</CInputGroupText>
                  <CFormInput
                    v-model.trim="form.email"
                    name="email"
                    type="email"
                    placeholder="abc@example.co.kr"
                    required
                  />
                  <CFormFeedback invalid>올바른 이메일 주소를 입력하세요.</CFormFeedback>
                </CInputGroup>

                <!-- 소속 -->
                <CInputGroup class="mb-2">
                  <CInputGroupText>소속</CInputGroupText>
                  <CFormSelect v-model="form.branch" name="branch" aria-label="소속" required>
                    <option
                      v-for="(opt, idx) in optionBranch"
                      :key="opt.value || idx"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </CFormSelect>
                  <CFormFeedback invalid>소속을 선택하세요.</CFormFeedback>
                </CInputGroup>

                <!-- 직책 -->
                <CInputGroup class="mb-4">
                  <CInputGroupText>직책</CInputGroupText>
                  <CFormSelect v-model="form.position" name="position" aria-label="직책" required>
                    <option
                      v-for="(opt, idx) in optionSpot"
                      :key="opt.value || idx"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </CFormSelect>
                  <CFormFeedback invalid>직책을 선택하세요.</CFormFeedback>
                </CInputGroup>

                <div class="d-flex flex-column gap-2">
                  <CButton color="primary" type="submit" size="lg" :disabled="submitting"
                    >회원가입</CButton
                  >
                  <CButton color="secondary" type="button" size="lg" @click="router.back()"
                    >취소</CButton
                  >
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<style scoped>
.input-group-text {
  font-size: 12px;
  width: 120px;
}
.photo-item {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.photo-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  gap: 5px;
}

.photo-container .add-btn input {
  display: none;
}
.photo-container .img {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #dedede;
  border-radius: 50%;
  overflow: hidden;
}
.photo-container .img .icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: auto;
}
.photo-container .img img {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}
</style>
