import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/', 'eslint.config.mjs'] },
  ...eslintPluginVue.configs['flat/essential'],
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/multi-word-component-names': 'off',
      // 템플릿에서는 항상 kebab-case 속성 사용
      'vue/attribute-hyphenation': ['error', 'always'],
      // SFC 블록 순서 (선호에 맞게)
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      // 이벤트 이름 컨벤션 (kebab-case로 리스너 작성 권장)
      'vue/custom-event-name-casing': ['error', 'kebab-case'],
    },
  },
]
