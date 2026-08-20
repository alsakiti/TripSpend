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
