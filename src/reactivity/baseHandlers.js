import { track, trigger } from "./effect";

function createGetter() {
  return function get(target, key) {
    let res = Reflect.get(target, key);
    track(target, key);
    return res;
  };
}

export const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE'
}

function createSetter() {
  return function set(target, key, value) {
    const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD

    // receiver
    let res = Reflect.set(target, key, value);
    trigger(target, key, type);
    return res;
  };
}

const get = createGetter();
const set = createSetter();

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



export const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
};