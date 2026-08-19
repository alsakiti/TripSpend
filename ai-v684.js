(() => {
  "use strict";

  const RELEASE = "7.1.0";
  const ENDPOINT_FALLBACK = "https://tripspend-ai.alsukaiti1998.workers.dev";
  const PROVIDER = { key: "cloudflare", label: "Google Gemini", short: "Gemini 3.5 Flash-Lite" };
  const MAX_HISTORY = 12;
  const SESSION_KEY = "tripspend.ai.v684.history";
  const CATEGORIES = new Set(["Food", "Transport", "Hotel", "Shopping", "Activities", "Flights", "Coffee", "Groceries", "Other"]);
  const PAYMENTS = new Set(["Cash", "Credit Card", "Debit Card", "Apple Pay", "Other"]);
  const ITINERARY_TYPES = new Set(["Flight", "Hotel", "Activity", "Restaurant", "Transport", "Note"]);
  const SUPPORTED_ACTIONS = new Set([
    "add_expense", "edit_expense", "delete_expense", "batch_edit_expenses",
    "add_itinerary", "edit_itinerary", "delete_itinerary",
    "add_plan", "edit_plan", "delete_plan",
    "set_trip_budget", "set_country_budget", "edit_trip",
    "add_traveler", "edit_traveler", "delete_traveler",
    "add_country", "edit_country", "delete_country",
    "add_settlement", "edit_settlement", "delete_settlement",
    "undo_last_ai_change"
  ]);

  const $ = id => document.getElementById(id);
  const core = window.TripSpendCore;
  if (!core) return;

  let endpoint = ENDPOINT_FALLBACK;
  let requestController = null;
  let workerActionsReady = false;
  let workerVersion = "";
  let lastAiSnapshot = null;
  let chatHistory = loadHistory();

  function loadHistory() {
    try {
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
      return Array.isArray(value) ? value.slice(-MAX_HISTORY) : [];
    } catch { return []; }
  }

  function persistHistory() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(chatHistory.slice(-MAX_HISTORY))); } catch {}
  }

  function cleanText(value, max = 240) { return String(value || "").trim().slice(0, max); }
  function state() { return core.getState?.(); }
  function localDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function dateDiffInclusive(a, b) {
    const start = new Date(`${a}T12:00:00`), end = new Date(`${b}T12:00:00`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 0;
    return Math.max(0, Math.floor((end - start) / 86400000) + 1);
  }
  function personName(appState, id) { return appState.people?.find(p => p.id === id)?.name || "Unknown"; }
  function stopName(appState, id) { return appState.stops?.find(s => s.id === id)?.country || appState.trip?.destination || "Unknown"; }
  function activePeople(appState) { return (appState.people || []).filter(p => p.active !== false); }
  function personByRef(appState, id, name) {
    const people = activePeople(appState);
    if (id) { const exact = people.find(p => p.id === id); if (exact) return exact; }
    const needle = cleanText(name, 60).toLowerCase();
    if (needle) { const exact = people.find(p => cleanText(p.name, 60).toLowerCase() === needle); if (exact) return exact; }
    return people[0] || null;
  }
  function stopForDate(appState, date) {
    const rows = Array.isArray(appState.stops) ? appState.stops : [];
    if (!date) return rows[0] || null;
    return rows.find(s => s.startDate <= date && s.endDate >= date) || rows.find(s => s.startDate >= date) || rows.at(-1) || null;
  }
  function stopByRef(appState, id, country, date) {
    const rows = Array.isArray(appState.stops) ? appState.stops : [];
    if (id) { const exact = rows.find(s => s.id === id); if (exact) return exact; }
    const needle = cleanText(country, 80).toLowerCase();
    if (needle) { const exact = rows.find(s => cleanText(s.country, 80).toLowerCase() === needle); if (exact) return exact; }
    return stopForDate(appState, date);
  }
  function clampTripDate(appState, date) {
    const t = appState?.trip;
    let value = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? String(date) : localDateString();
    if (t?.startDate && value < t.startDate) value = t.startDate;
    if (t?.endDate && value > t.endDate) value = t.endDate;
    return value;
  }
  function isArabic(text = "") { return /[\u0600-\u06ff]/.test(String(text)); }

  function buildTripContext() {
    const s = state();
    if (!s?.trip) return { today: localDateString(), trip: null, clientVersion: RELEASE };
    const expenses = Array.isArray(s.expenses) ? s.expenses : [];
    const plans = Array.isArray(s.plans) ? s.plans : [];
    const itinerary = Array.isArray(s.itinerary) ? s.itinerary : [];
    const settlements = Array.isArray(s.settlements) ? s.settlements : [];
    return {
      clientVersion: RELEASE,
      today: localDateString(),
      trip: {
        id: s.trip.id || "", name: cleanText(s.trip.name, 80), destination: cleanText(s.trip.destination, 80),
        startDate: s.trip.startDate || "", endDate: s.trip.endDate || "", budget: Number(s.trip.budget || 0),
        homeCurrency: s.trip.homeCurrency || "", tripCurrency: s.trip.tripCurrency || "", defaultPayment: s.trip.defaultPayment || "Credit Card"
      },
      dashboard: {
        budgetLeft: $("remainingValue")?.textContent || "", safeToday: $("safeToday")?.textContent || "",
        spentToday: $("spentToday")?.textContent || "", currentCountry: $("currentCountryName")?.textContent || "", health: $("healthTitle")?.textContent || ""
      },
      countries: (s.stops || []).map(x => ({ id:x.id, country:cleanText(x.country,80), startDate:x.startDate||"", endDate:x.endDate||"", currency:x.currency||"", budget:Number(x.budget||0) })),
      travelers: activePeople(s).map(x => ({ id:x.id, name:cleanText(x.name,60) })),
      expenses: expenses.slice(-300).map(x => ({ id:x.id,date:x.date||"",stopId:x.stopId||"",country:stopName(s,x.stopId),category:x.category||"Other",expenseType:x.expenseType||"personal",amount:Number(x.amount||0),currency:x.currency||"",homeAmount:Number(x.homeAmount||0),paymentMethod:x.paymentMethod||"",paidByPersonId:x.paidByPersonId||"",paidBy:personName(s,x.paidByPersonId),sharedWithPersonIds:(x.personShares||[]).map(sh=>sh.personId),note:cleanText(x.note,140) })),
      upcomingCosts: plans.slice(-180).map(x => ({ id:x.id,title:cleanText(x.title,100),date:x.date||"",stopId:x.stopId||"",country:stopName(s,x.stopId),category:x.category||"Other",amount:Number(x.homeAmount||0),status:x.status||"planned",note:cleanText(x.note,140) })),
      itinerary: itinerary.slice(-180).map(x => ({ id:x.id,title:cleanText(x.title,100),type:x.type||"Activity",date:x.date||"",time:x.time||"",stopId:x.stopId||"",country:stopName(s,x.stopId),location:cleanText(x.location,140),bookingRef:cleanText(x.bookingRef,100),status:x.status||"planned",estimatedCost:Number(x.homeAmount||0),note:cleanText(x.note,220) })),
      settlements: settlements.slice(-150).map(x => ({ id:x.id,fromPersonId:x.fromPersonId,toPersonId:x.toPersonId,from:personName(s,x.fromPersonId),to:personName(s,x.toPersonId),amount:Number(x.amount||0),date:x.date||"",note:cleanText(x.note,120) })),
      privacy: { receiptsIncluded:false, pastTripsIncluded:false, backupsIncluded:false }
    };
  }

  function computeInsights() {
    const s = state();
    if (!s?.trip) return null;
    const expenses = s.expenses || [];
    const plans = (s.plans || []).filter(p => p.status !== "paid" && !expenses.some(e => e.planId === p.id));
    const spent = expenses.reduce((a,e)=>a+Number(e.homeAmount||0),0);
    const upcoming = plans.reduce((a,p)=>a+Number(p.homeAmount||0),0);
    const budget = Number(s.trip.budget||0);
    const available = budget - spent - upcoming;
    const today = localDateString();
    const dayStart = s.trip.startDate && today < s.trip.startDate ? s.trip.startDate : today;
    const daysLeft = s.trip.endDate ? Math.max(1,dateDiffInclusive(dayStart,s.trip.endDate)) : 1;
    const safeDaily = Math.max(0,available)/daysLeft;
    const categories = new Map();
    for (const e of expenses) categories.set(e.category||"Other",(categories.get(e.category||"Other")||0)+Number(e.homeAmount||0));
    const topCategories = [...categories.entries()].sort((a,b)=>b[1]-a[1]);
    const topExpenses = [...expenses].sort((a,b)=>Number(b.homeAmount||0)-Number(a.homeAmount||0)).slice(0,5);
    const duplicates = [];
    for(let i=0;i<expenses.length;i++) for(let j=i+1;j<expenses.length;j++) {
      const a=expenses[i], b=expenses[j];
      if(a.date===b.date && Math.abs(Number(a.homeAmount||0)-Number(b.homeAmount||0))<0.001 && (a.category||"")===(b.category||"")) duplicates.push([a,b]);
      if(duplicates.length>=8) break;
    }
    return { spent, upcoming, budget, available, daysLeft, safeDaily, topCategories, topExpenses, duplicates };
  }

  function simplifiedDebts() {
    const s = state(); if(!s?.trip) return [];
    const balance = new Map(activePeople(s).map(p=>[p.id,0]));
    for(const e of s.expenses||[]) {
      const amount=Number(e.homeAmount||0); if(!(amount>0)) continue;
      if(balance.has(e.paidByPersonId)) balance.set(e.paidByPersonId,balance.get(e.paidByPersonId)+amount);
      const shares=e.personShares||[];
      if(shares.length) for(const sh of shares) if(balance.has(sh.personId)) balance.set(sh.personId,balance.get(sh.personId)-Number(sh.amount||0));
      else if(balance.has(e.paidByPersonId)) balance.set(e.paidByPersonId,balance.get(e.paidByPersonId)-amount);
    }
    for(const x of s.settlements||[]) {
      const amount=Number(x.amount||0); if(!(amount>0)) continue;
      if(balance.has(x.fromPersonId)) balance.set(x.fromPersonId,balance.get(x.fromPersonId)+amount);
      if(balance.has(x.toPersonId)) balance.set(x.toPersonId,balance.get(x.toPersonId)-amount);
    }
    const creditors=[...balance].filter(([,v])=>v>0.005).map(([id,v])=>({id,amount:v})).sort((a,b)=>b.amount-a.amount);
    const debtors=[...balance].filter(([,v])=>v<-0.005).map(([id,v])=>({id,amount:-v})).sort((a,b)=>b.amount-a.amount);
    const out=[]; let i=0,j=0;
    while(i<debtors.length&&j<creditors.length){const amt=Math.min(debtors[i].amount,creditors[j].amount);if(amt>0.005)out.push({from:personName(s,debtors[i].id),to:personName(s,creditors[j].id),amount:amt});debtors[i].amount-=amt;creditors[j].amount-=amt;if(debtors[i].amount<0.005)i++;if(creditors[j].amount<0.005)j++;}
    return out;
  }

  function localAnswer(question) {
    const s=state(), q=question.toLowerCase(), ar=isArabic(question), ins=computeInsights();
    if(!s?.trip||!ins) return null;
    const cur=s.trip.homeCurrency;
    if(/duplicate|duplicates|مكرر|مكررة/.test(q)) {
      if(!ins.duplicates.length) return ar?"لم أجد مصروفات مكررة واضحة في الرحلة الحالية.":"I didn't find any obvious duplicate expenses in the current trip.";
      const lines=ins.duplicates.slice(0,5).map(([a,b])=>`${core.fmtDateWithYear(a.date)} • ${a.category} • ${core.money(a.homeAmount,cur)}`);
      return (ar?"مصروفات متشابهة محتملة:\n":"Possible duplicates:\n")+lines.join("\n");
    }
    if(/largest|biggest|top expenses|أكبر.*مصروف|اعلى.*مصروف/.test(q)) {
      if(!ins.topExpenses.length) return ar?"لا توجد مصروفات بعد.":"There are no expenses yet.";
      return ins.topExpenses.slice(0,3).map((e,i)=>`${i+1}. ${e.category} • ${core.money(e.homeAmount,cur)} • ${core.fmtDateWithYear(e.date)}${e.note?` • ${e.note}`:""}`).join("\n");
    }
    if(/who owes|owe whom|settle|settlement|من.*يدفع|من.*مدين|تسوية/.test(q)) {
      const debts=simplifiedDebts();
      if(!debts.length) return ar?"لا توجد ديون جماعية معلقة حسب المصروفات والتسويات الحالية.":"No outstanding group debts are left based on the current expenses and settlements.";
      return debts.map(d=>`${d.from} → ${d.to}: ${core.money(d.amount,cur)}`).join("\n");
    }
    if(/overspend|over budget|budget pace|safe.*day|spend.*day|ميزاني|اصرف.*يوم|مصروف.*يومي/.test(q)) {
      const pct=ins.budget>0?Math.round(ins.spent/ins.budget*100):0;
      if(ar) return `صرفت ${core.money(ins.spent,cur)} (${pct}% من الميزانية). التكاليف القادمة ${core.money(ins.upcoming,cur)}، والمتاح بعدها ${core.money(ins.available,cur)}. الحد الآمن التقريبي لليوم هو ${core.money(ins.safeDaily,cur)} لمدة ${ins.daysLeft} يوم.`;
      return `You've spent ${core.money(ins.spent,cur)} (${pct}% of budget). Upcoming costs are ${core.money(ins.upcoming,cur)}, leaving ${core.money(ins.available,cur)} after plans. A safe pace is about ${core.money(ins.safeDaily,cur)} per day for ${ins.daysLeft} day${ins.daysLeft===1?"":"s"}.`;
    }
    if(/where.*spend|spending most|top categor|وين.*اصرف|اكثر.*فئة|أكثر.*فئة/.test(q)) {
      if(!ins.topCategories.length) return ar?"لا توجد مصروفات بعد.":"There are no expenses yet.";
      return ins.topCategories.slice(0,4).map(([c,v],i)=>`${i+1}. ${c}: ${core.money(v,cur)}`).join("\n");
    }
    const cat=[...CATEGORIES].find(c=>q.includes(c.toLowerCase()));
    const stop=(s.stops||[]).find(x=>q.includes(cleanText(x.country,80).toLowerCase()));
    if((/how much|spent|spend|كم.*صرف|مجموع/.test(q))&&(cat||stop)) {
      const rows=(s.expenses||[]).filter(e=>(!cat||e.category===cat)&&(!stop||e.stopId===stop.id));
      const total=rows.reduce((a,e)=>a+Number(e.homeAmount||0),0);
      const label=[cat,stop?.country].filter(Boolean).join(" in ");
      return ar?`المجموع ${core.money(total,cur)} عبر ${rows.length} مصروف.`:`You spent ${core.money(total,cur)} on ${label || "those expenses"} across ${rows.length} expense${rows.length===1?"":"s"}.`;
    }
    return null;
  }

  function paymentFromText(text) {
    const q=text.toLowerCase();
    if(/apple\s*pay/.test(q)) return "Apple Pay";
    if(/credit/.test(q)) return "Credit Card";
    if(/debit/.test(q)) return "Debit Card";
    if(/cash|نقد/.test(q)) return "Cash";
    return "";
  }

  function localAction(question) {
    const s=state(); if(!s?.trip) return null;
    const q=question.toLowerCase();
    if(/^(undo|undo last|تراجع|تراجع عن آخر تغيير)$/i.test(question.trim())) return {type:"undo_last_ai_change",fields:{}};

    const method=paymentFromText(question);
    if(method && /(all|every|كل).*expense|expense.*(all|every)|كل.*مصروف/.test(q) && /(change|move|set|حول|غيّر|غير)/.test(q)) {
      let rows=[...(s.expenses||[])];
      const stop=(s.stops||[]).find(x=>q.includes(cleanText(x.country,80).toLowerCase()));
      if(stop) rows=rows.filter(e=>e.stopId===stop.id);
      const cat=[...CATEGORIES].find(c=>q.includes(c.toLowerCase()));
      if(cat) rows=rows.filter(e=>e.category===cat);
      if(!rows.length) return {message:isArabic(question)?"لم أجد مصروفات مطابقة لهذا الطلب.":"I couldn't find any expenses matching that bulk change."};
      return {type:"batch_edit_expenses",fields:{targetIds:rows.map(e=>e.id),paymentMethod:method,scope:stop?.country||cat||"all matching expenses"}};
    }

    let m=question.match(/(?:add|اضف|أضف)\s+(?:traveler|traveller|مسافر)\s+(.{1,50})$/i);
    if(m) return {type:"add_traveler",fields:{name:cleanText(m[1],50)}};

    m=question.match(/(?:remove|delete|احذف|حذف)\s+(?:traveler|traveller|مسافر)\s+(.{1,50})$/i);
    if(m){const needle=cleanText(m[1],50).toLowerCase(), matches=activePeople(s).filter(p=>p.name.toLowerCase().includes(needle));if(matches.length===1)return {type:"delete_traveler",targetId:matches[0].id,fields:{name:matches[0].name}};if(matches.length>1)return {message:"I found more than one matching traveler. Please use the exact name."};}

    if(/delete\s+(?:the\s+)?last\s+expense|احذف\s+آخر\s+مصروف/i.test(question)) {
      const e=[...(s.expenses||[])].sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0))[0];
      return e?{type:"delete_expense",targetId:e.id,fields:{amount:e.homeAmount,category:e.category,date:e.date,note:e.note}}:{message:"There are no expenses to delete."};
    }
    return null;
  }

  function normalizeExpenseFields(s, fields, existing=null) {
    const amount=fields.amount!=null?Number(fields.amount):Number(existing?.homeAmount||0); if(!(amount>0)) throw new Error("Expense amount must be greater than zero");
    const date=clampTripDate(s,fields.date||existing?.date||localDateString());
    const stop=stopByRef(s,fields.stopId,fields.country,date);
    const category=CATEGORIES.has(fields.category)?fields.category:(existing?.category||"Other");
    const payment=PAYMENTS.has(fields.paymentMethod)?fields.paymentMethod:(existing?.paymentMethod||s.trip.defaultPayment||"Credit Card");
    const people=activePeople(s); if(!people.length) throw new Error("Add a traveler before saving an AI expense");
    const payer=personByRef(s,fields.paidByPersonId||existing?.paidByPersonId,fields.paidBy);
    const expenseType=["personal","shared"].includes(fields.expenseType)?fields.expenseType:(existing?.expenseType||"personal");
    let personShares=[];
    if(expenseType==="shared") {
      let selected=(Array.isArray(fields.sharedWithPersonIds)?fields.sharedWithPersonIds:[]).map(id=>people.find(p=>p.id===id)).filter(Boolean);
      if(!selected.length&&Array.isArray(fields.sharedWithNames)) selected=fields.sharedWithNames.map(n=>personByRef(s,"",n)).filter(Boolean);
      if(!selected.length&&existing?.personShares) selected=existing.personShares.map(sh=>people.find(p=>p.id===sh.personId)).filter(Boolean);
      if(!selected.length) selected=people;
      selected=[...new Map(selected.map(p=>[p.id,p])).values()];
      const each=amount/selected.length; personShares=selected.map(p=>({personId:p.id,amount:each}));
    } else {
      const beneficiary=personByRef(s,fields.personId||existing?.personShares?.[0]?.personId||payer?.id,fields.personName); if(!beneficiary) throw new Error("Choose who the personal expense is for");
      personShares=[{personId:beneficiary.id,amount}];
    }
    return {amount,currency:s.trip.homeCurrency,rate:1,homeAmount:amount,category,paymentMethod:payment,date,note:cleanText(fields.note!=null?fields.note:existing?.note,120),expenseType,paidByPersonId:payer?.id||"",stopId:stop?.id||"",personShares};
  }

  function syncItineraryPlan(s,item){const amount=Number(item.homeAmount||0),existing=item.planId?s.plans.find(p=>p.id===item.planId):null,recorded=existing&&s.expenses.some(e=>e.planId===existing.id);if(!(amount>0)){if(existing&&!recorded)s.plans=s.plans.filter(p=>p.id!==existing.id);if(!recorded)item.planId="";return;}const cat={Flight:"Flights",Hotel:"Hotel",Activity:"Activities",Restaurant:"Food",Transport:"Transport",Note:"Other"}[item.type]||"Other";if(existing){Object.assign(existing,{title:item.title,homeAmount:amount,date:item.date,stopId:item.stopId,category:cat,note:[item.location,item.bookingRef,item.note].filter(Boolean).join(" • ").slice(0,120)});if(!recorded)existing.status="planned";return;}const p={id:core.uid("plan"),title:item.title,homeAmount:amount,date:item.date,stopId:item.stopId,category:cat,note:[item.location,item.bookingRef,item.note].filter(Boolean).join(" • ").slice(0,120),status:"planned",createdAt:Date.now()};s.plans.push(p);item.planId=p.id;}

  function applyAction(action) {
    try {
      if(!SUPPORTED_ACTIONS.has(action?.type)) throw new Error("That AI action is not supported");
      const s=state(); if(!s?.trip) throw new Error("Open a trip before making changes");
      const f=action.fields&&typeof action.fields==="object"?action.fields:{};
      if(action.type==="undo_last_ai_change"){if(!lastAiSnapshot)throw new Error("There is no AI change to undo");Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(JSON.stringify(lastAiSnapshot)));lastAiSnapshot=null;core.save({immediate:true});core.render();return{ok:true,message:"Last AI change undone."};}
      lastAiSnapshot=JSON.parse(JSON.stringify(s));
      if(action.type==="batch_edit_expenses"){const ids=new Set(Array.isArray(f.targetIds)?f.targetIds:[]);let changed=0;for(const e of s.expenses||[]){if(!ids.has(e.id))continue;if(f.paymentMethod&&PAYMENTS.has(f.paymentMethod))e.paymentMethod=f.paymentMethod;if(f.category&&CATEGORIES.has(f.category))e.category=f.category;changed++;}if(!changed)throw new Error("No matching expenses were found");core.save({immediate:true});core.render();return{ok:true,message:`Updated ${changed} expense${changed===1?"":"s"}.`};}
      if(action.type==="add_expense"){const n=normalizeExpenseFields(s,f);s.expenses.push({id:core.uid("expense"),...n,planId:"",receiptId:"",createdAt:Date.now()});s.preferences=s.preferences||{};s.preferences.lastPaymentMethod=n.paymentMethod;core.save({immediate:true});core.render();return{ok:true,message:`Expense added: ${core.money(n.homeAmount,s.trip.homeCurrency)} • ${n.category}.`};}
      if(action.type==="edit_expense"){const e=s.expenses.find(x=>x.id===action.targetId);if(!e)throw new Error("I could not find that expense anymore");Object.assign(e,normalizeExpenseFields(s,f,e));core.save({immediate:true});core.render();return{ok:true,message:"Expense updated."};}
      if(action.type==="delete_expense"){const before=s.expenses.length;s.expenses=s.expenses.filter(x=>x.id!==action.targetId);if(s.expenses.length===before)throw new Error("I could not find that expense");core.save({immediate:true});core.render();return{ok:true,message:"Expense deleted."};}
      if(action.type==="add_itinerary"){const title=cleanText(f.title,100);if(!title)throw new Error("Itinerary title is required");const date=clampTripDate(s,f.date),stop=stopByRef(s,f.stopId,f.country,date),type=ITINERARY_TYPES.has(f.type)?f.type:"Activity";const item={id:core.uid("itinerary"),title,type,date,time:cleanText(f.time,10),stopId:stop?.id||"",location:cleanText(f.location,140),bookingRef:cleanText(f.bookingRef,100),note:cleanText(f.note,220),status:f.status==="booked"?"booked":"planned",homeAmount:Math.max(0,Number(f.amount||0)),planId:"",createdAt:Date.now()};s.itinerary.push(item);syncItineraryPlan(s,item);core.save({immediate:true});core.render();return{ok:true,message:`Itinerary item added: ${title}.`};}
      if(action.type==="edit_itinerary"){const item=s.itinerary.find(x=>x.id===action.targetId);if(!item)throw new Error("I could not find that itinerary item");if(f.title!=null)item.title=cleanText(f.title,100)||item.title;if(f.type!=null&&ITINERARY_TYPES.has(f.type))item.type=f.type;if(f.date!=null)item.date=clampTripDate(s,f.date);if(f.time!=null)item.time=cleanText(f.time,10);if(f.country!=null||f.stopId!=null||f.date!=null)item.stopId=stopByRef(s,f.stopId,f.country,item.date)?.id||item.stopId;if(f.location!=null)item.location=cleanText(f.location,140);if(f.bookingRef!=null)item.bookingRef=cleanText(f.bookingRef,100);if(f.note!=null)item.note=cleanText(f.note,220);if(f.status!=null)item.status=f.status==="booked"?"booked":"planned";if(f.amount!=null)item.homeAmount=Math.max(0,Number(f.amount||0));syncItineraryPlan(s,item);core.save({immediate:true});core.render();return{ok:true,message:`Itinerary item updated: ${item.title}.`};}
      if(action.type==="delete_itinerary"){const item=s.itinerary.find(x=>x.id===action.targetId);if(!item)throw new Error("I could not find that itinerary item");s.itinerary=s.itinerary.filter(x=>x.id!==action.targetId);if(item.planId&&!s.expenses.some(e=>e.planId===item.planId))s.plans=s.plans.filter(x=>x.id!==item.planId);core.save({immediate:true});core.render();return{ok:true,message:"Itinerary item deleted."};}
      if(action.type==="add_plan"){const title=cleanText(f.title,100),amount=Number(f.amount);if(!title||!(amount>0))throw new Error("Planned cost needs a title and positive amount");const date=clampTripDate(s,f.date),stop=stopByRef(s,f.stopId,f.country,date);s.plans.push({id:core.uid("plan"),title,homeAmount:amount,date,stopId:stop?.id||"",category:CATEGORIES.has(f.category)?f.category:"Other",note:cleanText(f.note,140),status:"planned",createdAt:Date.now()});core.save({immediate:true});core.render();return{ok:true,message:`Planned cost added: ${title} • ${core.money(amount,s.trip.homeCurrency)}.`};}
      if(action.type==="edit_plan"){const p=s.plans.find(x=>x.id===action.targetId);if(!p)throw new Error("I could not find that planned cost");if(p.status==="paid"||s.expenses.some(e=>e.planId===p.id))throw new Error("That planned cost is already recorded as an expense");if(f.title!=null)p.title=cleanText(f.title,100)||p.title;if(f.amount!=null){const a=Number(f.amount);if(!(a>0))throw new Error("Planned cost must be greater than zero");p.homeAmount=a;}if(f.date!=null)p.date=clampTripDate(s,f.date);if(f.country!=null||f.stopId!=null||f.date!=null)p.stopId=stopByRef(s,f.stopId,f.country,p.date)?.id||p.stopId;if(f.category!=null&&CATEGORIES.has(f.category))p.category=f.category;if(f.note!=null)p.note=cleanText(f.note,140);core.save({immediate:true});core.render();return{ok:true,message:`Planned cost updated: ${p.title}.`};}
      if(action.type==="delete_plan"){if(s.expenses.some(e=>e.planId===action.targetId))throw new Error("That planned cost is already recorded as an expense");const before=s.plans.length;s.plans=s.plans.filter(x=>x.id!==action.targetId);if(s.plans.length===before)throw new Error("I could not find that planned cost");core.save({immediate:true});core.render();return{ok:true,message:"Planned cost deleted."};}
      if(action.type==="set_trip_budget"){const a=Number(f.amount);if(!Number.isFinite(a)||a<0)throw new Error("Trip budget must be zero or more");s.trip.budget=a;if(s.stops?.length===1)s.stops[0].budget=a;core.save({immediate:true});core.render();return{ok:true,message:`Trip budget updated to ${core.money(a,s.trip.homeCurrency)}.`};}
      if(action.type==="set_country_budget"){const stop=stopByRef(s,action.targetId||f.stopId,f.country,f.date),a=Number(f.amount);if(!stop)throw new Error("I could not find that country");if(!Number.isFinite(a)||a<0)throw new Error("Country budget must be zero or more");stop.budget=a;core.save({immediate:true});core.render();return{ok:true,message:`${stop.country} budget updated to ${core.money(a,s.trip.homeCurrency)}.`};}
      if(action.type==="add_traveler"){const name=cleanText(f.name,50);if(!name)throw new Error("Traveler name is required");s.people.push(core.makePerson(name));core.save({immediate:true});core.render();return{ok:true,message:`Traveler added: ${name}.`};}
      if(action.type==="edit_traveler"){const p=s.people.find(x=>x.id===action.targetId);if(!p)throw new Error("I could not find that traveler");if(f.name!=null)p.name=cleanText(f.name,50)||p.name;if(f.active!=null)p.active=!!f.active;core.save({immediate:true});core.render();return{ok:true,message:`Traveler updated: ${p.name}.`};}
      if(action.type==="delete_traveler"){const p=s.people.find(x=>x.id===action.targetId);if(!p)throw new Error("I could not find that traveler");if((s.expenses||[]).some(e=>e.paidByPersonId===p.id||(e.personShares||[]).some(sh=>sh.personId===p.id))||(s.settlements||[]).some(x=>x.fromPersonId===p.id||x.toPersonId===p.id))throw new Error("This traveler has history and cannot be deleted safely");s.people=s.people.filter(x=>x.id!==p.id);core.save({immediate:true});core.render();return{ok:true,message:`Traveler removed: ${p.name}.`};}
      if(action.type==="add_country"){const country=cleanText(f.country,80);if(!country)throw new Error("Country is required");s.stops.push({id:core.uid("stop"),country,startDate:f.startDate||s.trip.startDate,endDate:f.endDate||s.trip.endDate,currency:cleanText(f.currency,10)||s.trip.tripCurrency,budget:Math.max(0,Number(f.budget||0)),createdAt:Date.now()});core.save({immediate:true});core.render();return{ok:true,message:`Country added: ${country}.`};}
      if(action.type==="edit_country"){const stop=stopByRef(s,action.targetId||f.stopId,f.country,f.startDate);if(!stop)throw new Error("I could not find that country");if(f.country!=null)stop.country=cleanText(f.country,80)||stop.country;if(f.startDate!=null)stop.startDate=f.startDate;if(f.endDate!=null)stop.endDate=f.endDate;if(f.currency!=null)stop.currency=cleanText(f.currency,10)||stop.currency;if(f.budget!=null)stop.budget=Math.max(0,Number(f.budget||0));core.save({immediate:true});core.render();return{ok:true,message:`Country updated: ${stop.country}.`};}
      if(action.type==="delete_country"){const stop=stopByRef(s,action.targetId||f.stopId,f.country,f.date);if(!stop)throw new Error("I could not find that country");if(s.stops.length<=1)throw new Error("A trip must keep at least one country");if((s.expenses||[]).some(e=>e.stopId===stop.id)||(s.itinerary||[]).some(e=>e.stopId===stop.id)||(s.plans||[]).some(e=>e.stopId===stop.id))throw new Error("That country has trip history and cannot be removed safely");s.stops=s.stops.filter(x=>x.id!==stop.id);core.save({immediate:true});core.render();return{ok:true,message:`Country removed: ${stop.country}.`};}
      if(action.type==="edit_trip"){if(f.name!=null)s.trip.name=cleanText(f.name,60)||s.trip.name;if(f.destination!=null)s.trip.destination=cleanText(f.destination,80)||s.trip.destination;if(f.startDate!=null)s.trip.startDate=f.startDate;if(f.endDate!=null)s.trip.endDate=f.endDate;if(f.budget!=null)s.trip.budget=Math.max(0,Number(f.budget||0));core.save({immediate:true});core.render();return{ok:true,message:"Trip details updated."};}
      if(action.type==="add_settlement"){const from=personByRef(s,f.fromPersonId,f.from),to=personByRef(s,f.toPersonId,f.to),a=Number(f.amount);if(!from||!to||from.id===to.id||!(a>0))throw new Error("Settlement needs two travelers and a positive amount");s.settlements.push({id:core.uid("settlement"),fromPersonId:from.id,toPersonId:to.id,amount:a,date:f.date||localDateString(),note:cleanText(f.note,120),createdAt:Date.now()});core.save({immediate:true});core.render();return{ok:true,message:`Settlement added: ${core.money(a,s.trip.homeCurrency)}.`};}
      if(action.type==="edit_settlement"){const x=s.settlements.find(v=>v.id===action.targetId);if(!x)throw new Error("I could not find that settlement");if(f.amount!=null&&Number(f.amount)>0)x.amount=Number(f.amount);if(f.date!=null)x.date=f.date;if(f.note!=null)x.note=cleanText(f.note,120);const from=personByRef(s,f.fromPersonId,f.from),to=personByRef(s,f.toPersonId,f.to);if(f.from||f.fromPersonId){if(!from)throw new Error("I could not find the payer");x.fromPersonId=from.id;}if(f.to||f.toPersonId){if(!to)throw new Error("I could not find the receiver");x.toPersonId=to.id;}if(x.fromPersonId===x.toPersonId)throw new Error("Settlement travelers must be different");core.save({immediate:true});core.render();return{ok:true,message:"Settlement updated."};}
      if(action.type==="delete_settlement"){const before=s.settlements.length;s.settlements=s.settlements.filter(x=>x.id!==action.targetId);if(s.settlements.length===before)throw new Error("I could not find that settlement");core.save({immediate:true});core.render();return{ok:true,message:"Settlement deleted."};}
      throw new Error("That action is not supported yet");
    } catch(error){return{ok:false,message:error?.message||"TripSpend could not apply that change."};}
  }

  function actionTitle(type){return({add_expense:"Add expense",edit_expense:"Edit expense",delete_expense:"Delete expense",batch_edit_expenses:"Bulk edit expenses",add_itinerary:"Add itinerary item",edit_itinerary:"Edit itinerary item",delete_itinerary:"Delete itinerary item",add_plan:"Add planned cost",edit_plan:"Edit planned cost",delete_plan:"Delete planned cost",set_trip_budget:"Change trip budget",set_country_budget:"Change country budget",add_traveler:"Add traveler",edit_traveler:"Edit traveler",delete_traveler:"Remove traveler",add_country:"Add country",edit_country:"Edit country",delete_country:"Remove country",edit_trip:"Edit trip",add_settlement:"Add settlement",edit_settlement:"Edit settlement",delete_settlement:"Delete settlement",undo_last_ai_change:"Undo last AI change"})[type]||"Trip change";}
  function actionRows(action){const s=state(),f=action.fields||{},rows=[],add=(k,v)=>{if(v!==undefined&&v!==null&&String(v)!=="")rows.push([k,String(v)]);};if(action.type==="batch_edit_expenses"){add("Expenses",(f.targetIds||[]).length);add("Scope",f.scope);add("Payment",f.paymentMethod);add("Category",f.category);return rows;}if(action.targetId)add("Target",action.targetId);add("Title",f.title);add("Name",f.name);add("Amount",f.amount!=null&&s?.trip?core.money(Number(f.amount),s.trip.homeCurrency):"");add("Date",f.date?core.fmtDateWithYear(f.date):"");add("Country",f.country);add("Category",f.category);add("Payment",f.paymentMethod);add("Type",f.type||f.expenseType);add("Note",f.note);return rows.slice(0,8);}

  function renderActionCard(action){if(!SUPPORTED_ACTIONS.has(action?.type))return;const box=$("tripAiMessages");if(!box)return;const card=document.createElement("div");card.className="trip-ai-action";card.innerHTML=`<div class="trip-ai-action-head"><strong></strong><span class="trip-ai-action-badge">CONFIRM</span></div><div class="trip-ai-action-details"></div><p class="trip-ai-action-note">Nothing changes until you tap Confirm.</p><div class="trip-ai-action-buttons"><button type="button" class="trip-ai-action-cancel">Cancel</button><button type="button" class="trip-ai-action-confirm">Confirm change</button></div>`;card.querySelector("strong").textContent=actionTitle(action.type);const details=card.querySelector(".trip-ai-action-details");for(const [k,v] of actionRows(action)){const row=document.createElement("div"),a=document.createElement("span"),b=document.createElement("strong");a.textContent=k;b.textContent=v;row.append(a,b);details.append(row);}const cancel=card.querySelector(".trip-ai-action-cancel"),confirm=card.querySelector(".trip-ai-action-confirm"),badge=card.querySelector(".trip-ai-action-badge"),note=card.querySelector(".trip-ai-action-note");cancel.onclick=()=>{cancel.disabled=true;confirm.disabled=true;card.classList.add("cancelled");badge.textContent="CANCELLED";note.textContent="No changes were made.";addMessage("system","Cancelled. Nothing was changed.");};confirm.onclick=()=>{cancel.disabled=true;confirm.disabled=true;const result=applyAction(action);if(result.ok){card.classList.add("done");badge.textContent="SAVED";note.textContent=result.message;addMessage("assistant",result.message);}else{cancel.disabled=false;confirm.disabled=false;badge.textContent="CHECK";note.textContent=result.message;}};box.append(card);box.scrollTop=box.scrollHeight;}

  function injectStyles(){if($("tripAiStyles684"))return;const style=document.createElement("style");style.id="tripAiStyles684";style.textContent=`.dashboard-welcome-mark.trip-ai-ready{cursor:pointer;border:0;font:inherit}.trip-ai-sheet{display:flex;flex-direction:column;max-height:min(92vh,800px);padding-bottom:max(12px,env(safe-area-inset-bottom))}.trip-ai-head-copy{display:flex;align-items:center;gap:10px}.trip-ai-orb{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#eef7ff,#fff);color:#1677ff;border:1px solid #d8e9ff;font-size:20px}.trip-ai-provider-pill{display:inline-flex;margin-top:4px;padding:4px 8px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:800}.trip-ai-privacy{margin:8px 0 10px;padding:9px 11px;border-radius:13px;background:var(--surface2);color:var(--muted);font-size:11px;line-height:1.45}.trip-ai-suggestions{display:flex;gap:7px;overflow-x:auto;padding:2px 0 10px}.trip-ai-suggestion{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text);padding:8px 11px;font-size:11px;font-weight:750}.trip-ai-messages{min-height:190px;max-height:49vh;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:8px 2px 12px}.trip-ai-message{max-width:90%;padding:10px 12px;border-radius:16px;font-size:13px;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}.trip-ai-message.user{align-self:flex-end;background:var(--brand);color:#fff;border-bottom-right-radius:6px}.trip-ai-message.assistant{align-self:flex-start;background:var(--surface2);color:var(--text);border-bottom-left-radius:6px}.trip-ai-message.system{align-self:center;max-width:100%;padding:7px 10px;background:transparent;color:var(--muted);font-size:11px;text-align:center}.trip-ai-compose{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-top:1px solid var(--line);padding-top:10px}.trip-ai-compose textarea{resize:none;min-height:46px;max-height:110px;border:1px solid var(--line);border-radius:15px;background:var(--surface);color:var(--text);padding:11px 12px;outline:none;font:inherit;font-size:16px;line-height:1.35}.trip-ai-send{width:48px;min-height:46px;border:0;border-radius:15px;background:var(--brand);color:#fff;font-size:18px;font-weight:900}.trip-ai-send:disabled{opacity:.45}.trip-ai-action{align-self:stretch;max-width:100%;padding:13px;border:1px solid var(--line);border-radius:17px;background:var(--surface);box-shadow:0 8px 22px rgba(16,24,40,.06)}.trip-ai-action-head{display:flex;justify-content:space-between;gap:10px}.trip-ai-action-badge{padding:4px 7px;border-radius:999px;background:var(--brand-soft);color:var(--brand);font-size:9px;font-weight:900}.trip-ai-action-details{display:grid;gap:5px;margin:10px 0}.trip-ai-action-details div{display:flex;justify-content:space-between;gap:12px;font-size:11px}.trip-ai-action-details span{color:var(--muted)}.trip-ai-action-details strong{text-align:right;font-size:11px}.trip-ai-action-note{color:var(--muted);font-size:10px}.trip-ai-action-buttons{display:grid;grid-template-columns:1fr 1.35fr;gap:8px}.trip-ai-action-buttons button{min-height:40px;border-radius:12px;font-weight:800}.trip-ai-action-confirm{border:0;background:var(--brand);color:#fff}.trip-ai-action-cancel{border:1px solid var(--line);background:var(--surface);color:var(--text)}.trip-ai-settings-card{padding:16px;margin-top:12px}.trip-ai-settings-head{display:flex;justify-content:space-between;gap:12px}.trip-ai-status{display:inline-flex;padding:6px 9px;border-radius:999px;background:var(--surface2);color:var(--muted);font-size:10px;font-weight:850}.trip-ai-status.ready{background:var(--okbg);color:var(--ok)}.trip-ai-provider-line{margin-top:12px;padding:10px 12px;border-radius:13px;background:var(--surface2);display:flex;justify-content:space-between;gap:10px}.trip-ai-vbadge{font-size:10px;font-weight:900;color:var(--brand)}`;document.head.append(style);}

  function injectModal(){if($("tripAiModal"))return;const modal=document.createElement("div");modal.id="tripAiModal";modal.className="modal hidden";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.innerHTML=`<div class="sheet trip-ai-sheet"><div class="handle"></div><div class="modal-head"><div class="trip-ai-head-copy"><span class="trip-ai-orb">✦</span><div><div class="eyebrow">TRIPSPEND AI <span class="trip-ai-vbadge">v${RELEASE}</span></div><h2>Ask TripSpend</h2><span class="trip-ai-provider-pill">Enhanced assistant</span></div></div><button id="tripAiClose" class="icon-btn" type="button">✕</button></div><div class="trip-ai-privacy">AI can analyse this trip and prepare changes. Every write still requires your confirmation. AI chat does not send receipt images, backups or past trips. Receipt Scan sends only the receipt you explicitly choose to scan.</div><div class="trip-ai-suggestions"><button class="trip-ai-suggestion" type="button">Am I overspending?</button><button class="trip-ai-suggestion" type="button">Show my 3 largest expenses</button><button class="trip-ai-suggestion" type="button">Who owes whom?</button><button class="trip-ai-suggestion" type="button">Find duplicate expenses</button></div><div id="tripAiMessages" class="trip-ai-messages" aria-live="polite"></div><form id="tripAiForm" class="trip-ai-compose"><textarea id="tripAiInput" rows="1" maxlength="1000" placeholder="Ask, analyse, or make a change…"></textarea><button id="tripAiSend" class="trip-ai-send" type="submit">↑</button></form></div>`;document.body.append(modal);$("tripAiClose").onclick=closeAi;modal.onclick=e=>{if(e.target===modal)closeAi();};$("tripAiForm").onsubmit=e=>{e.preventDefault();const input=$("tripAiInput"),q=String(input.value||"").trim();if(!q)return;input.value="";ask(q);};modal.querySelectorAll(".trip-ai-suggestion").forEach(b=>b.onclick=()=>ask(b.textContent.trim()));}
  function injectSettings(){if($("tripAiSettingsCard"))return;const anchor=document.querySelector("#settings .appearance-card");if(!anchor)return;const card=document.createElement("div");card.id="tripAiSettingsCard";card.className="card trip-ai-settings-card";card.innerHTML=`<div class="trip-ai-settings-head"><div><strong>TripSpend AI v${RELEASE}</strong><p>Trip analysis, multi-step requests, bulk edits, duplicate checks and confirmed changes.</p></div><span id="tripAiServiceStatus" class="trip-ai-status">CHECKING</span></div><div class="trip-ai-provider-line"><span><strong>${PROVIDER.label}</strong><br><small id="tripAiWorkerVersion">Connecting…</small></span><small>Confirmation required</small></div>`;anchor.insertAdjacentElement("afterend",card);updateServiceStatus();}
  function activateTrigger(){let mark=document.querySelector(".dashboard-welcome-mark");if(!mark)return;if(mark.tagName!=="BUTTON"){const b=document.createElement("button");b.type="button";b.className=mark.className;b.textContent=mark.textContent||"✦";mark.replaceWith(b);mark=b;}mark.id="tripAiTrigger";mark.classList.add("trip-ai-ready");mark.removeAttribute("aria-hidden");mark.setAttribute("aria-label","Ask TripSpend AI");mark.onclick=openAi;}
  function addMessage(role,text){const box=$("tripAiMessages");if(!box)return null;const row=document.createElement("div");row.className=`trip-ai-message ${role}`;row.textContent=text;box.append(row);box.scrollTop=box.scrollHeight;return row;}
  function openAi(){const m=$("tripAiModal");if(!m)return;m.classList.remove("hidden");if(!$("tripAiMessages").children.length){addMessage("system",workerActionsReady?"Ask about your trip, request an analysis, or tell me what to change. Nothing is saved without confirmation.":"Enhanced local analysis is ready. Gemini is connecting for natural-language requests.");for(const h of chatHistory.slice(-6))addMessage(h.role,h.content);}setTimeout(()=>$("tripAiInput")?.focus(),80);}
  function closeAi(){requestController?.abort();requestController=null;$("tripAiModal")?.classList.add("hidden");}
  function updateServiceStatus(){const b=$("tripAiServiceStatus"),v=$("tripAiWorkerVersion");if(b){b.textContent=endpoint?(workerActionsReady?"READY":"LOCAL READY"):"LOCAL ONLY";b.classList.toggle("ready",!!endpoint);}if(v)v.textContent=workerVersion?`Worker v${workerVersion}`:"Enhanced client v7.1.0";}

  async function loadConfig(){try{const r=await fetch(`./ai-config.json?t=${Date.now()}`,{cache:"no-store"});if(r.ok){const c=await r.json(),n=String(c?.endpoint||"").trim();if(n.startsWith("https://"))endpoint=n.replace(/\/$/,"");}}catch{}try{const r=await fetch(endpoint,{method:"GET",cache:"no-store"});if(r.ok){const d=await r.json();workerActionsReady=d?.actions===true;workerVersion=String(d?.version||"");}}catch{}updateServiceStatus();}

  async function requestWorker(question){const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},signal:requestController.signal,body:JSON.stringify({provider:PROVIDER.key,question,context:buildTripContext(),history:chatHistory.slice(-MAX_HISTORY),capabilities:{writeActions:true,confirmationRequired:true,clientVersion:RELEASE,multiStep:true,bulkEdit:true}})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.error||`AI request failed (${r.status})`);return d;}
  function splitWriteClauses(question){const parts=question.split(/\s+(?:and then|then|ثم)\s+|\s*;\s*|\n+/i).map(x=>x.trim()).filter(Boolean);if(parts.length<2||parts.length>4)return null;const write=/(add|edit|change|set|delete|remove|move|اضف|أضف|غير|غيّر|احذف|حذف)/i;return parts.every(p=>write.test(p))?parts:null;}

  async function ask(question){addMessage("user",question);chatHistory.push({role:"user",content:question});chatHistory=chatHistory.slice(-MAX_HISTORY);persistHistory();const send=$("tripAiSend");if(send)send.disabled=true;
    const localAct=localAction(question);if(localAct){if(localAct.message)addMessage("assistant",localAct.message);else renderActionCard(localAct);if(send)send.disabled=false;return;}
    const answer=localAnswer(question);if(answer){addMessage("assistant",answer);chatHistory.push({role:"assistant",content:answer});chatHistory=chatHistory.slice(-MAX_HISTORY);persistHistory();if(send)send.disabled=false;return;}
    if(!endpoint){addMessage("system","Cloud AI is unavailable. Local trip analysis still works.");if(send)send.disabled=false;return;}
    const waiting=addMessage("assistant","Thinking…");requestController?.abort();requestController=new AbortController();const timer=setTimeout(()=>requestController?.abort(),35000);
    try{const clauses=splitWriteClauses(question);if(clauses){waiting.textContent=`I found ${clauses.length} requested changes. Preparing each one…`;let count=0;for(const clause of clauses){const d=await requestWorker(clause);if(d?.answer)addMessage("assistant",cleanText(d.answer,3000));if(d?.action&&SUPPORTED_ACTIONS.has(d.action.type)){renderActionCard(d.action);count++;}}if(!count)addMessage("system","I couldn't prepare those changes safely. Try one change at a time.");}
      else{const d=await requestWorker(question);const text=cleanText(d?.answer,5000)||(d?.action?"Review the proposed change below.":"I couldn't produce an answer for that question.");waiting.textContent=text;chatHistory.push({role:"assistant",content:text});chatHistory=chatHistory.slice(-MAX_HISTORY);persistHistory();if(d?.action&&SUPPORTED_ACTIONS.has(d.action.type))renderActionCard(d.action);}
    }catch(error){waiting.textContent=error?.name==="AbortError"?"The AI request timed out. Please try again.":(error?.message||"TripSpend AI is unavailable right now.");}finally{clearTimeout(timer);requestController=null;if(send)send.disabled=false;}}

  function paintVersion(){const value=`v${RELEASE}`;document.querySelectorAll(".version-badge").forEach(el=>{if(el.textContent!==value)el.textContent=value;});const c=$("currentVersionText");if(c&&c.textContent!==value)c.textContent=value;}
  function init(){injectStyles();injectModal();injectSettings();activateTrigger();paintVersion();loadConfig();const obs=new MutationObserver(()=>paintVersion());obs.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
