import { reactive } from './reactive'

export function ref(val) {
  const wrapper = {
    value: val
  }

  Object.defineProperty(wrapper, '__v_isRef', {
    value: true
  })

  return reactive(wrapper)
}

export function toRef(obj, key) {
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
  const ret = {};
  for(const key in obj) {
    ret[key] = toRef(obj, key);
  }

  return ret;
}

export function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      return value.__v_isRef ? value.value : value;
    }
  })
}