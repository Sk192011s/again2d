// main.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as db from "./db.ts";
import * as ui from "./ui.ts";

function getSessionId(req: Request) {
  const cookie = req.headers.get("cookie");
  return cookie?.split("session=")[1]?.split(";")[0];
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
      if (res.success) return new Response(ui.loginPage("Success. Please Login."), { headers: { "content-type": "text/html" } });
      return new Response(ui.registerPage(res.msg), { headers: { "content-type": "text/html" } });
    }
    return new Response(ui.registerPage(), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/logout") {
    if (session) await db.logoutUser(session);
    return new Response(null, { status: 302, headers: { "location": "/login", "set-cookie": "session=; Max-Age=0" } });
  }

  // --- Protected Routes ---
  if (!user) return new Response(null, { status: 302, headers: { "location": "/login" } });

  // 1. Home
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(ui.homePage(user), { headers: { "content-type": "text/html" } });
  }

  // 2. Betting (Simplified for this step)
  if (url.pathname === "/bet" && req.method === "POST") {
    const form = await req.formData();
    // (Note: Add detailed betting logic from previous step here if needed. 
    // Simplified here to focus on Profile features)
    const amount = Number(form.get("amount"));
    const num = form.get("number") as string;
    
    // Normal Bet Logic
    const res = await db.placeBet(user, num, amount);
    
    if(res.success) {
        // Prepare simple voucher data
        return new Response(ui.voucherPage({ total: amount, username: user.username }), { headers: { "content-type": "text/html" } });
    }
    return new Response(ui.homePage(user, `<p style="color:red">${res.msg}</p>`), { headers: { "content-type": "text/html" } });
  }

  // 3. PROFILE PAGE (New Feature)
  if (url.pathname === "/profile") {
    const cursor = url.searchParams.get("cursor") || "";
    const tab = url.searchParams.get("tab") || "history";
    
    // Get History (10 items)
    const { items, nextCursor } = await db.getHistory(user.username, cursor, 10);
    
    return new Response(ui.profilePage(user, items, nextCursor, tab), { headers: { "content-type": "text/html" } });
  }

  if (url.pathname === "/profile/password" && req.method === "POST") {
    const form = await req.formData();
    await db.changePassword(user.username, form.get("new_password") as string);
    return new Response(ui.profilePage(user, [], "", "settings", "Password ပြောင်းလဲပြီးပါပြီ"), { headers: { "content-type": "text/html" } });
  }

  // --- Admin ---
  if (url.pathname.startsWith("/admin") && user.role === "admin") {
      if (url.pathname === "/admin") return new Response(ui.adminPage(), { headers: { "content-type": "text/html" } });
      if (url.pathname === "/admin/topup" && req.method === "POST") {
          const form = await req.formData();
          const ok = await db.topUpUser(form.get("username") as string, Number(form.get("amount")));
          return new Response(ui.adminPage(ok ? "Success" : "User Not Found"), { headers: { "content-type": "text/html" } });
      }
      if (url.pathname === "/admin/payout" && req.method === "POST") {
          const form = await req.formData();
          const count = await db.processPayout(form.get("number") as string, Number(form.get("multiplier")));
          return new Response(ui.adminPage(`Payout count: ${count}`), { headers: { "content-type": "text/html" } });
      }
  }

  return new Response("Not Found", { status: 404 });
}

await serve(handler);
