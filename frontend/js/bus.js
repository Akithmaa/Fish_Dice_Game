export const bus = (() => {
  const map = new Map();
  return {
    on: (evt, fn) => (map.has(evt) ? map.get(evt).push(fn) : map.set(evt, [fn])),
    emit: (evt, payload) => (map.get(evt) || []).forEach(fn => fn(payload))
  };
})();

