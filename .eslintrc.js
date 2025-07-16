module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    globals: {
        Phaser: 'readonly'
    },
    rules: {
        // Code quality rules
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        
        // Style rules
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        
        // Best practices
        'eqeqeq': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'no-duplicate-imports': 'error',
        
        // Performance rules
        'no-loop-func': 'error',
        'no-inner-declarations': 'error'
    },
    overrides: [
        {
            files: ['tests/**/*.js'],
            env: {
                jest: true
            },
            rules: {
                'no-console': 'off'
            }
        }
    ]
};