import { buildUrl } from '@/utils/url';
import { client } from '@/api/_client';

export const PsyApi = {
  // 정신과 문진 사용 정보
  getList(params) {
    const url = buildUrl('/api/psy/price/month/list', {
      DateMonth: params.dateMonth,
      PageNum: params.pageNum,
      PageSize: params.pageSize,
    });
    return client.get(url);
  }
}
