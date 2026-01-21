import { client } from '../_client';
import { buildUrl } from '@/utils/url';

export const MemberAPI = {
  // 소속 정보 (회원가입시 소속리스트)
  getBranch() {
    return client.get('/api/member/common/code/branch');
  },

  // 아이디 중복체크 (회원가입)
  getDuplicationCheck(id) {
    const url = buildUrl('/api/member/duplication-check', {
      UserId: id
    });
    return client.get(url);
  },

  // 사용자 등록
  async postJoin(form) {
    return client.post('/api/member', form);
  },
};
