// main.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as db from "./db.ts";
import * as ui from "./ui.ts";

function getSessionId(req: Request) {
  const cookie = req.headers.get("cookie");
  return cookie?.split("session=")[1]?.split(";")[0];
}

function generateNumbers(type: string, input1: string, input2: string): string[] {
  const nums = new Set<string>();
  if (type === "normal") {
    nums.add(input1);
    if (input2 === "yes") nums.add(input1.split("").reverse().join(""));
  } 
  else if (type === "head_tail") {
    const digit = input2;
    for (let i = 0; i <= 9; i++) {
      if (input1 === "head") nums.add(digit + i);
      else nums.add(i + digit);
    }
  } 
  else if (type === "shortcut") {
    if (input1 === "double") ["00","11","22","33","44","55","66","77","88","99"].forEach(n => nums.add(n));
    else if (input1 === "power") ["05","50","16","61","27","72","38","83","49","94"].forEach(n => nums.add(n));
  }
  else if (type === "break") {
    const excludeDigits = input1.split("");
    for (let i = 0; i <= 99; i++) {
        const numStr = String(i).padStart(2, '0');
        const d1 = numStr[0];
        const d2 = numStr[1];
        const hasRelatedDigit = excludeDigits.includes(d1) || excludeDigits.includes(d2);
        if (hasRelatedDigit) {
            const isExcludedDouble = (d1 === d2) && excludeDigits.includes(d1);
            const isInteraction = excludeDigits.includes(d1) && excludeDigits.includes(d2);
            if (!isExcludedDouble && !isInteraction) nums.add(numStr);
        }
    }
  }
  return Array.from(nums);
}

