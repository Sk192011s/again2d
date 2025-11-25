import { Handlers } from "$fresh/server.ts";
import { topUp } from "../utils/db.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    return ctx.render();
  },
  async POST(req, ctx) {
    const form = await req.formData();
    const username = form.get("username")?.toString();
    const amount = Number(form.get("amount"));
    const password = form.get("password")?.toString();

    // Admin Password (ဒီမှာ '1234' လို့ထားထားတယ်၊ ကြိုက်သလိုပြင်ပါ)
    if (password !== "1234") return new Response("Password မှားနေပါသည်");

    if (username && amount) {
      await topUp(username, amount);
    }
    
    return ctx.render({ msg: "ငွေဖြည့်သွင်းမှု အောင်မြင်သည်" });
  }
};

export default function Admin({ data }: any) {
  return (
    <div class="p-5 bg-red-50 min-h-screen">
      <h1 class="text-2xl font-bold text-red-600 mb-5">Admin Panel</h1>
      {data?.msg && <div class="bg-green-200 p-2 mb-4">{data.msg}</div>}
      
      <form method="POST" class="bg-white p-5 rounded shadow">
        <label class="block">Admin Password</label>
        <input name="password" type="password" class="border w-full p-2 mb-4" />

        <label class="block">User နာမည်</label>
        <input name="username" class="border w-full p-2 mb-4" placeholder="ငွေဖြည့်ပေးမည့်သူ" />
        
        <label class="block">ပမာဏ</label>
        <input name="amount" type="number" class="border w-full p-2 mb-4" />
        
        <button class="bg-red-600 text-white p-2 rounded w-full">ငွေဖြည့်မယ်</button>
      </form>
    </div>
  );
}
