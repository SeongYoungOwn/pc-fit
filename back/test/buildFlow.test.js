const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {checkCompatibility}=require('../src/services/compatibilityEngine');
function deferred() { let resolve,reject; const promise=new Promise((ok,no)=>{resolve=ok;reject=no;}); return {promise,resolve,reject}; }
function storeFor(api) {
  const source=fs.readFileSync(path.join(__dirname,'../../front/src/store/modules/build.js'),'utf8')
    .replace(/^import api from .*;\r?\n/m,'').replace('export default','module.exports=');
  const saved=new Map(),module={exports:{}};
  vm.runInNewContext(source,{api,module,console:{error(){}},sessionStorage:{setItem:(k,v)=>saved.set(k,v),getItem:k=>saved.get(k)}});
  const store=module.exports,state=store.state();
  const context={state,commit:(type,payload)=>store.mutations[type](state,payload),dispatch:()=>{},rootState:{auth:{isAuthenticated:false}}};
  return {store,state,context,saved};
}
test('quote loading remains active until the actual server response arrives',async()=>{
  const pending=deferred(); const h=storeFor({post:()=>pending.promise});
  const operation=h.store.actions.generateBuild(h.context,{budget:1500000,usage:'gaming'});
  assert.equal(h.state.loading,true);
  pending.resolve({data:{data:{parts:{cpu:{name:'Fixture CPU'}},totalPrice:100}}}); await operation;
  assert.equal(h.state.loading,false); assert.equal(h.state.parts.cpu.name,'Fixture CPU');
});
test('part changes exclude unknown prices, clear old analysis, recalculate power and persist the new part',async()=>{
  const h=storeFor({post:async(endpoint)=>{assert.equal(endpoint,'compatibility/check'); return {data:{data:{isCompatible:false,warnings:[{type:'socket_mismatch',severity:'error',affectedParts:['cpu','motherboard']}],totalWattage:180,recommendedPsu:300}}};}});
  h.state.parts.cpu={name:'old CPU',price:100}; h.state.parts.gpu={name:'GPU',price:200};
  h.state.overall_summary='old AI'; h.state.performance_metrics={game_fps:{game:100},build_score:90};
  await h.store.actions.updatePart(h.context,{partType:'cpu',partData:{name:'new CPU',price:null,priceStatus:'unavailable',specs:{estimatedPrice:9999}}});
  assert.equal(h.state.totalPrice,200); assert.equal(h.state.compatibility.isCompatible,false);
  assert.equal(h.state.totalWattage,180); assert.equal(h.state.overall_summary,'');
  assert.equal(Object.keys(h.state.performance_metrics.game_fps).length,0); assert.equal(h.state.analysisStale,true);
  const saved=JSON.parse(h.saved.get('pc_fit_last_build'));
  assert.equal(saved.parts.cpu.name,'new CPU'); assert.equal(saved.analysisStale,true);
});
test('an old compatibility response cannot overwrite a newer part change',async()=>{
  const first=deferred(),second=deferred(); let calls=0;
  const h=storeFor({post:()=>++calls===1 ? first.promise:second.promise});
  const a=h.store.actions.updatePart(h.context,{partType:'cpu',partData:{name:'first'}});
  const b=h.store.actions.updatePart(h.context,{partType:'cpu',partData:{name:'second'}});
  second.resolve({data:{data:{isCompatible:false,warnings:[],totalWattage:220,recommendedPsu:400}}}); await b;
  first.resolve({data:{data:{isCompatible:true,warnings:[],totalWattage:100,recommendedPsu:200}}}); await a;
  assert.equal(h.state.parts.cpu.name,'second'); assert.equal(h.state.totalWattage,220); assert.equal(h.state.compatibility.isCompatible,false);
});
test('a late AI review for the previous parts is discarded without another paid request',async()=>{
  const pending=deferred(); let reviewCalls=0;
  const h=storeFor({post:async(endpoint)=>{
    if(endpoint==='recommend/ai-review') {reviewCalls++;return pending.promise;}
    return {data:{data:{isCompatible:true,warnings:[],totalWattage:100,recommendedPsu:200}}};
  }});
  h.state.parts.cpu={name:'old'};
  const review=h.store.actions.fetchAiReview(h.context);
  await h.store.actions.updatePart(h.context,{partType:'cpu',partData:{name:'new'}});
  pending.resolve({data:{data:{overall_summary:'outdated review'}}}); await review;
  assert.equal(h.state.overall_summary,''); assert.equal(h.state.analysisStale,true); assert.equal(h.state.reviewLoading,false); assert.equal(reviewCalls,1);
});
test('failed rechecks never leave a changed build marked compatible',async()=>{
  const h=storeFor({post:async()=>{throw Error('offline');}});
  await assert.rejects(h.store.actions.updatePart(h.context,{partType:'cpu',partData:{name:'new'}}));
  assert.equal(h.state.compatibility.isCompatible,false); assert.equal(h.state.compatibility.warnings[0].type,'check_failed');
});
test('public compatibility check detects cooler, GPU, RAM and case fit problems from actual schema fields',()=>{
  const result=checkCompatibility({cpu:{specs:{socket:'AM5',specifications:{tdp:120}}},motherboard:{specs:{socket:'AM5',memory:{ram_type:'DDR5'},form_factor:'ATX'}},
    ram:{specs:{ram_type:'DDR4'}},gpu:{specs:{length:330,tdp:250}},cooler:{specs:{cpu_sockets:['LGA 1700'],height:170,water_cooled:false}},
    case:{specs:{supported_motherboard_form_factors:['Mini-ITX'],max_video_card_length:300,max_cpu_cooler_height:160}},psu:{wattage:850}});
  for(const type of ['ram_mismatch','cooler_socket_mismatch','gpu_case_mismatch','cooler_case_mismatch','board_case_mismatch']) assert.ok(result.warnings.some(w=>w.type===type),type);
  assert.equal(result.totalWattage,370); assert.equal(result.isCompatible,false);
});
test('integrated graphics preserve zero dedicated GPU power',()=>{
  const result=checkCompatibility({cpu:{socket:'AM5',tdp:65},motherboard:{socket:'AM5'},gpu:{name:'내장그래픽 (Integrated Graphics)',tdp:0},psu:{wattage:500}});
  assert.equal(result.totalWattage,65);
});
test('closing and reopening the part picker cannot display the previous category response',async()=>{
  const first=deferred(),second=deferred(); let calls=0;
  const api={get:()=>++calls===1 ? first.promise:second.promise},module={exports:{}};
  const file=fs.readFileSync(path.join(__dirname,'../../front/src/components/domain/PartSelector.vue'),'utf8');
  const script=file.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*;\r?\n/gm,'').replace('export default','module.exports=');
  vm.runInNewContext(script,{api,module,formatPrice:String});
  const component=module.exports,events=[];
  const picker={...component.data(),partType:'cpu',$emit:(...event)=>events.push(event)};
  for (const [name,method] of Object.entries(component.methods)) picker[name]=method.bind(picker);
  const a=picker.search(1); component.watch.isOpen.call(picker,false); picker.partType='ram';
  const b=picker.search(1);
  second.resolve({data:{data:{items:[{id:'ram-record',name:'Fixture DDR5',price:null}],total:1,hasMore:false}}}); await b;
  first.resolve({data:{data:{items:[{id:'cpu-record',name:'old CPU'}],total:99,hasMore:true}}}); await a;
  assert.equal(picker.results[0].id,'ram-record'); assert.equal(picker.total,1);
  picker.selectPart(picker.results[0]);
  assert.equal(events[0][0],'select'); assert.equal(events[0][1].type,'ram'); assert.equal(events[0][1].keyword,'Fixture DDR5');
});
