import { track, trigger } from "./effect";

function createGetter() {
  return function get(target, key) {
    let res = Reflect.get(target, key);
    track(target, key);
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    let res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}

const get = createGetter();
const set = createSetter();

export const mutableHandlers = {
  get,
  set,
};