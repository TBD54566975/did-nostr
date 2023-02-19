module.exports = {
  parser        : '@typescript-eslint/parser',
  parserOptions : {
    ecmaVersion : 'latest',
    sourceType  : 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  env: {
    node    : true,
    browser : true
  },
  rules: {
    'curly'  : ['error', 'all'],
    'indent' : [
      'error',
      2
    ],
    'object-curly-spacing' : ['error', 'always'],
    'linebreak-style'      : [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single',
      { 'allowTemplateLiterals': true }
    ],
    '@typescript-eslint/semi' : ['error', 'always'],
    'semi'                    : ['off'],
    'no-multi-spaces'         : ['error'],
    'no-trailing-spaces'      : ['error'],
    'max-len'                 : ['error', { 'code': 150, 'ignoreStrings': true }],
    'key-spacing'             : [
      'error',
      {
        'align': {
          'beforeColon' : true,
          'afterColon'  : true,
          'on'          : 'colon'
        }
      }
    ],
    'keyword-spacing'                                  : ['error', { 'before': true, 'after': true }],
    '@typescript-eslint/explicit-function-return-type' : ['error'],
    'no-unused-vars'                                   : 'off',
    '@typescript-eslint/no-unused-vars'                : [
      'error',
      {
        'vars'               : 'all',
        'args'               : 'after-used',
        'ignoreRestSiblings' : true,
        'argsIgnorePattern'  : '^_',
        'varsIgnorePattern'  : '^_'
      }
    ],
  }
};