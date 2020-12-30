(function () {

const pending = 0;
const fulfilled = 1;
const chained = 2;

const is_function = x => typeof x === 'function';

const no_op = () => {};

function Promise(executor) {
  this.state = pending;
  this.value = undefined;
  this.handlers = [];
  executor(value => {
    if (this.state != pending) return;
    resolve(this, value);
  });
}

const resolve_or_wait = (self, handler) => {
  while (self.state === chained) {
    self = self.value;
  }
  if (self.state === pending) {
    self.handlers.push(handler);
  }
  else {
    setTimeout(() => {
      const on_fulfilled = handler.on_fulfilled;
      resolve(handler.promise, on_fulfilled === null ? self.value : on_fulfilled(self.value));
    });
  }
};

const resolve = (self, value) => {
  if (value === self) {
    throw new TypeError('A promise cannot be resolved with itself.');
  }
  self.state = value instanceof Promise ? chained : fulfilled;
  self.value = value;
  for (let i = 0, len = self.handlers.length; i < len; ++i) {
    resolve_or_wait(self, self.handlers[i]);
  }
  self.handlers = null;
};

Promise.prototype.then = function (on_fulfilled) {
  const p = new Promise(no_op);
  resolve_or_wait(this, {
    on_fulfilled: is_function(on_fulfilled) ? on_fulfilled : null
  , promise: p
  });
  return p;
};

Promise.resolve = value =>
  value instanceof Promise ?
    value :
    new Promise(resolve => resolve(value));

Promise.race = arr =>
  new Promise(resolve => {
    if (!Array.isArray(arr)) {
      throw 'Promise.race only accepts an array';
    }
    for (let i = 0, len = arr.length; i < len; ++i) {
      Promise.resolve(arr[i]).then(resolve);
    }
  });

module.exports = Promise;

})();
