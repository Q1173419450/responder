import {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

const reactiveMap = new Map();
export function reactive(target) {
  const existionProxy = reactiveMap.get(target);
  if (existionProxy) return existionProxy

  const proxy = createReactiveObject(target, mutableHandlers);
  reactiveMap.set(target, proxy);

  return proxy
}

export function shallowReactive(target) {
  return createReactiveObject(target, shallowReactiveHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyHandlers);
}

function createReactiveObject(target, baseHandlers) {
  const proxy = new Proxy(target, baseHandlers);
  return proxy;
}