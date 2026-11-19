import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateSubscriptionFiles } from './validate.mjs';

const upstreamSubscription = 'https://raw.githubusercontent.com/Lin-arm/GKD_subscription/main/dist/gkd.json5';
const upstreamVersion = 'https://raw.githubusercontent.com/Lin-arm/GKD_subscription/main/dist/gkd.version.json5';
const outputSubscription = new URL('../dist/gkd.json5', import.meta.url);
const outputVersion = new URL('../dist/gkd.version.json5', import.meta.url);

async function download(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mask-Ekko-GKD-Sync' } });
  if (!response.ok) throw new Error(url + ' -> HTTP ' + response.status);
  return response.text();
}

export function customizeSubscription(source) {
  if (typeof source !== 'string' || source.length === 0) {
    throw new Error('Upstream subscription is empty');
  }

  // The upstream file is minified JSON5. Replace only the two top-level display fields.
  const namePattern = /^(\{id:[^,]+,name:)([^,]+)(,version:)/;
  // Match the complete quoted author value, including commas and escaped characters.
  const authorPattern = /^(\{id:[^,]+,name:[^,]+,version:[^,]+,author:)((?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"))(,checkUpdateUrl:)/;

  if (!namePattern.test(source)) {
    throw new Error('Upstream format changed: top-level name not found');
  }
  if (!authorPattern.test(source)) {
    throw new Error('Upstream format changed: top-level author not found');
  }

  const customized = source
    .replace(namePattern, "$1'Clean Tap'$3")
    .replace(authorPattern, "$1'Mask Ekko'$3");

  if (!/^\{id:[^,]+,name:'Clean Tap',version:/.test(customized)) {
    throw new Error('Name customization verification failed');
  }
  if (!/^\{id:[^,]+,name:'Clean Tap',version:[^,]+,author:'Mask Ekko',/.test(customized)) {
    throw new Error('Author customization verification failed');
  }

  return customized;
}

export async function main() {
  const [subscription, version] = await Promise.all([
    download(upstreamSubscription),
    download(upstreamVersion),
  ]);

  const customizedSubscription = customizeSubscription(subscription);
  validateSubscriptionFiles(customizedSubscription, version);

  const subscriptionTemp = new URL('../dist/gkd.json5.tmp', import.meta.url);
  const versionTemp = new URL('../dist/gkd.version.json5.tmp', import.meta.url);

  fs.writeFileSync(subscriptionTemp, customizedSubscription, 'utf8');
  fs.writeFileSync(versionTemp, version, 'utf8');
  fs.renameSync(subscriptionTemp, outputSubscription);
  fs.renameSync(versionTemp, outputVersion);

  console.log('Validated and generated dist/gkd.json5 and dist/gkd.version.json5');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
