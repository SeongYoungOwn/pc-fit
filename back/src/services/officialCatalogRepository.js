// Manufacturer records are preloaded from the committed collection snapshot.
// This catalog is independent of TechSpecs credentials and network availability.
const records = [...require('../data/officialDevices.json'), ...require('../data/reviewedOfficialDevices'), ...require('../data/koreanDeviceFacts')];
const { isInScope, catalogError } = require('./deviceCatalogPolicy');
const { searchTokens } = require('./deviceSearch');
function createOfficialCatalogRepository(base, config, filename = require('path').join(__dirname,'../../.local/official-catalog.sqlite')) {
  const { DatabaseSync } = require('node:sqlite');
  if(filename !== ':memory:') require('fs').mkdirSync(require('path').dirname(filename),{recursive:true});
  const db = new DatabaseSync(filename);
  db.exec('CREATE TABLE IF NOT EXISTS official_products (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
  const insert=db.prepare('INSERT INTO official_products(id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data');
  db.exec('BEGIN');
  try { for(const p of records)insert.run(p.id,JSON.stringify(p)); db.exec('COMMIT'); }
  catch(e) { db.exec('ROLLBACK');db.close();throw e; }
  const active=new Set(records.map(p=>p.id));
  const saved=db.prepare('SELECT data FROM official_products ORDER BY id').all().map(r=>JSON.parse(r.data)).filter(p=>active.has(p.id));
  db.close();
  const all = saved.map(p => ({ ...p, source: p.specs._provenance.source,
    sourceUrl: p.sourceUrl, availability: p.domesticVerified ? 'verified' : 'unverified',
    domesticSourceUrl: p.domesticVerified ? p.sourceUrl : null,
    highlights: [p.specs.Inside?.Processor?.CPU, p.specs.Display?.['Resolution (H x W)'],p.specs.Inside?.Storage?.Capacity].filter(Boolean) }));
  const selected = f => all.filter(p => isInScope(p,f,{publicOnly:true}) && searchTokens(f.query).every(t => {
    const name=searchTokens(`${p.name} ${p.brand}`).join(' ').toLowerCase();
    return /^\d+$/.test(t) ? new RegExp(`(^|\\D)${t}(\\D|$)`).test(name) : name.includes(t.toLowerCase());
  }));
  return {
    ...base,
    async list(f) {
      // Merge before pagination; upstream TechSpecs is a local repository only.
      let existing=[];
      if(config().storageAllowed) {
        for(let page=0;page<1000;page++) { const r=await base.list({...f,page,size:100}); existing.push(...r.items); if(!r.hasMore)break; }
      }
      const items=[...selected(f),...existing].sort((a,b)=>(b.releaseStart||'').localeCompare(a.releaseStart||'')||a.id.localeCompare(b.id));
      return {items:items.slice(f.page*f.size,(f.page+1)*f.size),total:items.length,hasMore:(f.page+1)*f.size<items.length};
    },
    async brands(f) { return [...new Set([...selected({...f,brand:'',query:''}).map(p=>p.brand),...(config().storageAllowed?await base.brands(f):[])])].sort(); },
    async detail(id) { const p=all.find(p=>p.id===id); if(p)return p;
      if(!config().storageAllowed) throw catalogError(404,'DEVICE_NOT_FOUND','제품을 찾을 수 없습니다.');
      return base.detail(id);
    }
  };
}
module.exports={createOfficialCatalogRepository};
