import { client } from '@/api/_client';
import { buildUrl } from '@/utils/url';

export const EtcbizCommon = {
  // procCode 목록
  getProcCodeList(params) {
    const url = buildUrl('/api/etcbusi/proctype/combo/list', {
      ProcType: params.procType,
      MenuType: params.menuType,
    });
    return client.get(url);
  },
};
