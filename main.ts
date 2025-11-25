// main.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as db from "./db.ts";
import * as ui from "./ui.ts";

function getSessionId(req: Request) {
  const cookie = req.headers.get("cookie");
  return cookie?.split("session=")[1]?.split(";")[0];
}

// ဂဏန်းတွက်ချက်ပေးသော Helper Function
function generateNumbers(type: string, input1: string, input2: string): string[] {
  const nums = new Set<string>();

  if (type === "normal") {
    // input1 = number, input2 = "yes" (if R checked)
    nums.add(input1);
    if (input2 === "yes") {
      const reversed = input1.split("").reverse().join("");
      nums.add(reversed); // Set သုံးထားလို့ 55 ဆိုရင် နှစ်ခါမဝင်ဘူး
    }
  } 
  else if (type === "head_tail") {
    // input1 = position (head/tail), input2 = digit
    const digit = input2;
    for (let i = 0; i <= 9; i++) {
      if (input1 === "head") nums.add(digit + i); // e.g., 10, 11...
      else nums.add(i + digit); // e.g., 01, 11...
    }
  } 
  else if (type === "shortcut") {
    // input1 = set (double/power)
    if (input1 === "double") {
      ["00","11","22","33","44","55","66","77","88","99"].forEach(n => nums.add(n));
    }
    else if (input1 === "power") {
      // Power Pairs: 0-5, 1-6, 2-7, 3-8, 4-9 (with R)
      ["05","50","16","61","27","72","38","83","49","94"].forEach(n => nums.add(n));
    }
  }
  return Array.from(nums);
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const session = getSessionId(req);
  const user = await db.getUserBySession(session || null);

  // --- Login/Register Logic ---
  if (url.pathname === "/login") {
    if (req.method === "POST") {
      const form = await req.formData();
      const res = await db.loginUser(form.get("username") as string, form.get("password") as string);
      if (res.success) {
        const headers = new Headers({ "location": "/", "set-cookie": `session=${res.session}; HttpOnly; Path=/` });
        return new Response(null, { status: 303, headers });
      }
      return new Response(ui.loginPage(res.msg), { headers: { "content-type": "text/html" } });
    }
    return new Response(ui.loginPage(), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/register") {
    if (req.method === "POST") {
      const form = await req.formData();
      const res = await db.registerUser(form.get("username") as string, form.get("password") as string);
      if (res.success) return new Response(ui.loginPage("အကောင့်ဖွင့်ပြီး။ Login ဝင်ပါ။"), { headers: { "content-type": "text/html" } });
      return new Response(ui.registerPage(res.msg), { headers: { "content-type": "text/html" } });
    }
    return new Response(ui.registerPage(), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/logout") {
    if (session) await db.logoutUser(session);
    return new Response(null, { status: 302, headers: { "location": "/login", "set-cookie": "session=; Max-Age=0" } });
  }

  if (!user) return new Response(null, { status: 302, headers: { "location": "/login" } });

  // --- Betting Logic ---
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(ui.homePage(user), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/bet" && req.method === "POST") {
    const form = await req.formData();
    const type = form.get("type") as string;
    const amount = Number(form.get("amount"));
    
    let numbersToBet: string[] = [];

    // Form ကနေ Data တွေယူပြီး ဂဏန်းစာရင်း ထုတ်မယ်
    if (type === "normal") {
      numbersToBet = generateNumbers("normal", form.get("number") as string, form.get("r_bet") as string);
    } else if (type === "head_tail") {
      numbersToBet = generateNumbers("head_tail", form.get("position") as string, form.get("digit") as string);
    } else if (type === "shortcut") {
      numbersToBet = generateNumbers("shortcut", form.get("set") as string, "");
    }

    // ၁. ပိုက်ဆံလောက်လား အရင်စစ်မယ် (Transaction မစခင်)
    const totalCost = amount * numbersToBet.length;
    
    // User Balance အသစ်ပြန်ဆွဲ (To ensure accuracy)
    const currentUser = (await db.getUserBySession(session))!;
    
    if (currentUser.balance < totalCost) {
      const msg = `<div class="msg error">❌ လက်ကျန်ငွေမလောက်ပါ။ (စုစုပေါင်း ${totalCost} ကျပ် လိုအပ်သည်)</div>`;
      return new Response(ui.homePage(currentUser, msg), { headers: { "content-type": "text/html" } });
    }

    // ၂. Loop ပတ်ပြီး ထိုးမယ်
    let successCount = 0;
    for (const num of numbersToBet) {
      // User data ကို loop တစ်ခါပတ်တိုင်း update မလုပ်ပဲ၊ db.placeBet function က handle လုပ်တာမို့
      // ဒီနေရာမှာ user object ကို refresh လုပ်ပြီး ပို့ပေးရမယ် သို့မဟုတ် db.placeBet ကို user name ပဲပို့တာ ပိုကောင်းမယ်။
      // ဒါပေမယ့် ရှိပြီးသား db.ts ကို မပြင်ချင်တဲ့အတွက် လက်ရှိ user balance ကို လျှော့လျှော့သွားမယ်။
      
      const currentRes = await db.kv.get<db.User>(["users", currentUser.username]);
      if(currentRes.value) {
         const res = await db.placeBet(currentRes.value, num, amount);
         if (res.success) successCount++;
      }
    }

    const msg = `<div class="msg success">✅ ${successCount} ကွက် ထိုးပြီးပါပြီ။ (ကုန်ကျငွေ: ${successCount * amount} ကျပ်)</div>`;
    
    // Update display balance
    const updatedUser = (await db.getUserBySession(session))!;
    return new Response(ui.homePage(updatedUser, msg), { headers: { "content-type": "text/html" } });
  }

  // --- Admin Logic ---
  if (url.pathname.startsWith("/admin") && user.role === "admin") {
    if (url.pathname === "/admin") return new Response(ui.adminPage(), { headers: { "content-type": "text/html" } });
    
    if (url.pathname === "/admin/topup" && req.method === "POST") {
       const form = await req.formData();
       const uName = form.get("username") as string;
       const amt = Number(form.get("amount"));
       const tUser = await db.kv.get<db.User>(["users", uName]);
       if(tUser.value) {
         await db.kv.set(["users", uName], {...tUser.value, balance: tUser.value.balance + amt});
         return new Response(ui.adminPage(`<div class="msg success">Topup Success</div>`), { headers: { "content-type": "text/html" } });
       }
       return new Response(ui.adminPage(`<div class="msg error">User not found</div>`), { headers: { "content-type": "text/html" } });
    }

    if (url.pathname === "/admin/payout" && req.method === "POST") {
      const form = await req.formData();
      const count = await db.processPayout(form.get("number") as string, Number(form.get("multiplier")));
      return new Response(ui.adminPage(`<div class="msg success">Payout Done for ${count} tickets.</div>`), { headers: { "content-type": "text/html" } });
    }
  }

  return new Response("Not Found", { status: 404 });
}

await serve(handler);
