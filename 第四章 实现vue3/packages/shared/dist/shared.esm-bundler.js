const isObject = (v) => typeof v === 'object' && v !== null;
const isArray = Array.isArray;
const isString = v => typeof v === 'string';
const extend = Object.assign;
const hasChange = (oldValue, newValue) => oldValue !== newValue;
const isInteger = (key) => parseInt(key) + '' === key; // 数组的下标
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

export { extend, hasChange, hasOwn, isArray, isInteger, isObject, isString };
//# sourceMappingURL=shared.esm-bundler.js.map
