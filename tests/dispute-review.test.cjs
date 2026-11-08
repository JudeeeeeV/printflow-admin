const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const dispute = (changes = {}) => ({
  id: 'order-12345678', current_receipt_id: 'receipt-current', state: 'OPEN_INQUIRY',
  payment_method: 'GCASH', payment_status: 'DISPUTED', acceptance_status: 'PENDING',
  total: 50, created_at: '2026-11-08T00:00:00Z', shops: { name: 'Test shop' },
  payment_receipts: [{ id: 'receipt-current', reference_number: 'REF-1', receipt_url: 'https://example.test/receipt?token=one' }],
  ...changes,
});
const text = node => node == null ? '' : typeof node !== 'object' ? String(node)
  : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
  ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];

// Run the real page's handlers with deterministic hooks and network responses.
// Browser layout and image decoding are outside this focused regression suite.
function fixture() {
  const hooks = [], requests = [], posts = [], listeners = new Map(), timers = [];
  let cursor, effects, tree, dirty = false, refresh, invalidations = 0, focuses = 0;
  const document = {
    body: { style: { overflow: 'auto' } },
    activeElement: { isConnected: true, focus() {} },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
  };
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[index].value, next => {
        const value = typeof next === 'function' ? next(hooks[index].value) : next;
        if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useCallback(fn, deps) {
      const index = cursor++;
      if (!hooks[index] || !sameDeps(hooks[index].deps, deps)) hooks[index] = { value: fn, deps };
      return hooks[index].value;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!hooks[index] || !sameDeps(hooks[index].deps, deps)) effects.push(() => {
        hooks[index]?.cleanup?.();
        hooks[index] = { deps, cleanup: fn() };
      });
    },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/pages/dashboard/DisputesPage.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, document, Error,
    window: { setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {} },
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
      if (name === 'framer-motion') return { motion: { div: 'div' }, AnimatePresence: 'presence' };
      if (name === 'axios') return { __esModule: true, default: { isAxiosError: () => false, post: (...args) => {
        const request = deferred(); posts.push({ args, ...request }); return request.promise;
      } } };
      if (name.endsWith('/TableSkeleton')) return { TableSkeleton: 'skeleton' };
      if (name.endsWith('/AlertModal')) return { AlertModal: 'notice' };
      if (name.endsWith('/runtime')) return { ADMIN_API_URL: 'https://example.test/admin' };
      if (name.endsWith('/useDataEvents')) return { useDataEvents: (_resources, fn) => { refresh = fn; } };
      if (name.endsWith('/cachedGet')) return {
        cachedGet() { const request = deferred(); requests.push(request); return request.promise; },
        invalidateAdminCache() { invalidations++; },
      };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  const render = () => {
    let renders = 0;
    do {
      if (++renders > 20) throw new Error('Render did not settle');
      dirty = false; cursor = 0; effects = [];
      tree = exports.DisputesPage();
      for (const node of nodes(tree)) if (node.props?.ref && !node.props.ref.current) {
        node.props.ref.current = { focus() { focuses++; }, querySelectorAll: () => [] };
      }
      effects.forEach(fn => fn());
    } while (dirty);
  };
  const find = predicate => nodes(tree).find(predicate);
  const button = label => find(node => node.type === 'button' && (text(node).trim() === label || node.props['aria-label'] === label));
  const flush = async () => { await new Promise(resolve => setImmediate(resolve)); render(); };
  render(); timers.splice(0).forEach(fn => fn());
  return {
    render, flush, find, button, document, listeners, requests, posts,
    text: () => text(tree), focuses: () => focuses, invalidations: () => invalidations,
    refresh: () => refresh(),
    async respond(index, rows) { requests[index].resolve(rows); await flush(); },
    async fail(index, message = 'Refresh unavailable') { requests[index].reject(new Error(message)); await flush(); },
    open() { button('Review Case').props.onClick(); render(); },
    confirm() { find(node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: true } }); render(); },
    loadImage() { find(node => node.type === 'img').props.onLoad(); render(); },
    imageError() { find(node => node.type === 'img').props.onError(); render(); },
  };
}

async function opened(order = dispute()) {
  const f = fixture();
  await f.respond(0, [order]); f.open(); await f.respond(1, [order]);
  return f;
}
const approve = 'Verify disputed payment';

test('newer refresh wins and stale successes or failures cannot replace it', async () => {
  const f = await opened();
  f.refresh(); f.refresh();
  await f.respond(3, [dispute({ total: 80 })]);
  await f.respond(2, [dispute({ total: 10 })]);
  assert.match(f.text(), /Amount Due: ₱80/);
  f.refresh(); f.refresh();
  await f.respond(5, [dispute({ total: 90 })]);
  await f.fail(4);
  assert.match(f.text(), /Amount Due: ₱90/);
  assert.equal(f.find(node => node.type === 'notice').props.isOpen, false);
});

