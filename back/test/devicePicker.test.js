const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../front/src/views/DeviceComparePage.vue'),'utf8').split('<script>')[1].split('</script>')[0].replace(/^import api.*;\r?\n/m,'').replace('export default','module.exports=');
test('brand changes clear stale products and late responses cannot mix brands',async()=>{
  const calls=[];const api={get:(_url,{params})=>new Promise(resolve=>calls.push({params,resolve}))};
  const module={exports:{}};vm.runInNewContext(source,{api,module});const page=module.exports;
  const state=Object.assign(page.data(),page.methods,{pickerItems:[{brand:'Apple'}],pickerBrand:'Apple',category:'Laptops'});
  const apple=state.searchPicker(0);assert.equal(state.pickerItems.length,0);
  state.pickerBrand='Samsung';const samsung=state.searchPicker(0);
  assert.equal(calls[1].params.brand,'Samsung');
  calls[1].resolve({data:{data:{items:[{brand:'Samsung'}],hasMore:false}}});await samsung;
  calls[0].resolve({data:{data:{items:[{brand:'Apple'}],hasMore:false}}});await apple;
  assert.equal(state.pickerItems[0].brand,'Samsung');assert.equal(state.pickerLoading,false);
});
