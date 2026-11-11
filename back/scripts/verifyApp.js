// Local HTTP probes only. No TechSpecs, AI or other external API calls.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
async function main() {
  const report=[];
  const checks=[
    ['GET','health',200],
    ['GET','devices/products?category=not-a-category',400],
    ['GET','devices/compare?category=Smartphones&ids=one,one',400],
    ['POST','recommend',400,{budget:-1,usage:'gaming'}],
    ['POST','recommend',400,{budget:1500000,usage:'invalid'}],
    ['GET','auth/me',401],
    ['GET','builds',401],
    ['GET','auth/check-username?username=local-qa-check',503],
    ['GET','takeoffs',503],
    ['POST','devices/import',401,{category:'Smartphones'}],
  ];
  for(const [method,endpoint,expected,body] of checks) {
    const response=await fetch(`http://localhost:8080/api/v1/${endpoint==='health' ? '../health' : endpoint}`,{
      method,headers:body ? {'content-type':'application/json'}:undefined,body:body ? JSON.stringify(body):undefined});
    const data=await response.json();
    assert.equal(response.status,expected,`${endpoint}: ${JSON.stringify(data)}`);
    report.push({endpoint,method,status:response.status,code:data.code || null,result:'passed'});
  }
  fs.writeFileSync(path.join(__dirname,'../.local/app-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks:report},null,2));
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
