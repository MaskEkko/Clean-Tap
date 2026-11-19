import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import JSON5 from 'json5';

const subscriptionPath = new URL('../dist/gkd.json5', import.meta.url);
const versionPath = new URL('../dist/gkd.version.json5', import.meta.url);

export function validateSubscriptionFiles(subscriptionText, versionText) {
  if (typeof subscriptionText !== 'string' || subscriptionText.trim().length === 0) {
    throw new Error('Subscription file is empty');
  }
  if (typeof versionText !== 'string' || versionText.trim().length === 0) {
    throw new Error('Version file is empty');
  }

  let subscription;
  let version;
  try {
    subscription = JSON5.parse(subscriptionText);
  } catch (error) {
    throw new Error('Subscription is not valid JSON5: ' + error.message);
  }
  try {
    version = JSON5.parse(versionText);
  } catch (error) {
    throw new Error('Version file is not valid JSON5: ' + error.message);
  }

  if (!subscription || typeof subscription !== 'object' || Array.isArray(subscription)) {
    throw new Error('Subscription root must be an object');
  }
  if (!version || typeof version !== 'object' || Array.isArray(version)) {
    throw new Error('Version root must be an object');
  }

  if (!Number.isInteger(subscription.id) || subscription.id <= 0) {
    throw new Error('Subscription id must be a positive integer');
  }
  if (subscription.name !== 'Clean Tap') {
    throw new Error('Subscription name must be Clean Tap');
  }
  if (subscription.author !== 'Mask Ekko') {
    throw new Error('Subscription author must be Mask Ekko');
  }
  if (!Number.isInteger(subscription.version) || subscription.version <= 0) {
    throw new Error('Subscription version must be a positive integer');
  }
  if (typeof subscription.checkUpdateUrl !== 'string' || subscription.checkUpdateUrl.length === 0) {
    throw new Error('Subscription checkUpdateUrl must be a non-empty string');
  }

  if (!Number.isInteger(version.id) || version.id <= 0) {
    throw new Error('Version id must be a positive integer');
  }
  if (!Number.isInteger(version.version) || version.version <= 0) {
    throw new Error('Version number must be a positive integer');
  }
  if (version.id !== subscription.id) {
    throw new Error('Subscription id does not match version file id');
  }
  if (version.version !== subscription.version) {
    throw new Error('Subscription version does not match version file version');
  }

  return { id: subscription.id, version: version.version };
}

export function validateLocalFiles() {
  const subscriptionText = fs.readFileSync(subscriptionPath, 'utf8');
  const versionText = fs.readFileSync(versionPath, 'utf8');
  return validateSubscriptionFiles(subscriptionText, versionText);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const result = validateLocalFiles();
    console.log('Subscription validation passed: id=' + result.id + ', version=' + result.version);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
