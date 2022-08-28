# 具体的响应式方案

## 总结第四章

简单实现了一个 副作用 与 响应式数据 的类，做到数据变化触发到副作用的重新执行

定义了响应式的基本结构

new Proxy()、get、set、track、trigger、options

## 本章概括

本篇将会更加细节的完善响应式系统，使其能适应更多的数据结构。例如：深层次对象、数组、Map、Set 等

上一章的响应式缺失什么？

- 更细节的 Object 处理
  - 访问属性
  - 判断对象或者原型是否在给定的 key 上: key in obj
  - 使用 for...in 循环遍历对象时: for(const key in obj)
- 响应和浅响应
  - reactive
  - shallowReactive
- 只读和浅只读
  - readonly
  - shallowReadonly
- 代理数组
  - get
    - 索引访问：arr[0]
    - 访问长度：arr.length
    - for...in、for...of 循环
    - 原型方法：concat、join、every、some、find、findIndex、includes
  - set
    - 通过索引修改元素：arr[1] = 1;
    - 直接修改数组长度：arr.length = 0
    - 修改数组方法：push、pop、shift、unshift、splice、fill、sort
- Map 和 Set

## 1、更细节的 Object 处理

### 访问属性

直接代理到 get 方法，则可以访问属性并，收集对应对象的依赖

```js
new Proxy(obj, {
  get(target, key) {
    let res = Reflect.get(target, key);
    track(target, key);
    return res;
  };
})
```

### 判断对象或者原型是否在给定的 key 上: key in obj

key in obj 的主要作用：判断值是否在对象上

api：[[hasProperty]] 内部方法名叫 has

```js
new Proxy(obj, {
  has(target, key) {
    track(target, key);
    return Reflect.has(target, key)
  }
})
```

### 使用 for...in 循环遍历对象时: for(const key in obj)

对象自身拥有的键

api：ownKeys

```js
// for...in 的专属 key
const ITERATE_KEY = Symbol();
new Proxy(obj, {
  ownKeys(target) {
    track(target, ITERATE_KEY)
    return Reflect.ownKeys(target)
  }
})
```

为什么需要传递唯一的 key 呢？

因为 for...in 这种形式没有与任何值进行绑定，所以需要传递唯一的 key 进行标识

#### 对象遍历属性的隐式影响

##### 新增属性

当我们对对象进行新增操作时，对应的 effect 不执行，所以当我们新增操作想要重新触发 effect 执行 for...in 操作时，我们就需要将对应的副作用加入到队列中，进行执行

```js
// main.js
const obj3 = reactive({ foo: 1 });
effect(() => {
  /* for in 算是读取数据，执行了一次 track */
  for(const key in obj3) {
    console.log(key, obj3[key]);
  }
})
obj3.bar = 2;


// effect.js
// 添加对应的 effect 到 执行队列中
const iterateEffects = depsMap.get(ITERATE_KEY)
iterateEffects && iterateEffects.forEach(effectFn => {
  if (effectFn !== activeEffect) {
    effectToRun.add(effectFn);
  }
})
```

##### 修改属性

当我们不管对象是否有新增属性，就直接添加时，又是有问题的，因为当我只是修改对象而没有新增属性，effect 又会执行。

这时候我们可以在 set 进行一个属性是否存在的判断，并添加是 ADD 还是 SET 的标识，就可以区分出这两种操作

```js
const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
}
//baseHandlers.js
const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD
trigger(target, key, type);

// effect.js
if (type === TriggerType.ADD) {
  const iterateEffects = depsMap.get(ITERATE_KEY)
  iterateEffects && iterateEffects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn);
    }
  })
}
```

##### 删除属性

删除属性首先我们需要先代理删除

key：[[Delete]] 内部方法为 deletePropery

```js
// baseHandlers.js
const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE'
}

function deleteProperty(target, key) {
  const hadKey = Object.prototype.hasOwnProperty.call(target, key);
  const res = Reflect.deleteProperty(target, key);

  /* 
    1. 删除的是对象拥有的
    2. res 返回正常才行（可能失败）例如：不是 superReference、删除状态 等
  */
  if (res && hadKey) {
    trigger(target, key, TriggerType.DELETE);
  }
  return res;
}

// effect.js
if (type === TriggerType.ADD || type === TriggerType.DELETE) {
  const iterateEffects = depsMap.get(ITERATE_KEY)
  iterateEffects && iterateEffects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn);
    }
  })
}
```

