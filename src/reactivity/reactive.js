import {
  mutableHandlers,
} from "./baseHandlers";

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers);
}

function createReactiveObject(target, baseHandlers) {
  const proxy = new Proxy(target, baseHandlers);
  return proxy;
}