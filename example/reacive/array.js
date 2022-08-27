import { effect, reactive } from '../../lib/mini-vue.esm.js';
// const obj = reactive(['foo']);
// effect(() => {
//   console.log(obj[0]);
// })

// obj.length = 0;

// const obj = {};
// const arr = reactive([obj]);
// // effect(() => {
// // })
// console.log(arr.includes(obj));

const arr = reactive([]);
effect(() => {
  arr.push(1);
})
effect(() => {
  arr.push(1);
})

console.log(arr);