export function toTypeString(val) {
  return Object.prototype.toString.call(val);
}

export const isMap = (val) => toTypeString(val) === '[object Map]'