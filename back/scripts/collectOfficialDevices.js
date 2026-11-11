// Explicit, bounded collection from manufacturer's public specification pages.
// No paid APIs; running this command never runs during a visitor's search.
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getDateWindow } = require('../src/services/deviceCatalogPolicy');
const output = path.join(__dirname, '../src/data/officialDevices.json');
const text = html => html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<sup\b[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
async function get(url) {
  const cache = path.join(__dirname,'../.local',`source-${new URL(url).pathname.split('/').pop()}.html`);
  if(fs.existsSync(cache) && !process.argv.includes('--refresh')) { const saved=fs.readFileSync(cache,'utf8'); if(!saved.includes('<title>페이지를 찾을 수 없음'))return saved; }
  if(process.argv.includes('--offline')) throw new Error('Not collected in local snapshot');
  const r = await axios.get(url, { timeout: 25000, maxContentLength: 4000000 });
  fs.mkdirSync(path.dirname(cache),{recursive:true}); fs.writeFileSync(cache,r.data);
  await new Promise(resolve => setTimeout(resolve, 250));
  return r.data;
}
function section(html, label) {
  const parts = html.split(/<h[23]\b[^>]*>/i).slice(1);
  const part = parts.find(p => new RegExp(label).test(text(p.split(/<\/h[23]>/i)[0])));
  return part ? text(part.split(/<\/h[23]>/i).slice(1).join(' ')) : '';
}
const match = (s, pattern) => s.match(pattern)?.[0] || null;
function parse(html, category, url, yearHint) {
  const name = text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/\s*-\s*기술 사양.*$/, '');
  if (!name || !html.includes('기술 사양')) throw new Error('Missing specification title');
  const all = text(html);
  const year = all.match(/출시 연도\s*:\s*(20\d{2})/)?.[1] || yearHint;
  if (!year) throw new Error('No verified introduction year');
  const { from, to } = getDateWindow(5);
  // Year precision is conservative: a boundary year is excluded until a precise date is reviewed.
  if (`${year}-01-01` < from || `${year}-12-31` > to) return null;
  const chip = section(html, '^칩$|^프로세서');
  const display = section(html, '^디스플레이');
  const memory = section(html, '^메모리');
  const capacity = section(html, '^저장|^용량');
  const body = section(html, '^크기 및 무게');
  const battery = section(html, '전원 및 배터리|배터리 및 전원|전원 및 배터리 사용');
  const camera = section(html, '^카메라$');
  const front = section(html, 'TrueDepth 카메라|전면 카메라|FaceTime');
  const wireless = section(html, '무선|연결');
  const os = section(html, '^운영체제');
  const options = (value, regex) => [...new Set(value.match(regex)||[])].join(' / ') || null;
  const specs = {
    Inside: { Processor: { CPU: [...new Set(chip.match(/(?:Apple\s+)?[AMS]\d+(?:\s+(?:Pro|Max|Ultra|SiP))?/g)||[])].join(' / ') || null },
      RAM: { Capacity: options(memory,/\d+GB/g) || options(chip,/\d+GB (?:(?:통합 )?메모리|RAM)/g) },
      Storage: { Capacity: options(capacity,/\d+(?:GB|TB)/g) || match(chip,/저장 용량 \d+GB/) },
      Software: { OS: match(os, /(?:iPadOS|iOS|macOS|watchOS)(?:\s*\d+)?/) },
      Battery: { 'Energy (Wh)': match(battery,/\d+(?:\.\d+)?\s*와트시/), 'Video playback': match(battery, /동영상 재생(?:\s*:\s*|\s*)최대\s*\d+시간/), 'Typical usage': match(battery,/일반 사용 시 최대\s*\d+시간/) },
      Wireless: { 'Bluetooth Version': match(wireless, /(?:Bluetooth|블루투스)\s*\d+(?:\.\d+)?/) } },
    Display: { Type: match(display, /(?:Super Retina XDR|Liquid Retina XDR|Liquid Retina|Ultra Retina XDR|LTPO\d? OLED|Retina)/),
      'Resolution (H x W)': match(display, /\d{3,4}\s*[x×]\s*\d{3,4}/),
      'Diagonal (cm)': match(display, /\d+(?:\.\d+)?cm/),
      'Refresh Rate': match(display,/최대\s*\d+Hz/) },
    Camera: { 'Back Camera': { Resolution: match(camera,/\d+MP/) }, 'Front Camera': { Resolution: options(front,/\d+MP/g) } },
    Design: { Body: { Weight: category === 'Smartwatches' ? null : options(body,/\d+(?:\.\d+)?\s*(?:kg|g)\b/g), Thickness: match(body,/(?:두께|두께\(닫은 상태\))\s*:\s*\d+(?:\.\d+)?\s*(?:mm|cm)/), 'IP Rating': match(section(html,'방수 및 방진|방수 및 방수|방수'),/IP\d{2}/) } },
    _provenance: { provider: 'manufacturer', source: 'Apple 공식 사양', sourceUrl: url, checkedOn: new Date().toISOString().slice(0,10), releasePrecision: 'year' }
  };
  const imageUrl = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]).find(s => /class="gb-image alignment/.test(s))?.match(/src="([^"]+)"/)?.[1] || null;
  return { id: `official_apple_${new URL(url).pathname.split('/').pop()}`, brand: 'Apple', category, name, model: name,
    version: null, region: '한국 공식 지원 문서', releaseDate: `${year}년 (연도 기준)`, releaseStart: `${year}-01-01`, releaseEnd: `${year}-12-31`, releasePrecision: 'year', imageUrl, specs,
    // KR regulatory product disclosure provides evidence, not just a translated page.
    domesticVerified: /애플코리아|한국\s*출시|대한민국/.test(all) && /상품정보|인증정보|모델명/.test(all), sourceUrl: url };
}
async function main() {
  const indexes = [['Smartphones','108044'],['Tablets','108043'],['Smartwatches','108056'],['Laptops','102869'],['Laptops','108052']];
  const candidates = new Map();
  for (const [category,id] of indexes) {
    const html = await get(`https://support.apple.com/ko-kr/${id}`);
    fs.mkdirSync(path.join(__dirname,'../.local'),{recursive:true});
    fs.writeFileSync(path.join(__dirname,`../.local/apple-${id}.html`),html);
    for (const block of html.split(/<h2\b/i)) {
      const year = text(block).match(/출시 연도\s*:\s*(20\d{2})|\b(20\d{2})년/)?.slice(1).find(Boolean);
      if (!year || Number(year) < new Date().getFullYear()-4) continue;
      for (const a of block.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
        if (!/기술 사양|제품 사양/.test(text(a[2]))) continue;
        const original = new URL(a[1].replace(/&#x3D;/gi,'='), 'https://support.apple.com').href;
        const url = original.includes('/kb/') ? original : original.replace(/\?.*$/, '').replace(/support\.apple\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(\d+)$/, 'support.apple.com/ko-kr/$1');
        if (/^https:\/\/support\.apple\.com\/(?:ko-kr\/\d+|kb\/SP\d+\?locale=ko_KR)$/.test(url)) candidates.set(url, { category, year });
      }
    }
  }
  for(const [category,ids] of [['Smartphones',['121029','111831']],['Tablets',['119894','119893']],['Smartwatches',['121202','125093']]])
    for(const id of ids) candidates.set(`https://support.apple.com/ko-kr/${id}`,{category});
  const records = []; const failures = [];
  for (const [url,{category,year}] of [...candidates].slice(0,90)) {
    try { const product = parse(await get(url),category,url,year); if(product) { records.push(product); console.log('Collected',category,product.name); } }
    catch(e) { failures.push({url,reason:e.code || e.message}); }
  }
  if (!records.length) throw new Error('No records collected; existing dataset preserved');
  const unique = [...new Map(records.map(p=>[p.name,p])).values()];
  fs.writeFileSync(output, JSON.stringify(unique,null,2)+'\n');
  console.log(JSON.stringify({total:records.length, categories:records.reduce((a,p)=>(a[p.category]=(a[p.category]||0)+1,a),{}),failures}));
}
if(require.main===module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={parse};
