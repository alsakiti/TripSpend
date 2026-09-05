const { test, expect } = require("@playwright/test");

function state() {
  const now=Date.now();
  return {
    trip:{id:"ai-v720",name:"Europe",destination:"Germany",startDate:"2026-08-19",endDate:"2026-08-31",budget:1000,homeCurrency:"OMR",tripCurrency:"EUR",defaultPayment:"Credit Card"},
    expenses:[{id:"e1",amount:100,currency:"OMR",rate:1,homeAmount:100,category:"Food",paymentMethod:"Credit Card",date:"2026-08-19",note:"Dinner",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:100}],createdAt:now}],
    plans:[{id:"p1",title:"Hotel",homeAmount:250,date:"2026-08-25",stopId:"de",category:"Hotel",status:"planned",createdAt:now}],
    itinerary:[],settlements:[],rates:{},tripHistory:[],preferences:{},
    people:[{id:"me",name:"Me",active:true,createdAt:now}],
    stops:[{id:"de",country:"Germany",startDate:"2026-08-19",endDate:"2026-08-31",currency:"EUR",budget:1000,createdAt:now}]
  };
}

async function boot(page) {
  await page.addInitScript(value=>localStorage.setItem("tripspend.v1",JSON.stringify(value)),state());
  await page.goto("/");
  await page.evaluate(async()=>{if(!("serviceWorker" in navigator))return;await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener("controllerchange",resolve,{once:true}));});
  await page.reload();
  await page.waitForSelector("#mainView:not(.hidden)");
  await page.evaluate(()=>window.TripSpendEnhancementsReady);
}

async function mockReceiptScan(page) {
  await page.route("**tripspend-ai.alsukaiti1998.workers.dev**",async route=>{
    const request=route.request();
    if(request.method()==="GET")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,actions:true,version:"test"})});
    const body=request.postDataJSON();
    if(body?.mode==="receipt")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({receipt:{merchant:"Vienna Cafe",total:12,currency:"EUR",date:"2026-08-20",category:"Coffee",confidence:.95,fieldConfidence:{merchant:.95,total:.95,date:.95,category:.95},issues:[]}})});
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({answer:"Test response"})});
  });
}

async function applyReceiptSuggestion(page) {
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
  await page.locator("#navAdd").click();
  await page.locator("#expenseMoreOptions").click();
  await page.waitForSelector("#receiptAiScanBtn");
  await page.evaluate(()=>document.querySelector("#receiptAiScanBtn").click());
  await page.locator("#receiptInput").setInputFiles({name:"receipt.png",mimeType:"image/png",buffer:png});
  await page.waitForSelector(".receipt-ai-apply");
  await page.locator(".receipt-ai-apply").click();
  await expect(page.locator("#receiptPreview")).toBeVisible();
}

test("AI explains calculations and keeps learned receipt preferences trip-scoped",async({page})=>{
  await boot(page);
  const result=await page.evaluate(()=>{
    const api=window.TripSpendAIIntelligence;
    const explanation=api.explanation();
    api.rememberReceiptCorrection({merchant:"Vienna Cafe",category:"Other"},{merchant:"Vienna Cafe",category:"Coffee",paymentMethod:"Apple Pay"});
    return {explanation,defaults:api.receiptDefaults({merchant:"Vienna Cafe",category:"Other"}),context:api.context()};
  });
  expect(result.explanation.lines.map(x=>x.label)).toEqual(["Trip budget","Spent","Planned costs","Available","Days remaining","Suggested daily limit"]);
  expect(result.explanation.formula).toContain("Available ÷ remaining trip days");
  expect(result.defaults).toMatchObject({category:"Coffee",paymentMethod:"Apple Pay",learned:true});
  expect(result.context).toMatchObject({preferredPayment:"Apple Pay",learnedMerchantCount:1,corrections:1});
});

