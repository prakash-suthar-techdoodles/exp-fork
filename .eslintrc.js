module.exports = {
    extends: ['expensify', 'plugin:storybook/recommended', 'plugin:react-hooks/recommended'],
    plugins: ['react-hooks'],
    parser: 'babel-eslint',
    ignorePatterns: ['!.*', 'src/vendor', '.github/actions/**/index.js', 'desktop/dist/*.js', 'dist/*.js', 'node_modules/.bin/**', '.git/**'],
    env: {
        jest: true,
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: [
                    '.js',
                    '.website.js',
                    '.desktop.js',
                    '.native.js',
                    '.ios.js',
                    '.android.js',
                    '.config.js',
                ],
            },
        },
    },
    overrides: [
        {
            files: ['workflow_tests/**/*.js'],
            rules: {
                '@lwc/lwc/no-async-await': 'off',
            },
        },
    ],
    globals: {
        __DEV__: 'readonly',
    },
};
