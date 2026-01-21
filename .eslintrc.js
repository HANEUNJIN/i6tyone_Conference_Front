module.exports = {
  root: true,
  env: { es2022: true, browser: true, node: true },
  extends: [
    // Vue/TS 쓰면 여기에 '@vue/eslint-config-typescript' 등 추가
    'eslint:recommended',
    'prettier', // ← Prettier와 충돌나는 룰 끔
  ],
  plugins: ['simple-import-sort'],
  rules: {
    // 임포트 정렬(그룹: 외부→절대경로→상대경로)
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',

    // 연속 빈 줄 제한 & BOF/EOF 정리
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],

    // 문 사이의 의미 있는 한 줄 공백(가독성)
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: 'block-like', next: '*' },
      { blankLine: 'always', prev: '*', next: 'block-like' },
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
    ],
  },
};
