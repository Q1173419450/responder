import { effect, reactive } from '../../lib/mini-vue.esm.js';

// const s = new Set([1, 2, 3]);
// const p = reactive(s);

// effect(() => {
//   console.log(p.size);
// })

// 属性的 error
// console.log(p.size); // error: Method get Set.prototype.size called on incompatible receiver
// 方法执行时的 error
// console.log(p.delete(1));  // error: Method get Set.prototype.size called on incompatible receiver
// p.add(1)

/* === 污染原始数据？ === */
// const m = new Map();
// const p1 = reactive(m);
// const p2 = reactive(new Map());
// p1.set('p2', p2);

// /* 访问的是原始对象，不应该调用副作用 */
// effect(() => {
//   console.log(m.get('p2').size)
// })

// m.get('p2').set('foo', 1);

/* ===== forEach ===== */
// const map = new Map([[{key: 1}, {value: 1}]])
// effect(() => {
//   map.forEach((value, key, m) => {
//     console.log(value);
//     console.log(key);
//   })
// })

/* === 迭代器 entries、keys、value === */

// const m = new Map([
//   ['key1', 'value1'],
//   ['key2', 'value2']
// ])

// for (const [key, value] of m.entries()) {
//   console.log(key, value)
// }

// const itr = m.entries()
// console.log(itr.next())
// console.log(itr.next())
// console.log(itr.next())

// console.log(m[Symbol.iterator] === m.entries)

// const p = reactive(new Map([
//   ['key1', 'value1'],
//   ['key2', 'value2']
// ]))

// effect(() => {
//   console.log(p.size);
//   // TypeError: p.entries is not a function or its return value is not iterable 不可迭代
//   for(const [key, value] of p.entries()) {
//     console.log(key, value);
//   }
// })

// p.set('key3', 'value3');

/* ------------- keys ------------------ */

const p1 = reactive(new Map([
  ['key1', 'value1'],
  ['key2', 'value2']
]))

effect(() => {
  for (const key of p1.keys()) {
    console.log(key)
  }
})

p1.set('key3', 'value3')

/* ---------- values ------------------ */
// const p2 = reactive(new Map([
//   ['key1', 'value1'],
//   ['key2', 'value2']
// ]))

// effect(() => {
//   for (const value of p2.values()) {
//     console.log(value)
//   }
// })