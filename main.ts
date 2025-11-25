// main.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as db from "./db.ts";
import * as ui from "./ui.ts";

function getSessionId(req: Request) {
  const cookie = req.headers.get("cookie");
  return cookie?.split("session=")[1]?.split(";")[0];
}

// Betting Number Generator
function generateNumbers(type: string, input1: string, input2: string): string[] {
  const nums = new Set<string>();
  if (type === "normal") {
    nums.add(input1);
    if (input2 === "yes") nums.add(input1.split("").reverse().join(""));
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

  // --- Auth Routes ---
  if (url.pathname === "/login") {
    if (req.method === "POST") {
      const form = await req.formData();
      const res = await db.loginUser(form.get("username") as string, form.get("password") as string);
      if (res.success) {
        return new Response(null, { status: 303, headers: { "location": "/", "set-cookie": `session=${res.session}; HttpOnly; Path=/` } });
      }
      return new Response(ui.loginPage(res.msg), { headers: { "content-type": "text/html" } });
    }
    return new Response(ui.loginPage(), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/register") {
    if (req.method === "POST") {
      const form = await req.formData();
      const res = await db.registerUser(form.get("username") as string, form.get("password") as string);
      if (res.success) return new Response(ui.loginPage("အကောင့်ဖွင့်ပြီးပါပြီ။ ဝင်ရောက်ပါ။"), { headers: { "content-type": "text/html" } });
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

  // --- Betting Handler ---
  if (url.pathname === "/bet" && req.method === "POST") {
    const form = await req.formData();
    const type = form.get("type") as string;
    const amount = Number(form.get("amount"));
    
    // Generate Numbers based on Type
    let numbersToBet: string[] = [];
    if (type === "normal") {
      numbersToBet = generateNumbers("normal", form.get("number") as string, form.get("r_bet") as string);
    } else if (type === "head_tail") {
      numbersToBet = generateNumbers("head_tail", form.get("position") as string, form.get("digit") as string);
    } else if (type === "shortcut") {
      numbersToBet = generateNumbers("shortcut", form.get("set") as string, "");
    }

    const totalCost = amount * numbersToBet.length;
    const currentUser = (await db.getUserBySession(session))!;

    if (currentUser.balance < totalCost) {
      return new Response(ui.homePage(currentUser, `❌ လက်ကျန်ငွေမလောက်ပါ။ (လိုအပ်ငွေ: ${totalCost} ကျပ်)`), { headers: { "content-type": "text/html" } });
    }

    const betDetails = [];
    for (const num of numbersToBet) {
      const u = await db.kv.get<db.User>(["users", currentUser.username]);
      if(u.value) {
         await db.placeBet(u.value, num, amount);
         betDetails.push({ num, amt: amount });
      }
    }
    
    return new Response(ui.voucherPage({ username: currentUser.username, bets: betDetails, total: totalCost }), { headers: { "content-type": "text/html" } });
  }

  // --- Profile Handler ---
  if (url.pathname === "/profile") {
    const cursor = url.searchParams.get("cursor") || "";
    const tab = url.searchParams.get("tab") || "history";
    const { items, nextCursor } = await db.getHistory(user.username, cursor, 10);
    return new Response(ui.profilePage(user, items, nextCursor, tab), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/profile/password" && req.method === "POST") {
    const form = await req.formData();
    await db.changePassword(user.username, form.get("new_password") as string);
    return new Response(ui.profilePage(user, [], "", "settings", "Password ပြောင်းလဲပြီးပါပြီ"), { headers: { "content-type": "text/html" } });
  }

  // --- Admin Handler ---
  if (url.pathname.startsWith("/admin") && user.role === "admin") {
      if (url.pathname === "/admin") return new Response(ui.adminPage(), { headers: { "content-type": "text/html" } });
      
      // Topup
      if (url.pathname === "/admin/topup" && req.method === "POST") {
          const form = await req.formData();
          const ok = await db.topUpUser(form.get("username") as string, Number(form.get("amount")));
          return new Response(ui.adminPage(ok ? "Topup Success" : "User Not Found"), { headers: { "content-type": "text/html" } });
      }
      
      // Payout
      if (url.pathname === "/admin/payout" && req.method === "POST") {
          const form = await req.formData();
          const sessionType = form.get("session") as "morning" | "evening";
          const count = await db.processPayout(form.get("number") as string, Number(form.get("multiplier")), sessionType);
          return new Response(ui.adminPage(`Payout Done (${sessionType}): ${count} winners`), { headers: { "content-type": "text/html" } });
      }

      // Reset Password
      if (url.pathname === "/admin/resetpass" && req.method === "POST") {
          const form = await req.formData();
          const ok = await db.adminResetPassword(form.get("username") as string, form.get("new_password") as string);
          return new Response(ui.adminPage(ok ? "Password Reset Success" : "User Not Found"), { headers: { "content-type": "text/html" } });
      }
  }

  return new Response("Not Found", { status: 404 });
}

await serve(handler);