test("AI snapshot and controls are mobile-safe and bilingual",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await boot(page);
  await page.locator("#tripAiTrigger").click();
  await expect(page.locator("#tripAiModal")).toBeVisible();
  await expect(page.locator("#tripAiSnapshot")).toContainText("RECOMMENDED TODAY");
  await expect(page.locator("#tripAiExplain")).toHaveText("How calculated");
  await page.locator("#tripAiExplain").click();
  await expect(page.locator(".trip-ai-message.assistant").last()).toContainText("Trip budget");
  await page.locator("#tripAiClose").click();

  await page.locator("#languageToggleV7:visible, #setupLanguageToggleV7:visible").click();
  await page.locator("#tripAiTrigger").click();
  await expect(page.locator("#tripAiModal")).toHaveAttribute("dir","rtl");
  await expect(page.locator("#tripAiExplain")).toHaveText("طريقة الحساب");
  await expect(page.locator("#tripAiInput")).toHaveAttribute("placeholder",/اسأل/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("local AI answers follow the question language instead of the UI language",async({page})=>{
  await boot(page);
  const arabic=await page.evaluate(()=>window.TripSpendAIIntelligence.answer("ما هو توقع الصرف في نهاية الرحلة؟"));
  expect(arabic).toContain("التوقع الحالي");

  await page.locator("#languageToggleV7:visible, #setupLanguageToggleV7:visible").click();
  const answers=await page.evaluate(()=>({
    english:window.TripSpendAIIntelligence.answer("What is the end of trip forecast?"),
    mixed:window.TripSpendAIIntelligence.answer("ما هو forecast لنهاية الرحلة؟")
  }));
  expect(answers.english).toContain("Your current end-of-trip forecast");
  expect(answers.mixed).toContain("التوقع الحالي");
});

test("AI undo works immediately but preserves newer manual edits after reload",async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.TripSpendAI.ask("add traveler Alex"));
  await page.locator(".trip-ai-action-confirm").last().click();
  await expect.poll(()=>page.evaluate(()=>window.TripSpendCore.getState().people.some(p=>p.name==="Alex"))).toBe(true);

  await page.evaluate(()=>window.TripSpendAI.ask("undo"));
  await page.locator(".trip-ai-action-confirm").last().click();
  await expect.poll(()=>page.evaluate(()=>window.TripSpendCore.getState().people.some(p=>p.name==="Alex"))).toBe(false);

  await page.evaluate(()=>window.TripSpendAI.ask("add traveler Alex"));
  await page.locator(".trip-ai-action-confirm").last().click();
  await expect.poll(()=>page.evaluate(()=>window.TripSpendCore.getState().people.some(p=>p.name==="Alex"))).toBe(true);

  await page.evaluate(()=>{
    const core=window.TripSpendCore,s=core.getState(),now=Date.now();
    s.expenses.push({id:"manual-after-ai",amount:7,currency:"OMR",rate:1,homeAmount:7,category:"Coffee",paymentMethod:"Cash",date:"2026-08-20",note:"Manual after AI",expenseType:"personal",paidByPersonId:"me",stopId:"de",personShares:[{personId:"me",amount:7}],createdAt:now});
    core.save({immediate:true});
    core.render();
  });
  await page.waitForTimeout(150);
  await page.reload();
  await page.waitForSelector("#mainView:not(.hidden)");
  await page.evaluate(()=>window.TripSpendEnhancementsReady);

  await page.evaluate(()=>window.TripSpendAI.ask("undo"));
  const undoCard=page.locator(".trip-ai-action").last();
  await undoCard.locator(".trip-ai-action-confirm").click();
  await expect(undoCard.locator(".trip-ai-action-note")).toContainText("newer edits were kept");
  const stateAfter=await page.evaluate(()=>window.TripSpendCore.getState());
  expect(stateAfter.people.some(p=>p.name==="Alex")).toBe(true);
  expect(stateAfter.expenses.some(e=>e.id==="manual-after-ai")).toBe(true);
});

test("a rejected AI action does not create an undo snapshot",async({page})=>{
  await boot(page);
  await page.evaluate(()=>window.TripSpendAI.ask("remove traveler Me"));
  const deleteCard=page.locator(".trip-ai-action").last();
  await deleteCard.locator(".trip-ai-action-confirm").click();
  await expect(deleteCard.locator(".trip-ai-action-note")).toContainText("has history");

  await page.evaluate(()=>window.TripSpendAI.ask("undo"));
  const undoCard=page.locator(".trip-ai-action").last();
  await undoCard.locator(".trip-ai-action-confirm").click();
  await expect(undoCard.locator(".trip-ai-action-note")).toContainText("no AI change to undo");
});

test("receipt preferences are learned only after a successful expense save",async({page})=>{
  await mockReceiptScan(page);
  await boot(page);
  await applyReceiptSuggestion(page);

  await page.evaluate(()=>document.querySelector("#expenseForm").dispatchEvent(new SubmitEvent("submit",{bubbles:true,cancelable:true})));
  expect(await page.evaluate(()=>window.TripSpendAIIntelligence.context().corrections)).toBe(0);

  await page.locator("#exchangeRate").fill("2.5");
  await page.locator("#expenseForm button[type=submit]").click();
  await expect(page.locator("#modal")).toBeHidden();
  expect(await page.evaluate(()=>window.TripSpendAIIntelligence.context().corrections)).toBe(1);
});

test("abandoned receipt suggestions do not affect an unrelated expense",async({page})=>{
  await mockReceiptScan(page);
  await boot(page);
  await applyReceiptSuggestion(page);
  await page.locator("#closeModal").click();

  await page.locator("#navAdd").click();
  await page.locator("#expenseAmount").fill("5");
  await page.locator("#expenseCurrency").selectOption("OMR");
  await page.locator("#expenseForm button[type=submit]").click();
  await expect(page.locator("#modal")).toBeHidden();
  expect(await page.evaluate(()=>window.TripSpendAIIntelligence.context().corrections)).toBe(0);
});
