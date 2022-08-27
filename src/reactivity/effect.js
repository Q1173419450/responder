import { ITERATE_KEY, TriggerType } from "./baseHandlers";

let activeEffect = void 0;
export let shouldTrack = true;

export function pauseTracking() {
  shouldTrack = false
}

export function enableTracking() {
  shouldTrack = true
}

export class ReactiveEffect {
  _fn;
  active = true;
  onStop = () => void 0;
  // 依赖的数据
  deps = [];
  constructor(fn, scheduler) {
    this._fn = fn;
  }
  run() {
    if (!this.active) return this._fn();
    shouldTrack = false;
    activeEffect = this;
    const result = this._fn();
    // 重置
    shouldTrack = true;
    activeEffect = undefined;
    return result;
  }
  stop() {
    // 反复调用 stop 优化
    if (this.active) {
      cleanupEffect(this);
      this.onStop?.(); // 停止事件
      this.active = true;
    }
  }
}

/* 
  清除副作用
*/
function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

/* 是否追踪 */
export function isTracking() {
  return (!shouldTrack || !activeEffect);
}

const targetMap = new WeakMap();

/* 
  订阅响应数据
  为什么要收集？
  数据模式：xxx？
*/
export function track(target, key) {
  // if(isTracking()) return;
  // target => key => deps
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  trackEffect(dep);
}

/* 
  将当前活跃的数据，添加 dep 依赖
*/
export function trackEffect(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

/* 
  发布响应数据，触发更新
  为什么要发布
  数据模型：xxx？
*/
export function trigger(target, key, type, newVal) {
  let depsMap = targetMap.get(target);
  if (!depsMap) return;
  let deps = depsMap.get(key);
  
  /* 添加新的 effect */
  const effectToRun = new Set();
  deps && deps.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn);
    }
  })
  
  // console.log(target, key, type);

  /* 监听索引添加长度 */
  // if (type === TriggerType.ADD && Array.isArray(target)) {
  //   const lengthEffects = depsMap.get('length');
  //   lengthEffects && lengthEffects.forEach(effectFn => {
  //     if (effectFn !== activeEffect) {
  //       deps.add(effectFn);
  //     }
  //   })
  // }

  if (Array.isArray(target) && key === 'length') {
    depsMap.forEach((effects, key) => {
      console.log(depsMap, key, newVal);
      if (key >= newVal) {
        effects.forEach(effectFn => {
          if (effectFn !== activeEffect) {
            effectToRun.add(effectFn);
          }
        })
      }
    })
  }

  /* for...in add、DELETE 操作 */
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    const iterateEffects = depsMap.get(ITERATE_KEY)
    iterateEffects && iterateEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectToRun.add(effectFn);
      }
    })
  }
  triggerEffects(effectToRun, type);
}

/* 
  执行副作用
*/
export function triggerEffects(effects) {
  for (const effect of effects) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}


export function effect(fn, options) {
  let _effect = new ReactiveEffect(fn);
  if(options) {
    Object.assign(_effect, options); // 合并 effect 和 options
  }
  _effect.run();

  /* 返回的 runner, 提供给外部自由调用 */
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}