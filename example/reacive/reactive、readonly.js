import { effect, reactive, shallowReactive, readonly, shallowReadonly } from '../../lib/mini-vue.esm.js';

/* reactive */
const reactivity = reactive({ foo: { bar: 1 } })

effect(() => {
  console.log('reactive', reactivity.foo.bar)
})
reactivity.foo.bar++;

/* shallowReactive */
const shallowReactivity = shallowReactive({ foo: { bar: 1 } })
effect(() => {
  console.log('shallowReactive', shallowReactivity.foo.bar)
})
shallowReactivity.foo.bar++;

/* readonly */
// const read = readonly({ foo: { bar: 1 } })
// effect(() => {
//   console.log('readonly', read.foo.bar)
// })
// read.foo.bar++;

/* shallowReadonly */
const shallowRead = shallowReadonly({ foo: { bar: 1 } })
effect(() => {
  console.log('shallowReadonly', shallowRead.foo.bar)
})
shallowRead.foo = { test: 'change' };