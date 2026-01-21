import { client } from '../_client';
import { buildUrl } from '@/utils/url';

export const UserAPI = {
  // 로그인
  async getLogin(params) {
    const url = buildUrl('/LoginCheck', {
      UserId: params.userId,
      UserPw: params.userPw,
      DeviceToken: params.deviceToken,
      ConnectDevice: params.connectDevice,
      ConnectBrowser: params.connectBrowser,
      _ts: Date.now(), // 캐시 방지
    });
    const res = await client.get(url, { headers: { 'Cache-Control': 'no-store' } });

    if (!res.ok) return res;
    return {
      ok: true,
      status: res.status,
      data: {
        token: res.data?.tk ?? null,
        user: res.data?.userInfo ?? null,
        raw: res, // 필요하면 원본 응답도 함께 사용 가능
      },
    };
  },

  // 사용자 리스트 검색
  getGroupUsers(params) {
    const url = buildUrl('/Settings/User/GetGroupUsers', {
      UserId: params.userId,
      UserType: params.userType,
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 대리점 직원 검색
  getBranchUsers(params) {
    const url = buildUrl('/Settings/User/GetBranchUsers', {
      Branch: params.branch,
    });
    return client.get(url);
  },

  // 서비스 담당자 리스트 (서비스 담당자 지정된 유저들만)
  getServiceUsers(params) {
    const url = buildUrl('/Settings/User/GetServiceUsers', {
      MenuType: params.menuType,
    });
    return client.get(url);
  },

  // 사용자 검색 리스트 가져오기
  getUsers() {
    return client.get('/Settings/User/GetUsers');
  },

  // 대리점 직원 검색> 브랜치 코드로 넘겼을 경우에도 나오게끔(ex.김현기(branch 09 넘길경우 sys_user 09코드 없지만 아이디로 검색)
  getBranchUsersFilterEghis(params) {
    const url = buildUrl('/Settings/User/GetBranchUsersFilterEghis', {
      Branch: params.branch,
    });
    return client.get(url);
  },
};
