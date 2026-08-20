import worker from "./ai-worker-v703.js";

const assert = (condition,message) => { if(!condition) throw new Error(message); };
const env = {
  ALLOWED_ORIGIN:"https://alsakiti.github.io",
  AI:{run:async()=>({answer:JSON.stringify({merchant:"Cafe",total:4.2,currency:"EUR",date:"2026-08-20",category:"Coffee",note:"Cafe",confidence:.9,fieldConfidence:{merchant:.8,total:.95,currency:.9,date:.7,category:.6},issues:["راجع الفئة"],evidence:{total:"TOTAL 4.20"}})})},
  AI_RATE_LIMITER:{limit:async()=>({success:true})}
};

const health=await worker.fetch(new Request("https://worker.test/"),env,{});
const status=await health.json();
assert(status.version==="7.1.0","Worker runtime version mismatch");
for(const capability of ["planning-assistant","mixed-arabic-english","receipt-field-confidence","calculation-explanations"]){
  assert(status.capabilities.includes(capability),`Missing capability: ${capability}`);
}

const scan=await worker.fetch(new Request("https://worker.test/",{
  method:"POST",
  headers:{Origin:"https://alsakiti.github.io","Content-Type":"application/json"},
  body:JSON.stringify({mode:"receipt",image:"data:image/jpeg;base64,AA",context:{language:"ar",today:"2026-08-20",trip:{homeCurrency:"OMR",tripCurrency:"EUR"}}})
}),env,{});
const data=await scan.json();
assert(scan.ok,"Receipt contract request failed");
assert(data.receipt.fieldConfidence.total===.95,"Receipt field confidence was not preserved");
assert(data.receipt.issues[0]==="راجع الفئة","Localized receipt warning was not preserved");
assert(data.receipt.evidence.total==="TOTAL 4.20","Receipt evidence was not preserved");

console.log("TripSpend AI Worker contract passed");
