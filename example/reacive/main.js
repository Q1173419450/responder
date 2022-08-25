import { effect, reactive } from '../../lib/mini-vue.esm.js';

/* 1.基础版本 */
// let obj = reactive({ foo: 0 });
// let newObj;

// const runner = effect(() => {
//   newObj = obj.foo + 1;
//   return 'haha'
// })

// console.log(newObj);
// obj.foo++
// console.log(newObj, obj);

/* 2.in、for...in 改、增、删 */
// const obj2 = reactive({ foo: 'test in' });
// effect(() => {
//   console.log('bar' in obj2);
// })

// /* 利用 Reflect.has 进行监听 */
// obj2.bar = 2;
// console.log('-----------------------------');

const obj3 = reactive({ foo: 1 });
effect(() => {
  /* for in 算是读取数据，执行了一次 track */
  for(const key in obj3) {
    console.log(key, obj3[key]);
  }
})

/* 新增数据因为没有被 trigger 到，所以不会执行 effect */
obj3.bar = 2;
/* 修改属性则不需要触发更新 */
// obj3.foo = 3;
// delete obj3.bar;