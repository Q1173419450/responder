import pkg from './package.json';
export default {
  input: './src/reactivity/index.js',
  output: [
    // cjs
    {
      format: 'cjs',
      file: pkg.main
    },
    // esm
    {
      format: 'es',
      file: pkg.module
    },
  ]
}