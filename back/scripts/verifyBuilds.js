// Actual saved PC products only. Never calls an external API.
const fs=require('fs'),path=require('path');
const {generateDeterministicBuild}=require('../src/services/recommendationEngine');
const {caseFitsParts,airCoolerFits}=require('../src/services/physicalPartFit');
const {checkCompatibility}=require('../src/services/compatibilityEngine');
async function main() {
  const report=[];
  for (const usage of ['gaming','work','stream','office']) {
    for(const budget of [800000,1500000,2500000]) {
      try {
        const build=await generateDeterministicBuild(budget,usage);
        JSON.stringify(build); // Detect cached alternative references becoming circular across repeated requests.
        const types=['cpu','gpu','motherboard','ram','storage','psu','cooler','case'];
        const parts=Object.fromEntries(types.map(type=>[type,{...build[type].specs,name:build[type].name,specs:build[type].specs}]));
        const compatibility=checkCompatibility(parts);
        const allReal=types.filter(type=>!(usage==='office' && type==='gpu')).every(type=>build[type].id.startsWith('opendb_'));
        if(!allReal || !caseFitsParts(build.case,build.motherboard,build.gpu) || !airCoolerFits(build.cooler,build.cpu,build.case) || !compatibility.isCompatible) throw Error('Source/physical compatibility check failed: '+JSON.stringify(compatibility.warnings));
        const total=types.reduce((sum,type)=>sum+Number(build[type].specs.estimatedPrice || build[type].specs.Price || 0),0);
        report.push({usage,budget,status:'passed',estimatedTotal:total,overBudget:total>budget,parts:Object.fromEntries(types.map(t=>[t,build[t].name]))});
      } catch(error) {report.push({usage,budget,status:'failed',error:error.message});}
    }
  }
  fs.writeFileSync(path.join(__dirname,'../.local/build-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),cases:report},null,2));
  console.log(JSON.stringify(report.map(({parts,...summary})=>summary),null,2));
  if(report.some(r=>r.status==='failed')) process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
