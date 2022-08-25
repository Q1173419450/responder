import { track, trigger } from "./effect";
import { reactive, readonly } from "./reactive";

function createGetter(isReadonly = false, isShallow = false) {
  return function get(target, key, receiver) {
    if (key === 'raw') return target; // 原型相关
    let res = Reflect.get(target, key, receiver);

    /* 第一层使用 reactive */
    if (isShallow) {
      return res;
    }
  
    /* 全部使用 readonly、reactive */
    if (res !== null && typeof res === "object") {
      return isReadonly ? readonly(res) : reactive(res);
    }

    /* reactive 才需要依赖收集 */
    if(!isReadonly) {
      track(target, key);
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
  return function set(target, key, value, receiver) {
    const oldVal = target[key];
    const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD

    // console.log(target, receiver.raw, 'receiver');
    let res = Reflect.set(target, key, value, receiver);
    /* oldVal !== value 不适用 NaN */
    /* fix：添加原型相关 */
    if(target === receiver.raw) {
      /* fix: NaN */
      if (oldVal !== value && (oldVal === oldVal || value === value)) {
        trigger(target, key, type);
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
  track(target, ITERATE_KEY)
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