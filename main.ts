// main.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as db from "./db.ts";
import * as ui from "./ui.ts";

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // 1. ပင်မစာမျက်နှာ (Home)
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(ui.homePage(), { headers: { "content-type": "text/html" } });
  }

  // 2. ဂဏန်းထိုးခြင်း (Bet Action)
  if (url.pathname === "/bet" && req.method === "POST") {
    const form = await req.formData();
    const username = form.get("username") as string;
    const number = form.get("number") as string;
    const amount = Number(form.get("amount"));

    const result = await db.placeBet(username, number, amount);
    const message = result.success 
      ? `<span class="success">✅ ${result.msg}. လက်ကျန်: ${result.newBalance} ကျပ်</span>`
      : `<span class="error">❌ ${result.msg}</span>`;
      
    return new Response(ui.homePage(message), { headers: { "content-type": "text/html" } });
  }

  // 3. လက်ကျန်ငွေစစ်ခြင်း
  if (url.pathname === "/check" && req.method === "GET") {
      const username = url.searchParams.get("username");
      const user = await db.getUser(username || "");
      const msg = user 
        ? `<span class="success">💰 ${user.username} ၏ လက်ကျန်ငွေ: ${user.balance} ကျပ်</span>` 
        : `<span class="error">❌ User မရှိပါ</span>`;
      return new Response(ui.homePage(msg), { headers: { "content-type": "text/html" } });
  }

  // 4. Admin စာမျက်နှာ
  if (url.pathname === "/admin" && req.method === "GET") {
    return new Response(ui.adminPage(), { headers: { "content-type": "text/html" } });
  }

  // 5. ငွေဖြည့်ခြင်း (Admin Action)
  if (url.pathname === "/topup" && req.method === "POST") {
    const form = await req.formData();
    const username = form.get("username") as string;
    const amount = Number(form.get("amount"));

    await db.upsertUser(username, amount);
    const msg = `<span class="success">✅ ${username} ကို ${amount} ကျပ် ဖြည့်ပြီးပါပြီ။</span>`;

    return new Response(ui.adminPage(msg), { headers: { "content-type": "text/html" } });
  }

  return new Response("Not Found", { status: 404 });
}

console.log("Server started...");
await serve(handler);
