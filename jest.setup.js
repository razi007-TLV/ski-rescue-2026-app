import '@testing-library/jest-dom'

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  let counter = 0;
  globalThis.crypto.randomUUID = () => {
    counter++;
    return `test-uuid-${counter.toString().padStart(4, '0')}`;
  };
}

window.confirm = jest.fn(() => true);
window.alert = jest.fn();
