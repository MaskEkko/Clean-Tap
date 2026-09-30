import fs from 'node:fs';

const upstreamSubscription = 'https://raw.githubusercontent.com/Lin-arm/GKD_subscription/main/dist/gkd.json5';
const upstreamVersion = 'https://raw.githubusercontent.com/Lin-arm/GKD_subscription/main/dist/gkd.version.json5';
const outputSubscription = new URL('../dist/gkd.json5', import.meta.url);
const outputVersion = new URL('../dist/gkd.version.json5', import.meta.url);

async function download(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mask-Ekko-GKD-Sync' } });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.text();
}

function customizeSubscription(source) {
  // The upstream file is minified JSON5. Replace only the two top-level display fields.
  const namePattern = /^(\{id:[^,]+,name:)([^,]+)(,version:)/;
  const authorPattern = /^(\{id:[^,]+,name:[^,]+,version:[^,]+,author:)([^,]+)(,checkUpdateUrl:)/;
  if (!namePattern.test(source)) throw new Error('Upstream format changed: top-level name not found');
  if (!authorPattern.test(source)) throw new Error('Upstream format changed: top-level author not found');

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

const [subscription, version] = await Promise.all([
  download(upstreamSubscription),
  download(upstreamVersion),
]);

fs.writeFileSync(outputSubscription, customizeSubscription(subscription), 'utf8');
fs.writeFileSync(outputVersion, version, 'utf8');
console.log('Generated dist/gkd.json5 with name=Clean Tap and author=Mask Ekko');


