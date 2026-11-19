import test from 'node:test';
import assert from 'node:assert/strict';
import { customizeSubscription } from '../scripts/sync.mjs';
import { validateSubscriptionFiles } from '../scripts/validate.mjs';

const versionText = "{id:667,version:636}";
const validSource = "{id:667,name:'Upstream',version:636,author:'Original Author',checkUpdateUrl:'https://example.com/update',groups:[]}";

test('customizes a single-quoted author containing a comma', () => {
  const source = validSource.replace("'Original Author'", "'Alpha, Beta'");
  const result = customizeSubscription(source);
  assert.match(result, /author:'Mask Ekko',checkUpdateUrl:/);
  assert.match(result, /name:'Clean Tap',version:636/);
});

test('customizes a double-quoted author containing a comma', () => {
  const source = validSource.replace("'Original Author'", '"Alpha, Beta"');
  const result = customizeSubscription(source);
  assert.match(result, /author:'Mask Ekko',checkUpdateUrl:/);
});

test('handles escaped quotes inside the author value', () => {
  const singleQuoted = validSource.replace("'Original Author'", "'Alpha\\', Beta'");
  const doubleQuoted = validSource.replace("'Original Author'", '"Alpha\\", Beta"');
  assert.match(customizeSubscription(singleQuoted), /author:'Mask Ekko',checkUpdateUrl:/);
  assert.match(customizeSubscription(doubleQuoted), /author:'Mask Ekko',checkUpdateUrl:/);
});

test('rejects an unexpected upstream field layout', () => {
  assert.throws(() => customizeSubscription("{id:667,author:'Alpha',name:'Upstream'}"), /format changed/);
});

test('rejects empty subscription content', () => {
  assert.throws(() => customizeSubscription(''), /empty/);
});

test('validates customized subscription and matching version metadata', () => {
  const subscription = "{id:667,name:'Clean Tap',version:636,author:'Mask Ekko',checkUpdateUrl:'https://example.com/update',groups:[]}";
  assert.deepEqual(validateSubscriptionFiles(subscription, versionText), { id: 667, version: 636 });
});

test('rejects invalid JSON5', () => {
  assert.throws(() => validateSubscriptionFiles('{id:', versionText), /valid JSON5/);
});

test('rejects mismatched subscription and version ids', () => {
  const subscription = "{id:668,name:'Clean Tap',version:636,author:'Mask Ekko',checkUpdateUrl:'https://example.com/update'}";
  assert.throws(() => validateSubscriptionFiles(subscription, versionText), /id does not match/);
});

test('rejects mismatched version numbers', () => {
  const subscription = "{id:667,name:'Clean Tap',version:635,author:'Mask Ekko',checkUpdateUrl:'https://example.com/update'}";
  assert.throws(() => validateSubscriptionFiles(subscription, versionText), /version does not match/);
});
