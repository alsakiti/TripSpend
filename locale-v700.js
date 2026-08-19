(() => {
  "use strict";

  const RELEASE = "7.1.0";
  const KEY = "tripspend.language";
  const originals = new WeakMap();
  const attrOriginals = new WeakMap();
  let observer = null;
  let busy = false;
  let queued = false;
  let lang = "en";
  let hasTranslatedDocument = false;

  try { lang = localStorage.getItem(KEY) === "ar" ? "ar" : "en"; } catch {}

  const UI = new Map(Object.entries({
    "Loading your trip…":"جارٍ تحميل رحلتك…","TripSpend update available":"يتوفر تحديث لـ TripSpend","Update now":"حدّث الآن",
    "Travel spending, made simple.":"إدارة مصاريف السفر ببساطة.","NEW TRIP":"رحلة جديدة","Set up your trip":"إعداد رحلتك","Your data stays in this browser.":"تبقى بياناتك محفوظة على هذا الجهاز.",
    "Past trips":"الرحلات السابقة","Open a previous trip or start a new one below.":"افتح رحلة سابقة أو ابدأ رحلة جديدة أدناه.","Trip name":"اسم الرحلة","Enter trip name":"أدخل اسم الرحلة",
    "Countries":"الدول","Add the countries you will visit and the dates for each one.":"أضف الدول التي ستزورها وتواريخ كل دولة.","Country":"الدولة","Search for a country…":"ابحث عن دولة…","Search for a country...":"ابحث عن دولة…",
    "From":"من","To":"إلى","Select date":"اختر التاريخ","Local currency":"العملة المحلية","Country budget":"ميزانية الدولة","(optional)":"(اختياري)","Home currency":"العملة الأساسية",
    "＋ Add another country":"＋ إضافة دولة أخرى","+ Add another country":"+ إضافة دولة أخرى","Add another country":"إضافة دولة أخرى","Add Country":"إضافة الدولة","Edit country":"تعديل الدولة","Save Changes":"حفظ التغييرات","Cancel":"إلغاء","Remove":"إزالة",
    "Trip dates will follow your country dates automatically.":"سيتم تحديد تواريخ الرحلة تلقائيًا حسب تواريخ الدول.","Total trip budget":"إجمالي ميزانية الرحلة","Enter budget":"أدخل الميزانية",
    "Travelers":"المسافرون","Add the people whose spending you want to track.":"أضف الأشخاص الذين تريد متابعة مصروفاتهم.","Your name":"اسمك","(first traveler)":"(المسافر الأول)","Enter your name":"أدخل اسمك",
    "＋ Add traveler":"＋ إضافة مسافر","+ Add traveler":"+ إضافة مسافر","Add traveler":"إضافة مسافر","＋ Add another":"＋ إضافة آخر","Add another":"إضافة آخر","Traveler name":"اسم المسافر","Enter traveler name":"أدخل اسم المسافر","Add Traveler":"إضافة المسافر","Edit traveler":"تعديل المسافر",
    "Your total budget and reports use this currency.":"تُستخدم هذه العملة في الميزانية الإجمالية والتقارير.","Create Trip":"إنشاء الرحلة","automatic":"تلقائي",
    "First country start date":"تاريخ بداية الدولة الأولى","First country end date":"تاريخ نهاية الدولة الأولى","Additional country start date":"تاريخ بداية الدولة الإضافية","Additional country end date":"تاريخ نهاية الدولة الإضافية",

    "Home":"الرئيسية","Expenses":"المصروفات","Plan":"الخطة","Analytics":"التحليلات","Settings":"الإعدادات","TODAY":"اليوم","Today":"اليوم",
    "Your trip at a glance":"رحلتك بنظرة سريعة","Stay on budget and keep the day moving.":"تابع ميزانيتك وخطط يومك بسهولة.","TRIP BUDGET LEFT":"المتبقي من ميزانية الرحلة","Budget":"الميزانية","Spent":"المصروف","Remaining":"المتبقي",
    "BUDGET DETAILS":"تفاصيل الميزانية","Budget details":"تفاصيل الميزانية","Plans & available balance":"الخطط والرصيد المتاح","Reserved for plans":"محجوز للخطط","Available after plans":"المتاح بعد الخطط","No upcoming costs reserved":"لا توجد تكاليف قادمة محجوزة",
    "Available per day":"المتاح يوميًا","☀️ Available per day":"المتاح يوميًا ☀️","Spent today":"مصروف اليوم","🧾 Spent today":"مصروف اليوم 🧾","The amount you can spend per day: your balance after upcoming planned costs, divided by the days left in your trip.":"المبلغ الذي يمكنك إنفاقه يوميًا: رصيدك بعد التكاليف المخططة القادمة، مقسومًا على الأيام المتبقية في الرحلة.",
    "WHERE YOU ARE":"موقعك الآن","Current trip":"الرحلة الحالية","FIRST COUNTRY • AUTO BY DATE":"الدولة الأولى • تلقائي حسب التاريخ","CURRENT COUNTRY • AUTO BY DATE":"الدولة الحالية • تلقائي حسب التاريخ","LAST COUNTRY • AUTO BY DATE":"الدولة الأخيرة • تلقائي حسب التاريخ","Current country • auto by date":"الدولة الحالية • تلقائي حسب التاريخ","No country budget":"لم تُحدَّد ميزانية لهذه الدولة","NEXT UP":"التالي","Next up":"التالي",
    "QUICK START":"بداية سريعة","Make today easier":"سهّل يومك","Add expenses as you go. TripSpend updates your safe daily amount automatically.":"سجّل مصروفاتك أولًا بأول، وسيحدّث TripSpend المبلغ اليومي الآمن تلقائيًا.","Got it":"حسنًا","Dismiss quick start tip":"إخفاء نصيحة البداية السريعة","TODAY'S GUIDANCE":"إرشاد اليوم","View expenses":"عرض المصروفات","View analytics":"عرض التحليلات","Start trip":"بدء الرحلة","Show":"عرض","Hide":"إخفاء","Your trip and receipts stay on this device unless you export them.":"تبقى بيانات رحلتك وإيصالاتك على هذا الجهاز ما لم تُصدّرها.",
    "YOUR ROUTE":"مسار رحلتك","Country budgets":"ميزانيات الدول","Manage":"إدارة","Tap a country to set its budget.":"اضغط على دولة لتحديد ميزانيتها.","Set budget":"تحديد الميزانية","No spending recorded yet":"لم تُسجَّل مصروفات بعد","Your daily spending guidance will update after you record your first expense.":"سيتم تحديث إرشادات الإنفاق اليومية بعد تسجيل أول مصروف.","Today’s spending guide":"إرشاد إنفاق اليوم","Today’s safe amount is used":"تم استخدام المبلغ الآمن لليوم","Avoid more spending today to protect the rest of your trip budget.":"تجنّب المزيد من الإنفاق اليوم للحفاظ على بقية ميزانية الرحلة.","Trip budget fully allocated.":"تم توزيع ميزانية الرحلة بالكامل.","On track":"ضمن الميزانية","Over budget":"تجاوزت الميزانية","Trip history":"سجل الرحلات","Trips & history":"الرحلات والسجل","No past trips yet • tap to manage trips":"لا توجد رحلات سابقة • اضغط لإدارة الرحلات",

    "MONEY":"المال","HISTORY":"السجل","Add":"إضافة","Add +":"إضافة +","Add expense":"إضافة مصروف","＋ Add expense":"＋ إضافة مصروف","Filters":"التصفية","Search expenses":"ابحث في المصروفات","Search note, category, country, payer…":"ابحث بالملاحظة أو الفئة أو الدولة أو الدافع…","Search note, category, country, payer...":"ابحث بالملاحظة أو الفئة أو الدولة أو الدافع…","Close expense editor":"إغلاق محرر المصروف","Close receipt viewer":"إغلاق عارض الإيصال","Zoom out receipt":"تصغير الإيصال","Zoom in receipt":"تكبير الإيصال",
    "All categories":"كل الفئات","All payments":"كل طرق الدفع","All payment methods":"كل طرق الدفع","No expenses yet":"لا توجد مصروفات بعد","No matching expenses":"لا توجد مصروفات مطابقة","Load more":"عرض المزيد","Expense details":"تفاصيل المصروف","Amount":"المبلغ","Date":"التاريخ","Category":"الفئة","Payment":"الدفع","Paid by":"دفع بواسطة","Personal expense for":"مصروف شخصي لـ","Shared with":"مشترك مع","Everyone":"الجميع","Note":"ملاحظة","Receipt":"الإيصال","📷 Add receipt":"📷 إضافة إيصال","Receipt attached":"تم إرفاق الإيصال","Saved locally":"محفوظ محليًا","Stored locally":"محفوظ محليًا","No receipt attached":"لا يوجد إيصال مرفق","More options":"خيارات إضافية","Use suggestion":"استخدام الاقتراح","Exchange rate":"سعر الصرف","Enter the exchange rate.":"أدخل سعر الصرف.","Use Latest Rate":"استخدام أحدث سعر","Save Expense":"حفظ المصروف","Edit Expense":"تعديل المصروف","Repeat":"تكرار","Personal":"شخصي","Shared":"مشترك","Me":"أنا","For Me":"لي","Paid by Me":"دفعت أنا",
    "Food":"الطعام","Transport":"النقل","Hotel":"الفندق","Shopping":"التسوق","Activities":"الأنشطة","Flights":"الرحلات الجوية","Coffee":"القهوة","Groceries":"البقالة","Other":"أخرى","Cash":"نقدًا","Credit Card":"بطاقة ائتمان","Debit Card":"بطاقة خصم","Apple Pay":"Apple Pay",
    "Dinner":"عشاء","Lunch":"غداء","Breakfast":"إفطار","Taxi":"سيارة أجرة","Restaurant":"مطعم","Groceries":"بقالة","Flight":"رحلة جوية","Activity":"نشاط",

    "TRIP PLAN":"خطة الرحلة","Itinerary":"برنامج الرحلة","Flights, hotels, activities and transport in one place.":"الرحلات والفنادق والأنشطة والتنقل في مكان واحد.","＋ Add item":"＋ إضافة عنصر","Add item":"إضافة عنصر","No itinerary items yet":"لا توجد عناصر في برنامج الرحلة بعد","Upcoming costs":"التكاليف القادمة","Hotels, activities, transport and other expected costs.":"الفنادق والأنشطة والتنقل والتكاليف المتوقعة الأخرى.","＋ Add cost":"＋ إضافة تكلفة","Add planned cost":"إضافة تكلفة مخططة","What are you planning?":"ما الذي تخطط له؟","Estimated cost":"التكلفة التقديرية","Add Planned Cost":"إضافة التكلفة المخططة","Planned":"مخطط","Booked":"محجوز","Time":"الوقت","Location":"الموقع","Booking reference":"مرجع الحجز","Title":"العنوان","Type":"النوع","Status":"الحالة",

    "Total spent":"إجمالي المصروف","Daily average":"المتوسط اليومي","By category":"حسب الفئة","By country":"حسب الدولة","Top categories":"أعلى الفئات","Spending trend":"اتجاه الإنفاق","Settlements":"التسويات","Everyone is settled ✓":"تمت تسوية الجميع ✓","No travelers yet.":"لا يوجد مسافرون بعد.","View all travelers":"عرض كل المسافرين",

    "Trip settings":"إعدادات الرحلة","Primary destination":"الوجهة الرئيسية","Trip start":"بداية الرحلة","Trip end":"نهاية الرحلة","Default payment":"طريقة الدفع الافتراضية","Save trip settings":"حفظ إعدادات الرحلة","Appearance":"المظهر","Choose how TripSpend looks on this device.":"اختر مظهر TripSpend على هذا الجهاز.","System":"النظام","Light":"فاتح","Dark":"داكن","Manage trips":"إدارة الرحلات","Manage Trips":"إدارة الرحلات","Countries & plans":"الدول والخطط","Manage Travelers":"إدارة المسافرين","Data & safety":"البيانات والأمان","Export backup":"تصدير نسخة احتياطية","Import backup":"استيراد نسخة احتياطية","Switch trip":"تبديل الرحلة","App health":"حالة التطبيق","Run checks":"تشغيل الفحوصات","Receipt photos":"صور الإيصالات","Clean unused receipt files":"تنظيف ملفات الإيصالات غير المستخدمة",

    "Ask TripSpend AI":"اسأل TripSpend AI","Ask TripSpend":"اسأل TripSpend","Ask, analyse, or make a change…":"اسأل أو حلّل أو اطلب تغييرًا…","Ask or make a change…":"اسأل أو اطلب تغييرًا…","Send question":"إرسال السؤال","Close TripSpend AI":"إغلاق TripSpend AI","Confirm":"تأكيد","Confirm change":"تأكيد التغيير","Nothing changes until you tap Confirm.":"لن يتغير شيء حتى تضغط تأكيد.","Undo":"تراجع","Delete":"حذف","Edit":"تعديل","Save":"حفظ","Done":"تم","Clear":"مسح","CHECKING":"جارٍ التحقق","AI READY":"الذكاء جاهز","ANALYSIS READY":"التحليل جاهز","LOCAL ONLY":"محلي فقط","Confirmation required":"التأكيد مطلوب",
    "Am I overspending?":"هل أنفق أكثر من اللازم؟","Show my 3 largest expenses":"اعرض أكبر 3 مصروفات","Who owes whom?":"من يدين لمن؟","Find duplicate expenses":"ابحث عن المصروفات المكررة"
  }));

  const CATEGORY = {Food:"الطعام",Transport:"النقل",Hotel:"الفندق",Shopping:"التسوق",Activities:"الأنشطة",Flights:"الرحلات الجوية",Coffee:"القهوة",Groceries:"البقالة",Other:"أخرى"};
  const PAYMENT = {Cash:"نقدًا","Credit Card":"بطاقة ائتمان","Debit Card":"بطاقة خصم","Apple Pay":"Apple Pay",Other:"أخرى"};
  const COMMON_TITLE = {Dinner:"عشاء",Lunch:"غداء",Breakfast:"إفطار",Coffee:"قهوة",Taxi:"سيارة أجرة",Hotel:"فندق",Shopping:"تسوق",Groceries:"بقالة",Flight:"رحلة جوية",Restaurant:"مطعم",Transport:"نقل",Activity:"نشاط"};

  const COUNTRY_CODES = {
    Afghanistan:"AF",Albania:"AL",Algeria:"DZ",Andorra:"AD",Angola:"AO","Antigua and Barbuda":"AG",Argentina:"AR",Armenia:"AM",Australia:"AU",Austria:"AT",Azerbaijan:"AZ",Bahamas:"BS",Bahrain:"BH",Bangladesh:"BD",Barbados:"BB",Belarus:"BY",Belgium:"BE",Belize:"BZ",Benin:"BJ",Bhutan:"BT",Bolivia:"BO","Bosnia and Herzegovina":"BA",Botswana:"BW",Brazil:"BR",Brunei:"BN",Bulgaria:"BG","Burkina Faso":"BF",Burundi:"BI",Cambodia:"KH",Cameroon:"CM",Canada:"CA","Cape Verde":"CV","Central African Republic":"CF",Chad:"TD",Chile:"CL",China:"CN",Colombia:"CO",Comoros:"KM","Costa Rica":"CR",Croatia:"HR",Cuba:"CU",Cyprus:"CY","Czech Republic":"CZ","Democratic Republic of the Congo":"CD",Denmark:"DK",Djibouti:"DJ",Dominica:"DM","Dominican Republic":"DO",Ecuador:"EC",Egypt:"EG","El Salvador":"SV","Equatorial Guinea":"GQ",Eritrea:"ER",Estonia:"EE",Eswatini:"SZ",Ethiopia:"ET",Fiji:"FJ",Finland:"FI",France:"FR",Gabon:"GA",Gambia:"GM",Georgia:"GE",Germany:"DE",Ghana:"GH",Greece:"GR",Grenada:"GD",Guatemala:"GT",Guinea:"GN","Guinea-Bissau":"GW",Guyana:"GY",Haiti:"HT",Honduras:"HN",Hungary:"HU",Iceland:"IS",India:"IN",Indonesia:"ID",Iran:"IR",Iraq:"IQ",Ireland:"IE",Israel:"IL",Italy:"IT","Ivory Coast":"CI",Jamaica:"JM",Japan:"JP",Jordan:"JO",Kazakhstan:"KZ",Kenya:"KE",Kiribati:"KI",Kuwait:"KW",Kyrgyzstan:"KG",Laos:"LA",Latvia:"LV",Lebanon:"LB",Lesotho:"LS",Liberia:"LR",Libya:"LY",Liechtenstein:"LI",Lithuania:"LT",Luxembourg:"LU",Madagascar:"MG",Malawi:"MW",Malaysia:"MY",Maldives:"MV",Mali:"ML",Malta:"MT","Marshall Islands":"MH",Mauritania:"MR",Mauritius:"MU",Mexico:"MX",Micronesia:"FM",Moldova:"MD",Monaco:"MC",Mongolia:"MN",Montenegro:"ME",Morocco:"MA",Mozambique:"MZ",Myanmar:"MM",Namibia:"NA",Nauru:"NR",Nepal:"NP",Netherlands:"NL","New Zealand":"NZ",Nicaragua:"NI",Niger:"NE",Nigeria:"NG","North Korea":"KP","North Macedonia":"MK",Norway:"NO",Oman:"OM",Pakistan:"PK",Palau:"PW",Palestine:"PS",Panama:"PA","Papua New Guinea":"PG",Paraguay:"PY",Peru:"PE",Philippines:"PH",Poland:"PL",Portugal:"PT",Qatar:"QA","Republic of the Congo":"CG",Romania:"RO",Russia:"RU",Rwanda:"RW","Saint Kitts and Nevis":"KN","Saint Lucia":"LC","Saint Vincent and the Grenadines":"VC",Samoa:"WS","San Marino":"SM","Sao Tome and Principe":"ST","Saudi Arabia":"SA",Senegal:"SN",Serbia:"RS",Seychelles:"SC","Sierra Leone":"SL",Singapore:"SG",Slovakia:"SK",Slovenia:"SI","Solomon Islands":"SB",Somalia:"SO","South Africa":"ZA","South Korea":"KR","South Sudan":"SS",Spain:"ES","Sri Lanka":"LK",Sudan:"SD",Suriname:"SR",Sweden:"SE",Switzerland:"CH",Syria:"SY",Taiwan:"TW",Tajikistan:"TJ",Tanzania:"TZ",Thailand:"TH","Timor-Leste":"TL",Togo:"TG",Tonga:"TO","Trinidad and Tobago":"TT",Tunisia:"TN",Turkey:"TR",Turkmenistan:"TM",Tuvalu:"TV",Uganda:"UG",Ukraine:"UA","United Arab Emirates":"AE","United Kingdom":"GB","United States":"US",Uruguay:"UY",Uzbekistan:"UZ",Vanuatu:"VU","Vatican City":"VA",Venezuela:"VE",Vietnam:"VN",Yemen:"YE",Zambia:"ZM",Zimbabwe:"ZW"
  };

  let regionNames = null;
  try { regionNames = new Intl.DisplayNames(["ar"], { type:"region" }); } catch {}

  function countryName(value) {
    const name = String(value || "").trim();
    if (lang !== "ar" || !name) return name;
    const code = COUNTRY_CODES[name];
    if (code && regionNames) {
      try { return regionNames.of(code) || name; } catch {}
    }
    return name;
  }

  function categoryName(value) { return lang === "ar" ? (CATEGORY[value] || value) : value; }
  function paymentName(value) { return lang === "ar" ? (PAYMENT[value] || value) : value; }
  function expenseTitle(value) { return lang === "ar" ? (COMMON_TITLE[value] || value) : value; }

  function formatDateText(value) {
    const raw = String(value || "").trim();
    if (lang !== "ar" || !raw) return raw;
    const months = {Jan:"ينا",Feb:"فبر",Mar:"مار",Apr:"أبر",May:"ماي",Jun:"يون",Jul:"يول",Aug:"أغس",Sep:"سبت",Oct:"أكت",Nov:"نوف",Dec:"ديس"};
    const days = {Mon:"الإثنين",Tue:"الثلاثاء",Wed:"الأربعاء",Thu:"الخميس",Fri:"الجمعة",Sat:"السبت",Sun:"الأحد"};
    return raw.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, x => days[x] || x).replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, x => months[x] || x);
  }

  function translateToken(token) {
    const t = token.trim();
    if (!t) return token;
    if (UI.has(t)) return UI.get(t);
    if (CATEGORY[t]) return CATEGORY[t];
    if (PAYMENT[t]) return PAYMENT[t];
    if (COMMON_TITLE[t]) return COMMON_TITLE[t];
    if (COUNTRY_CODES[t]) return countryName(t);
    if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/.test(t)) return formatDateText(t);
    return t;
  }

  function translateCompound(value) {
    const raw = String(value ?? "");
    const text = raw.trim();
    if (!text || lang !== "ar") return raw;
    if (UI.has(text)) return raw.replace(text, UI.get(text));
    if (COUNTRY_CODES[text]) return raw.replace(text, countryName(text));
    if (CATEGORY[text] || PAYMENT[text] || COMMON_TITLE[text]) return raw.replace(text, translateToken(text));

    let m = text.match(/^Overall trip:\s*(.+)$/i);
    if (m) return raw.replace(text, `إجمالي الرحلة: ${formatDateText(m[1])}`);
    m = text.match(/^Country\s+(\d+):\s*(.+)$/i);
    if (m) return raw.replace(text, `الدولة ${m[1]}: ${m[2].replace(/([A-Za-z][A-Za-z ]+)$/, x => countryName(x.trim()))}`);
    m = text.match(/^Traveler\s+(\d+)$/i);
    if (m) return raw.replace(text, `المسافر ${m[1]}`);
    m = text.match(/^(\d+)\s+countries$/i);
    if (m) return raw.replace(text, `${m[1]} دول`);
    m = text.match(/^(\d+)\s+expenses$/i);
    if (m) return raw.replace(text, `${m[1]} مصروفات`);
    m = text.match(/^(\d+)\s+expense$/i);
    if (m) return raw.replace(text, `${m[1]} مصروف`);
    m = text.match(/^(\d+(?:\.\d+)?)%\s*used$/i);
    if (m) return raw.replace(text, `تم استخدام ${m[1]}٪`);
    m = text.match(/^Good morning,\s*(.+)$/i); if (m) return raw.replace(text, `صباح الخير، ${m[1]}`);
    m = text.match(/^Good afternoon,\s*(.+)$/i); if (m) return raw.replace(text, `مساء الخير، ${m[1]}`);
    m = text.match(/^Good evening,\s*(.+)$/i); if (m) return raw.replace(text, `مساء الخير، ${m[1]}`);
    m = text.match(/^You have\s+(.+?)\s+planned for this trip\.?$/i); if (m) return raw.replace(text, `ميزانية رحلتك المخططة هي ${m[1]}.`);
    m = text.match(/^(.+?)\s+still unallocated\.?$/i); if (m) return raw.replace(text, `متبقٍ ${m[1]} لم يُوزَّع بعد.`);
    m = text.match(/^(.+?)\s+over-allocated\.?$/i); if (m) return raw.replace(text, `تم توزيع مبلغ يزيد بمقدار ${m[1]} عن ميزانية الرحلة.`);
    m = text.match(/^(.+?)\s+left$/i); if (m) return raw.replace(text, `متبقٍ ${m[1]}`);
    m = text.match(/^(.+?)\s+over$/i); if (m) return raw.replace(text, `تجاوز بمقدار ${m[1]}`);
    m = text.match(/^At your current pace you may finish around\s+(.+?)\s+under budget\.?$/i); if (m) return raw.replace(text, `بحسب وتيرتك الحالية قد تنهي الرحلة بأقل من الميزانية بحوالي ${m[1]}.`);
    m = text.match(/^At your current pace you may finish around\s+(.+?)\s+over budget\.?$/i); if (m) return raw.replace(text, `بحسب وتيرتك الحالية قد تنهي الرحلة بأعلى من الميزانية بحوالي ${m[1]}.`);
    m = text.match(/^You can spend up to\s+(.+?)\s+more today and stay on your current plan\.?$/i); if (m) return raw.replace(text, `يمكنك إنفاق ما يصل إلى ${m[1]} إضافية اليوم والبقاء ضمن خطتك الحالية.`);

    if (text.includes(" • ")) {
      const parts = text.split(" • ").map(part => {
        let p = part.trim();
        p = p.replace(/^Paid by\s+(.+)$/i, (_, who) => `دفع بواسطة ${who === "Me" ? "أنا" : who}`);
        p = p.replace(/^For\s+(.+)$/i, (_, who) => `لـ ${who === "Me" ? "أنا" : who}`);
        p = p.replace(/^Shared\s*$/i, "مشترك");
        if (COUNTRY_CODES[p]) p = countryName(p);
        else if (CATEGORY[p]) p = CATEGORY[p];
        else if (PAYMENT[p]) p = PAYMENT[p];
        else p = formatDateText(p);
        return p;
      });
      return raw.replace(text, parts.join(" • "));
    }

    let out = text;
    for (const country of Object.keys(COUNTRY_CODES)) {
      if (out.includes(country)) out = out.split(country).join(countryName(country));
    }
    out = formatDateText(out);
    return raw.replace(text, out);
  }

  function rememberAttr(el, attr, value) {
    let map = attrOriginals.get(el);
    if (!map) { map = new Map(); attrOriginals.set(el, map); }
    if (!map.has(attr)) map.set(attr, value);
  }

  function scanText(node) {
    if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) return;
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript")) return;
    if (parent.classList?.contains("version-badge")) return;

    if (lang === "en") {
      if (originals.has(node)) {
        node.nodeValue = originals.get(node);
        originals.delete(node);
      }
      return;
    }

    const current = node.nodeValue;
    const translated = translateCompound(current);
    if (translated !== current) {
      if (!originals.has(node)) originals.set(node, current);
      node.nodeValue = translated;
      parent.classList.add("ts-ar-text");
    }
  }

  function scanAttr(el, attr) {
    if (!el.hasAttribute(attr)) return;
    const current = el.getAttribute(attr) || "";
    const map = attrOriginals.get(el);
    if (lang === "en") {
      const original = map?.get(attr);
      if (original !== undefined) { el.setAttribute(attr, original); map.delete(attr); }
      return;
    }
    const translated = translateCompound(current);
    if (translated !== current) { rememberAttr(el, attr, current); el.setAttribute(attr, translated); }
  }

  function scan(el) {
    if (!(el instanceof Element)) return;
    for (const attr of ["placeholder","title","aria-label"]) scanAttr(el, attr);
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) scanText(child);
      else if (child.nodeType === Node.ELEMENT_NODE) scan(child);
    }
  }

  function flagSvg(current) {
    if (current === "ar") {
      return `<svg viewBox="0 0 36 24" aria-hidden="true"><rect width="36" height="24" rx="3" fill="#fff"/><rect y="8" width="36" height="8" fill="#d72828"/><rect y="16" width="36" height="8" fill="#128a43"/><rect width="10" height="24" fill="#d72828"/><circle cx="5" cy="5" r="2" fill="none" stroke="#fff" stroke-width=".8"/></svg>`;
    }
    return `<svg viewBox="0 0 36 24" aria-hidden="true"><rect width="36" height="24" rx="3" fill="#012169"/><path d="M0 0 36 24M36 0 0 24" stroke="#fff" stroke-width="5"/><path d="M0 0 36 24M36 0 0 24" stroke="#c8102e" stroke-width="2"/><path d="M18 0v24M0 12h36" stroke="#fff" stroke-width="8"/><path d="M18 0v24M0 12h36" stroke="#c8102e" stroke-width="4"/></svg>`;
  }

  function ensureStyles() {
    if (document.getElementById("tripSpendLocaleV700Styles")) return;
    const style = document.createElement("style");
    style.id = "tripSpendLocaleV700Styles";
    style.textContent = `
      .topbar{position:relative}
      #languageToggleV7{position:absolute;top:18px;right:18px;z-index:30;width:48px;height:42px;padding:7px;border:1px solid rgba(120,130,150,.2);border-radius:15px;background:rgba(255,255,255,.84);box-shadow:0 6px 18px rgba(25,40,70,.08);display:grid;place-items:center;cursor:pointer;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
      #languageToggleV7 svg{width:32px;height:22px;display:block;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.12)}
      #languageToggleV7:active{transform:scale(.95)}
      html[data-theme="dark"] #languageToggleV7{background:rgba(19,31,42,.88);border-color:rgba(255,255,255,.10)}
      body.lang-ar{direction:rtl;text-align:right;font-family:system-ui,-apple-system,BlinkMacSystemFont,"SF Arabic","Geeza Pro","Segoe UI",Tahoma,Arial,sans-serif}
      body.lang-ar .app,body.lang-ar main,body.lang-ar main>section,body.lang-ar .card,body.lang-ar .section,body.lang-ar .topbar,body.lang-ar .bottom-nav,body.lang-ar nav{direction:rtl}
      body.lang-ar .grid2,body.lang-ar .section-title,body.lang-ar .modal-head,body.lang-ar .expense-detail-actions{direction:rtl}
      body.lang-ar .ts-ar-text,body.lang-ar .eyebrow,body.lang-ar [class*="eyebrow"],body.lang-ar [class*="kicker"],body.lang-ar [class*="label"],body.lang-ar [class*="title"],body.lang-ar [class*="heading"]{letter-spacing:0!important;word-spacing:normal!important;text-transform:none!important;font-variant-ligatures:common-ligatures contextual!important;font-feature-settings:"liga" 1,"calt" 1!important}
      body.lang-ar input,body.lang-ar textarea,body.lang-ar select{direction:rtl;text-align:right}
      body.lang-ar input::placeholder,body.lang-ar textarea::placeholder{direction:rtl;text-align:right;letter-spacing:0!important}
      body.lang-ar input[type="number"],body.lang-ar input[type="date"],body.lang-ar input[type="time"],body.lang-ar .money,body.lang-ar [class*="amount"],body.lang-ar [class*="date"],body.lang-ar [class*="time"],body.lang-ar [class*="currency"],body.lang-ar .version-badge{direction:ltr!important;unicode-bidi:isolate!important}
      body.lang-ar .bottom-nav{flex-direction:row!important}
      body.lang-ar .smart-summary-arrow,body.lang-ar .trip-switcher-trigger{transform:scaleX(-1)}
      @media(max-width:420px){#languageToggleV7{top:16px;right:16px}}
    `;
    document.head.appendChild(style);
  }

  function mountToggle() {
    let button = document.getElementById("languageToggleV7");
    const topbar = document.querySelector(".topbar") || document.querySelector("#setupView .hero.card");
    if (!topbar) return;
    if (!button) {
      button = document.createElement("button");
      button.id = "languageToggleV7";
      button.type = "button";
      button.addEventListener("click", () => setLanguage(lang === "ar" ? "en" : "ar"));
      topbar.appendChild(button);
    } else if (button.parentElement !== topbar) topbar.appendChild(button);
    button.innerHTML = flagSvg(lang);
    button.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
    button.setAttribute("title", lang === "ar" ? "English" : "العربية");
  }

  function enforceVersion() {
    document.querySelectorAll(".version-badge").forEach(el => { el.textContent = `v${RELEASE}`; el.setAttribute("dir","ltr"); });
  }

  function apply() {
    if (busy || !document.body) return;
    busy = true;
    observer?.disconnect();
    try {
      ensureStyles();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.body.classList.toggle("lang-ar", lang === "ar");
      document.body.dir = lang === "ar" ? "rtl" : "ltr";
      if (lang === "ar") {
        scan(document.body);
        hasTranslatedDocument = true;
      } else if (hasTranslatedDocument) {
        scan(document.body);
        hasTranslatedDocument = false;
      }
      enforceVersion();
      mountToggle();
    } finally {
      busy = false;
      observe();
    }
  }

  function observe() {
    if (!observer || !document.body) return;
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label"]});
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }

  function setLanguage(next) {
    lang = next === "ar" ? "ar" : "en";
    try { localStorage.setItem(KEY, lang); } catch {}
    apply();
    window.dispatchEvent(new CustomEvent("tripspend:language", { detail:{ language:lang } }));
  }

  window.TripSpendLocale = { language:() => lang, setLanguage, t:value => lang === "ar" ? translateCompound(value) : String(value ?? ""), country:countryName, category:categoryName, payment:paymentName, expenseTitle, formatDate:formatDateText, apply, release:RELEASE };
  window.TripSpendI18n = { language:() => lang, setLanguage, apply, translate:value => lang === "ar" ? translateCompound(value) : String(value ?? "") };

  function start() {
    observer = new MutationObserver(() => { if (!busy) queueApply(); });
    const initialApply = () => apply();
    if ("requestIdleCallback" in window) requestIdleCallback(initialApply, { timeout:500 });
    else setTimeout(initialApply, 0);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true}); else start();
})();
