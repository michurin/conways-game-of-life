module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true,
  },
  extends: [
    'airbnb',
  ],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  rules: {
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'max-len': ['error', { code: 200 }],
    'max-classes-per-file': ['error', 4],
    'no-restricted-properties': 'off', // es2016
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never', // es2017
    }],
  },
};