test('background refresh errors retain the current dialog, data, reason and focus', async () => {
  const f = await opened();
  f.find(node => node.type === 'textarea').props.onChange({ target: { value: 'Transfer does not match' } }); f.render();
  const focusCount = f.focuses();
  f.refresh(); await f.fail(2);
  assert.ok(f.find(node => node.props?.role === 'dialog'));
  assert.equal(f.find(node => node.type === 'skeleton'), undefined);
  assert.equal(f.find(node => node.type === 'textarea').props.value, 'Transfer does not match');
  assert.equal(f.focuses(), focusCount);
  assert.equal(f.find(node => node.type === 'notice').props.title, 'Refresh failed');
});

test('stable evidence survives polling and renewed signed URLs without resetting confirmation', async () => {
  const f = await opened(); f.loadImage(); f.confirm();
  const focusCount = f.focuses();
  f.refresh(); await f.respond(2, [dispute()]);
  assert.equal(f.button(approve).props.disabled, false);
  f.refresh(); await f.respond(3, [dispute({ payment_receipts: [{ id: 'receipt-current', reference_number: 'REF-1', receipt_url: 'https://example.test/receipt?token=renewed' }] })]);
  assert.equal(f.find(node => node.type === 'input').props.checked, true);
  assert.equal(f.button(approve).props.disabled, true);
  f.loadImage();
  assert.equal(f.button(approve).props.disabled, false);
  assert.equal(f.focuses(), focusCount);
});

test('changed receipt, amount, reference or financial context requires fresh evidence confirmation', async () => {
  const changes = [
    { total: 75 }, { state: 'CANCELLED' }, { payment_status: 'REFUND_DUE' },
    { current_receipt_id: 'receipt-new', payment_receipts: [{ id: 'receipt-new', reference_number: 'REF-1', receipt_url: 'https://example.test/receipt?token=one' }] },
    { payment_receipts: [{ id: 'receipt-current', reference_number: 'REF-CHANGED', receipt_url: 'https://example.test/receipt?token=one' }] },
  ];
  for (const change of changes) {
    const f = await opened(); f.loadImage(); f.confirm();
    f.refresh(); await f.respond(2, [dispute(change)]);
    assert.equal(f.find(node => node.type === 'input').props.checked, false);
    assert.equal(f.button(approve).props.disabled, true);
    f.loadImage();
    assert.equal(f.button(approve).props.disabled, true);
  }
});

test('approval requires a loaded current image and ignores late image events', async () => {
  const f = await opened(); f.confirm();
  assert.equal(f.button(approve).props.disabled, true);
  await f.button(approve).props.onClick(); await f.flush();
  assert.equal(f.posts.length, 0);
  f.loadImage(); assert.equal(f.button(approve).props.disabled, false);
  f.imageError(); assert.equal(f.button(approve).props.disabled, true);
  const oldImage = f.find(node => node.type === 'img');
  f.refresh(); await f.respond(2, [dispute({ payment_receipts: [{ id: 'receipt-current', reference_number: 'REF-1', receipt_url: 'https://example.test/receipt?token=two' }] })]);
  oldImage.props.onLoad(); f.render();
  assert.equal(f.button(approve).props.disabled, true);
  f.loadImage(); oldImage.props.onError(); oldImage.props.onLoad(); f.render();
  assert.equal(f.button(approve).props.disabled, false);
});

test('a saved decision remains acknowledged even when its follow-up refresh fails', async () => {
  const f = await opened(); f.loadImage(); f.confirm();
  f.button(approve).props.onClick(); f.render();
  assert.equal(f.posts.length, 1);
  assert.equal(f.posts[0].args[1].receiptId, 'receipt-current');
  f.posts[0].resolve({}); await f.flush();
  await f.fail(2);
  const notice = f.find(node => node.type === 'notice');
  assert.equal(notice.props.title, 'Action completed');
  assert.match(notice.props.message, /saved successfully/);
  assert.equal(f.find(node => node.props?.role === 'dialog'), undefined);
});

test('leaving and reopening a review discards confirmation even for the same receipt', async () => {
  const f = await opened(); f.loadImage(); f.confirm();
  f.button('Close dispute review').props.onClick(); f.render();
  f.open(); await f.respond(2, [dispute()]);
  assert.equal(f.find(node => node.type === 'input').props.checked, false);
  assert.equal(f.button(approve).props.disabled, true);
});