// Updated Check Logic: Uses both GameStatus and Actual Time
async function checkBettingStatus(gameStatus: db.GameStatus) {
    // Note: db.getGameStatus() now auto-updates currentSession based on time if needed.
    // So gameStatus.currentSession should be correct for the time of day.

    if (!gameStatus.isOpen) return { allowed: false, msg: "ပွဲပိတ်ထားပါသည် (Admin မဖွင့်သေးပါ)" };

    const now = new Date();
    const mmTime = new Date(now.getTime() + (6.5 * 60 * 60 * 1000));
    const totalMinutes = mmTime.getUTCHours() * 60 + mmTime.getUTCMinutes();
    
    // Morning Deadline (11:45 = 705 mins)
    if (gameStatus.currentSession === 'morning' && totalMinutes >= 705) {
        return { allowed: false, msg: "မနက်ပိုင်း ပိတ်ချိန်ကျော်လွန်သွားပါပြီ (11:45 AM)" };
    }
    // Evening Deadline (15:45 = 945 mins)
    if (gameStatus.currentSession === 'evening' && totalMinutes >= 945) {
        return { allowed: false, msg: "ညနေပိုင်း ပိတ်ချိန်ကျော်လွန်သွားပါပြီ (3:45 PM)" };
    }

    return { allowed: true };
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const session = getSessionId(req);
  const user = await db.getUserBySession(session || null);

  if (url.pathname === "/login") {
     if(req.method==="POST") {
        const form = await req.formData();
        const res = await db.loginUser(form.get("username") as string, form.get("password") as string);
        if(res.success) return new Response(null, {status:303, headers:{"location":"/", "set-cookie":`session=${res.session}; Path=/`}});
        return new Response(ui.loginPage(res.msg), {headers:{"content-type":"text/html"}});
     }
     return new Response(ui.loginPage(), {headers:{"content-type":"text/html"}});
  }
  if (url.pathname === "/register") {
     if(req.method==="POST") {
        const form = await req.formData();
        const res = await db.registerUser(form.get("username") as string, form.get("password") as string);
        if(res.success) return new Response(ui.loginPage("Success"), {headers:{"content-type":"text/html"}});
        return new Response(ui.registerPage(res.msg), {headers:{"content-type":"text/html"}});
     }
     return new Response(ui.registerPage(), {headers:{"content-type":"text/html"}});
  }
  if (url.pathname === "/logout") {
     if(session) await db.logoutUser(session);
     return new Response(null, {status:302, headers:{"location":"/login"}});
  }

  if (!user) return new Response(null, {status:302, headers:{"location":"/login"}});

  if (url.pathname === "/") {
     const status = await db.getGameStatus(); // This triggers auto-update logic in db.ts
     return new Response(ui.homePage(user, status), {headers:{"content-type":"text/html"}});
  }

  if (url.pathname === "/results") {
     const res = await db.getWinResults();
     return new Response(ui.winHistoryPage(res), {headers:{"content-type":"text/html"}});
  }

  if (url.pathname === "/profile") {
     const {items} = await db.getHistory(user.username, "", 50);
     return new Response(ui.profilePage(user, items), {headers:{"content-type":"text/html"}});
  }

  if (url.pathname === "/profile/password" && req.method === "POST") {
    const form = await req.formData();
    await db.changePassword(user.username, form.get("new_password") as string);
    const {items} = await db.getHistory(user.username, "", 50);
    return new Response(ui.profilePage(user, items, "Password ပြောင်းလဲပြီးပါပြီ"), {headers:{"content-type":"text/html"}});
  }

  if (url.pathname === "/profile/clear" && req.method === "POST") {
      await db.clearUserHistory(user.username);
      const {items} = await db.getHistory(user.username, "", 50);
      return new Response(ui.profilePage(user, items, "မှတ်တမ်းများကို ရှင်းလင်းပြီးပါပြီ"), {headers:{"content-type":"text/html"}});
  }

  if (url.pathname === "/bet" && req.method === "POST") {
     const status = await db.getGameStatus();
     const check = await checkBettingStatus(status);
     
     if(!check.allowed) return new Response(ui.homePage(user, status, `❌ ${check.msg}`), {headers:{"content-type":"text/html"}});

     const form = await req.formData();
     const type = form.get("type") as string;
     const amount = Number(form.get("amount"));

     if(amount < 100 || amount > 100000) return new Response(ui.homePage(user, status, "❌ Amount must be 100-100,000"), {headers:{"content-type":"text/html"}});

     let nums: string[] = [];
     if(type === 'break') nums = generateNumbers("break", form.get("digits") as string, "");
     else if (type === 'normal') nums = generateNumbers("normal", form.get("number") as string, form.get("r_bet") as string);
     else if (type === 'head_tail') nums = generateNumbers("head_tail", form.get("position") as string, form.get("digit") as string);
     else if (type === 'shortcut') nums = generateNumbers("shortcut", form.get("set") as string, "");

     if(nums.length === 0) return new Response(ui.homePage(user, status, "❌ ဂဏန်းရွေးချယ်မှု မှားယွင်းနေပါသည်"), {headers:{"content-type":"text/html"}});

     const totalCost = amount * nums.length;
     const currentUser = (await db.getUserBySession(session))!;

     if(currentUser.balance < totalCost) return new Response(ui.homePage(user, status, `❌ လက်ကျန်ငွေ မလောက်ပါ (လိုငွေ: ${totalCost})`), {headers:{"content-type":"text/html"}});

     const betList = [];
     for(const n of nums) {
         const u = await db.kv.get<db.User>(["users", currentUser.username]);
         if(u.value) {
             await db.placeBet(u.value, n, amount);
             betList.push({num:n, amt:amount});
         }
     }
     
     return new Response(ui.voucherPage({username:currentUser.username, total:totalCost, bets:betList}), {headers:{"content-type":"text/html"}});
  }

  if(url.pathname.startsWith("/admin") && user.role === "admin") {
      if(url.pathname === "/admin") return new Response(ui.adminPage(), {headers:{"content-type":"text/html"}});
      if(url.pathname === "/admin/topup" && req.method==="POST") {
          const f = await req.formData();
          const ok = await db.topUpUser(f.get("username") as string, Number(f.get("amount")));
          return new Response(ui.adminPage(ok?"Success":"Fail"), {headers:{"content-type":"text/html"}});
      }
      if(url.pathname === "/admin/payout" && req.method==="POST") {
          const f = await req.formData();
          const count = await db.processPayout(f.get("number") as string, 80, f.get("session") as any);
          return new Response(ui.adminPage(`Paid ${count} winners`), {headers:{"content-type":"text/html"}});
      }
  }

  return new Response("404", {status:404});
}

await serve(handler);
