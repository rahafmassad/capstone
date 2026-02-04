const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    extends: ['expo'],
    ignores: ['node_modules/**', '.expo/**', 'dist/**'],
  },
]);
