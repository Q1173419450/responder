import { reactive } from "./reactive";

export function ref(value) {
  const wrapper = {
    value: value
  }
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true
  })
  return reactive(wrapper)
}

export function toRef(obj, key) {
  /* 解决响应丢失问题 */
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(val) {
      obj[key] = val;
    }
  }
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true
  })
  return wrapper
}

export function toRefs(obj) {
  const ret = {}
  for(const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

const shallowUnwrapHandlers = {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    return unRef(res);
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    // 将新值放到 ref 的 value 中
    if (isRef(oldValue) && !isRef(value)) {
      return (oldValue.value = value);
    }
    return Reflect.set(target, key, value, receiver);
  },
};

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function isRef(value) {
  return !!value.__v_isRef;
}