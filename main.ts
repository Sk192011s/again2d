// main.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as db from "./db.ts";
import * as ui from "./ui.ts";

// Cookie Helper
function getSessionId(req: Request) {
  const cookie = req.headers.get("cookie");
  return cookie?.split("session=")[1]?.split(";")[0];
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const session = getSessionId(req);
  const user = await db.getUserBySession(session || null);

  // --- 1. Login & Register Routes (အကောင့်မရှိသေးရင် ဒီကိုအရင်လာမယ်) ---
  
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
      if (res.success) {
        return new Response(ui.loginPage("အကောင့်ဖွင့်ပြီးပါပြီ။ Login ဝင်ပါ။"), { headers: { "content-type": "text/html" } });
      }
      return new Response(ui.registerPage(res.msg), { headers: { "content-type": "text/html" } });
    }
    return new Response(ui.registerPage(), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/logout") {
    if (session) await db.logoutUser(session);
    return new Response(null, { status: 302, headers: { "location": "/login", "set-cookie": "session=; Max-Age=0" } });
  }

  // --- အောက်ကအပိုင်းတွေက Login ဝင်ထားမှ သုံးလို့ရမယ် ---
  if (!user) {
    return new Response(null, { status: 302, headers: { "location": "/login" } });
  }

  // 2. Home Page (Betting)
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(ui.homePage(user), { headers: { "content-type": "text/html" } });
  }

  // 3. Bet Action
  if (url.pathname === "/bet" && req.method === "POST") {
    const form = await req.formData();
    const result = await db.placeBet(user, form.get("number") as string, Number(form.get("amount")));
    const msg = result.success 
      ? `<div class="msg success">✅ ထိုးပြီးပါပြီ။</div>` 
      : `<div class="msg error">❌ ${result.msg}</div>`;
    
    // Update user balance to show correctly
    const updatedUser = (await db.getUserBySession(session))!;
    return new Response(ui.homePage(updatedUser, msg), { headers: { "content-type": "text/html" } });
  }

  // --- ADMIN ROUTES ---
  if (url.pathname.startsWith("/admin")) {
    if (user.role !== "admin") return new Response("Access Denied", { status: 403 });

    if (url.pathname === "/admin" && req.method === "GET") {
      return new Response(ui.adminPage(), { headers: { "content-type": "text/html" } });
    }

    // ငွေဖြည့်ပေးခြင်း
    if (url.pathname === "/admin/topup" && req.method === "POST") {
      const form = await req.formData();
      const username = form.get("username") as string;
      const amount = Number(form.get("amount"));
      
      // Reuse register logic partially or direct update. Let's update directly.
      const targetUserRes = await db.kv.get<db.User>(["users", username]);
      if(targetUserRes.value) {
         const targetUser = targetUserRes.value;
         await db.kv.set(["users", username], {...targetUser, balance: targetUser.balance + amount});
         return new Response(ui.adminPage(`<div class="msg success">✅ ${username} ကို ${amount} ဖြည့်ပြီး။</div>`), { headers: { "content-type": "text/html" } });
      }
      return new Response(ui.adminPage(`<div class="msg error">❌ User မရှိပါ။</div>`), { headers: { "content-type": "text/html" } });
    }

    // လျော်ကြေးရှင်းခြင်း
    if (url.pathname === "/admin/payout" && req.method === "POST") {
      const form = await req.formData();
      const number = form.get("number") as string;
      const multiplier = Number(form.get("multiplier"));

      const count = await db.processPayout(number, multiplier);
      return new Response(ui.adminPage(`<div class="msg success">✅ ပြီးပါပြီ။ ပေါက်သူ ${count} ယောက်ကို လျော်ကြေးထည့်ပေးလိုက်ပါပြီ။</div>`), { headers: { "content-type": "text/html" } });
    }
  }

  return new Response("Not Found", { status: 404 });
}

await serve(handler);
