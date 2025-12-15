const fs = require('fs');
const vm = require('vm');

class ClassList {
  constructor(element) {
    this.element = element;
    this.set = new Set();
  }

  _sync() {
    this.element.className = Array.from(this.set).join(' ');
  }

  add(...tokens) {
    tokens.forEach((token) => this.set.add(token));
    this._sync();
  }

  remove(...tokens) {
    tokens.forEach((token) => this.set.delete(token));
    this._sync();
  }

  contains(token) {
    return this.set.has(token);
  }
}

class Element {
  constructor(id = null) {
    this._id = id;
    this.tagName = 'div';
    this.className = '';
    this.classList = new ClassList(this);
    this.listeners = {};
    this._innerHTML = '';
  }

  set id(value) {
    this._id = value;
    documentStub._elements[value] = this;
  }

  get id() {
    return this._id;
  }

  set innerHTML(value) {
    this._innerHTML = value;

    if (value.includes('id="age-confirm"') && !documentStub._elements['age-confirm']) {
      documentStub._elements['age-confirm'] = new Element('age-confirm');
    }

    if (value.includes('id="age-deny"') && !documentStub._elements['age-deny']) {
      documentStub._elements['age-deny'] = new Element('age-deny');
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  click() {
    (this.listeners['click'] || []).forEach((handler) => handler());
  }
}

const documentStub = {
  _elements: {},
  readyState: 'complete',
  body: new Element('body'),
  createElement(tagName) {
    const element = new Element();
    element.tagName = tagName;
    return element;
  },
  getElementById(id) {
    return this._elements[id] || null;
  },
  addEventListener() {
    // no-op for testing
  },
};

documentStub.body.classList = new ClassList(documentStub.body);
documentStub.body.prepend = (el) => {
  documentStub.body.prepended = el;
};

const localStorageStub = (() => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    clear: () => store.clear(),
  };
})();

function runScriptWithEnvironment({ existingGate = false, ageVerified = false } = {}) {
  documentStub._elements = {};
  documentStub.body.prepended = undefined;
  documentStub.body.classList = new ClassList(documentStub.body);
  localStorageStub.clear();

  if (ageVerified) {
    localStorageStub.setItem('ageVerified', 'true');
  }

  if (existingGate) {
    const gate = new Element('age-gate');
    gate.classList.add('hidden');
    documentStub._elements['age-confirm'] = new Element('age-confirm');
    documentStub._elements['age-deny'] = new Element('age-deny');
    documentStub._elements['age-gate'] = gate;
  }

  const context = {
    console,
    document: documentStub,
    window: {},
    localStorage: localStorageStub,
    navigator: { userAgent: 'node' },
    location: { href: 'http://localhost/' },
  };

  context.window = context;
  context.window.document = documentStub;
  context.window.localStorage = localStorageStub;
  context.window.location = context.location;
  context.self = context.window;
  context.globalThis = context.window;

  const scriptContent = fs.readFileSync('./age-verification.js', 'utf-8');
  vm.runInNewContext(scriptContent, context);

  return {
    gate: documentStub._elements['age-gate'] || null,
    confirm: documentStub._elements['age-confirm'] || null,
    deny: documentStub._elements['age-deny'] || null,
    location: context.location,
    storage: localStorageStub,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Existing gate becomes visible
(() => {
  const { gate } = runScriptWithEnvironment({ existingGate: true });
  assert(gate, 'Gate should exist');
  assert(!gate.classList.contains('hidden'), 'Gate should be shown when not previously verified');
})();

// Test 2: Gate is created when missing
(() => {
  const { gate } = runScriptWithEnvironment();
  assert(gate, 'Gate should be created when missing');
  assert(!gate.classList.contains('hidden'), 'Created gate should be visible');
  assert(documentStub.body.prepended === gate, 'Gate should be prepended to the body');
})();

// Test 3: Confirmation sets storage and hides gate
(() => {
  const { gate, confirm } = runScriptWithEnvironment();
  assert(confirm, 'Confirm button should exist');
  confirm.click();
  assert(localStorageStub.getItem('ageVerified') === 'true', 'Age verification should be saved');
  assert(gate.classList.contains('hidden'), 'Gate should hide after confirmation');
})();

// Test 4: Deny redirects away
(() => {
  const { deny, location } = runScriptWithEnvironment();
  assert(deny, 'Deny button should exist');
  deny.click();
  assert(location.href !== 'http://localhost/', 'Deny should change the location');
})();

// Test 5: Skip when already verified
(() => {
  const { gate } = runScriptWithEnvironment({ existingGate: true, ageVerified: true });
  assert(gate.classList.contains('hidden'), 'Gate should stay hidden when already verified');
})();

console.log('All age verification scenarios passed.');
