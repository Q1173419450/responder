import { enableTracking, pauseTracking, shouldTrack, track, trigger } from "./effect";
import { reactive, readonly } from "./reactive";


/* 重写 includes、indexOf、lastIndexOf */
const arrayInstrumentations = {};
['includes', 'indexOf', 'lastIndexOf'].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function(...args) {
    let res = originMethod.apply(this, args)
    if (res === false) {
      /* 第一次查找为 false，再去查找原生对象 */
      console.log(this.raw);
      res = originMethod.apply(this.raw, args);
    }
    return res
  }
});

/* 修改数组的原型方法 */
['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  const originMethod = Array.prototype[method];
  arrayInstrumentations[method] = function(...args) {
    pauseTracking()
    let res = originMethod.apply(this, args)
    enableTracking()
    return res;
  }
})

function createGetter(isReadonly = false, isShallow = false) {
  return function get(target, key, receiver) {
    if (key === 'raw') return target; // 原型相关
    let res = Reflect.get(target, key, receiver);

    /* 修改数组操作使用重写的方法 */
    if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
    
    /* reactive 才需要依赖收集 */
    /* for...of: 类型为 symbol 则不追踪 */
    if(!isReadonly && typeof key !== 'symbol') {
      track(target, key);
    }

    /* 第一层使用 reactive */
    if (isShallow) {
      return res;
    }
  
    /* 全部使用 readonly、reactive */
    if (res !== null && typeof res === "object") {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

export const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE'
}

function createSetter() {
  return function set(target, key, newVal, receiver) {
    const oldVal = target[key];
    
    /* 
      数组：判断用索引更改的数据是否大于原数组长度
      对象：判断是否原来有对应数据
    */
   /* 
    Fix：如果单纯判断数组长度的话，直接修改 length 会造成不必要更新
    arr = [1] arr.length = 100 只需要修改新增的
   */
    const type = Array.isArray(target) ? 
      (Number(key) < target.length ? TriggerType.SET : TriggerType.ADD) : 
      Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD

    let res = Reflect.set(target, key, newVal, receiver);
    /* oldVal !== value 不适用 NaN */
    /* fix：添加原型相关 */
    if(target === receiver.raw) {
      /* fix: NaN */
      if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
        trigger(target, key, type, newVal);
      }
    }
    return res;
  };
}

/* in 操作: 使用 has */
function has(target, key) {
  track(target, key);
  return Reflect.has(target, key)
}

/* for...in: 使用 ownKeys */
export const ITERATE_KEY = Symbol();
function ownKeys(target) {
  /* 遍历数组只需要监听数组长度变化 */
  const key = Array.isArray(target) ? 'length' : ITERATE_KEY
  track(target, key)
  return Reflect.ownKeys(target)
}

function deleteProperty(target, key) {
  const hadKey = Object.prototype.hasOwnProperty.call(target, key);
  const res = Reflect.deleteProperty(target, key);

  if (res && hadKey) {
    trigger(target, key, TriggerType.DELETE);
  }
  return res;
}

/* reactive */
const get = createGetter();
const set = createSetter();
export const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
};

/* shallowReactive */
const shallowGet = createGetter(false, true)
const shallowSet = createSetter()
export const shallowReactiveHandlers = Object.assign({}, mutableHandlers, {
  get: shallowGet,
  set: shallowSet
})

/* readonly */
const readonlyGet = createGetter(true);
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  },
  deleteProperty(target, key) {
    console.warn(
      `Delete operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  }
}

/* shallowReadOnly */
const shallowReadonlyGet  = createGetter(true, true);
export const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});