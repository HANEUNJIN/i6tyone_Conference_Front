// 일관된 네이밍을 위한 상수
export const ROUTE = Object.freeze({
  Auth: {
    Login: 'Auth.Login',
    Join: 'Auth.Join',
  },
  Dashboard: {
    Home: 'Dashboard.Home',
  },
  // 컨퍼런스
  Conference: {
    Conference: {
      DashBoard: 'Conference.conference.DashBoard',
      List: 'Conference.conference.List',
      CheckIn: 'Conference.conference.CheckIn',
      Create: 'Conference.conference.Create',
      Modify: 'Conference.conference.Modify',
      SelectZone: 'Conference.conference.SelectZone',
      EventUs: 'Conference.conference.EventUs',
    },
  },
  /** ─────────────────────────────────────────────────────────────
   * Page
   * ──────────────────────────────────────────────────────────── */
  Pages: {
    _404: 'Page404',
    _500: 'Page500',
  },
});
