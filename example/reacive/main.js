import { effect, reactive } from '../../lib/mini-vue.esm.js';

let obj = reactive({ foo: 0 });
let newObj;

const runner = effect(() => {
  newObj = obj.foo + 1;
  return 'haha'
})

console.log(newObj);
obj.foo++
console.log(newObj, obj);