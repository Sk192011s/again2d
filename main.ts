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
    if (input2 === "yes") {
      const reversed = input1.split("").reverse().join("");
      nums.add(reversed);
    }
  } else if (type === "head_tail") {
    const digit = input2;
    for (let i = 0; i <= 9; i++) {
      if (input1 === "head") nums.add(digit + i);
      else nums.add(i + digit);
    }
  } else if (type === "shortcut") {
    if (input1 === "double") ["00","11","22","33","44","55","66","77","88","99"].forEach(n => nums.add(n));
    else if (input1 === "power") ["05","50","16","61","27","72","38","83","49","94"].forEach(n => nums.add(n));
  }
  return Array.from(nums);
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const session = getSessionId(req);
  const user = await db.getUserBySession(session || null);

  // --- Login/Register ---
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

  // --- Main Logic ---
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(ui.homePage(user), { headers: { "content-type": "text/html" } });
  }

  // --- BETTING & VOUCHER GENERATION ---
  if (url.pathname === "/bet" && req.method === "POST") {
    const form = await req.formData();
    const type = form.get("type") as string;
    const amount = Number(form.get("amount"));
    
    // Generate Numbers
    let numbersToBet: string[] = [];
    if (type === "normal") {
      numbersToBet = generateNumbers("normal", form.get("number") as string, form.get("r_bet") as string);
    } else if (type === "head_tail") {
      numbersToBet = generateNumbers("head_tail", form.get("position") as string, form.get("digit") as string);
    } else if (type === "shortcut") {
      numbersToBet = generateNumbers("shortcut", form.get("set") as string, "");
    }

    const totalCost = amount * numbersToBet.length;
    
    // Check Balance
    const currentUser = (await db.getUserBySession(session))!;
    if (currentUser.balance < totalCost) {
      const msg = `<div style="background:#f8d7da; color:#721c24; padding:10px; border-radius:5px;">❌ လက်ကျန်ငွေမလောက်ပါ။ (လိုအပ်ငွေ: ${totalCost} ကျပ်)</div>`;
      return new Response(ui.homePage(currentUser, msg), { headers: { "content-type": "text/html" } });
    }

    // Place Bets & Prepare Voucher Data
    const betDetails = [];
    for (const num of numbersToBet) {
      const currentRes = await db.kv.get<db.User>(["users", currentUser.username]);
      if(currentRes.value) {
         await db.placeBet(currentRes.value, num, amount);
         betDetails.push({ num: num, amt: amount });
      }
    }

    // Render Voucher Page
    const voucherData = {
        username: currentUser.username,
        bets: betDetails,
        total: totalCost
    };
    
    return new Response(ui.voucherPage(voucherData), { headers: { "content-type": "text/html" } });
  }

  // --- Admin ---
  if (url.pathname.startsWith("/admin") && user.role === "admin") {
    if (url.pathname === "/admin") return new Response(ui.adminPage(), { headers: { "content-type": "text/html" } });
    
    if (url.pathname === "/admin/topup" && req.method === "POST") {
       const form = await req.formData();
       const uName = form.get("username") as string;
       const amt = Number(form.get("amount"));
       const tUser = await db.kv.get<db.User>(["users", uName]);
       if(tUser.value) {
         await db.kv.set(["users", uName], {...tUser.value, balance: tUser.value.balance + amt});
         return new Response(ui.adminPage(`<p style="color:green">Success Topup</p>`), { headers: { "content-type": "text/html" } });
       }
       return new Response(ui.adminPage(`<p style="color:red">User not found</p>`), { headers: { "content-type": "text/html" } });
    }

    if (url.pathname === "/admin/payout" && req.method === "POST") {
      const form = await req.formData();
      const count = await db.processPayout(form.get("number") as string, Number(form.get("multiplier")));
      return new Response(ui.adminPage(`<p style="color:green">Payout Done (${count} winners)</p>`), { headers: { "content-type": "text/html" } });
    }
  }

  return new Response("Not Found", { status: 404 });
}

await serve(handler);