## 2、合理触发响应

我们需要优化我们的响应式系统

### 值没变化不触发更新

当值没发生变化，不触发 trigger

```js
function createSetter() {
  return function set(target, key, value, receiver) {
    const oldVal = target[key];
    const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD

    let res = Reflect.set(target, key, value, receiver);
    // 值相同不触发更新
    if (oldVal !== value) {
      trigger(target, key, type);
    }
    return res;
  };
}
```

### 处理 NaN 特殊清楚

因为 NaN 的特殊性，自己和自己比较为 false，所以我们把值和自身比较

```js
function createSetter() {
  return function set(target, key, value, receiver) {
    const oldVal = target[key];
    const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD

    let res = Reflect.set(target, key, value, receiver);
    // 都不是 NaN 的时候才触发响应
    if (oldVal !== value && (oldVal === oldVal || value === value)) {
      trigger(target, key, type);
    }
    return res;
  };
}
```

### 原型操作

当设置原型并进行访问时属性时，访问顺序会顺着原型链不断的查找下去，直到找到为止，但这会导致 副作用 会触发过多次，这时候就需要针对的进行优化

这时候 Proxy 的第四个参数就发挥了他的作用 receiver：**确定他的原型是其他对象还是自己**

```js
// main.js
const obj1 = {};
const proto = { bar: 1 }
const child = reactive(obj1);
const parent = reactive(proto);
Object.setPrototypeOf(child, parent);

effect (() => {
  console.log(child.bar);
})

child.bar = 2;

// baseHandlers.js
function createGetter() {
  return function get(target, key, receiver) {
    if (key === 'raw') return target; // 原型相关: 设置原始数据
    let res = Reflect.get(target, key, receiver);
    track(target, key);
    return res;
  };
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const oldVal = target[key];
    const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD

    console.log(target, JSON.stringify(receiver.raw), 'receiver');
    let res = Reflect.set(target, key, value, receiver);
    + if(target === receiver.raw) {
      if (oldVal !== value && (oldVal === oldVal || value === value)) {
        trigger(target, key, type);
      }
    }
    return res;
  };
}
```

## 3、浅响应 和 深响应 & 只读 和 浅只读

从 Vue3 暴露的 API 出发，设计源码

### 浅响应 和 深响应

#### 深响应 Reactive

当我们需要监听深层次对象时，就需要对 set 进行对象判断

```js
// 收集响应时
// 判断是否还是对象，进行一个递归处理
if (res !== null && typeof res === "object") {
  return reactive(res);
}
```

#### 浅响应 shallowReactive

在收集依赖时，给定一个参数，判断是否只收集第一层属性

### 只读 和 浅只读

数据只读，不能修改

#### 只读 readOnly

收集依赖时，还是像 Reactive 一样对依赖递归收集，给定一个 readonly 判定值，set、deleteProperty 值时进行，给一个 warn 进行拦截

```js
if (res !== null && typeof res === "object") {
  return isReadonly ? readonly(res) : reactive(res);
}
```

#### 浅只读 shallowReadonly

则是和 浅响应 一样，使用 isShallow 进行拦截

## 4、代理数组

## 5、Map 和 Set

### 寻找共同点，api 来看

### 如何代理

1、与普通对象之间的差异

使用 size 进行访问长度时，会报错。size 的 this 指向代理对象，代理对象不存在内部槽 `[[SetData]]`

为什么原始值有内部槽，而代理对象没有呢？

通过修改 get 的 receiver 来进行 this 指向的改变

删除数据时，删除数据使用的是方法

```js
p.delete(1)

return target[key].bind(target)
```

2、建立响应式联系

当我们操作 API 时，就需要进行依赖的收集，例如: add、delete

3、map get、set 的代理

4、处理 forEach

5、迭代器 entries、keys、value

entries 是获取 key 和 value

keys 是获取 key

value 获取 value

所以响应式对象就需要根据他们的方法定义进行重写，达到代理迭代器的效果

## 6、ref

ref 是用来弥补 reactive 的一些缺陷而诞生的，reactive 我们知道是代理引用类型，而原始类型，reactive 无法代理

1、代理原始值

简单的构造一个函数，返回一个带 value 的对象，做到限制用户不胡乱使用

2、引用类型的响应丢失问题

```js
// 响应会丢失，因为 log 中解构出来为普通对象
const obj = reactive({ foo: 1 })
console.log(...obj)
```