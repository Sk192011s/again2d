import { Handlers, PageProps } from "$fresh/server.ts";
import { getUser, bet } from "../utils/db.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    // ရိုးရှင်းသော Login (Cookie မသုံးဘဲ URL query နဲ့စမ်းမယ်)
    const url = new URL(req.url);
    const username = url.searchParams.get("user");
    
    if (!username) return ctx.render({ loggedIn: false });
    
    const user: any = await getUser(username);
    return ctx.render({ loggedIn: true, username, balance: user.balance });
  },
  
  async POST(req, ctx) {
    const form = await req.formData();
    const username = form.get("username")?.toString();
    const num = form.get("num")?.toString();
    const amount = Number(form.get("amount"));

    if (!username) return new Response("Login အရင်ဝင်ပါ");
    
    await bet(username!, num!, amount);
    
    // ထိုးပြီးရင် မူလနေရာပြန်ပို့
    return new Response("", {
      status: 303,
      headers: { Location: `/?user=${username}` },
    });
  }
};

export default function Home({ data }: PageProps) {
  if (!data.loggedIn) {
    return (
      <div class="p-5">
        <h1 class="text-2xl mb-4">2D Website</h1>
        <form action="/" method="GET">
          <input name="user" placeholder="သင့်နာမည်ရိုက်ထည့်ပါ" class="border p-2" required />
          <button class="bg-blue-500 text-white p-2 ml-2 rounded">အကောင့်ဝင်မယ်</button>
        </form>
      </div>
    );
  }

  return (
    <div class="p-5 max-w-md mx-auto">
      <div class="flex justify-between items-center bg-gray-100 p-4 rounded mb-5">
        <h2 class="font-bold">{data.username}</h2>
        <p class="text-green-700 font-bold">{data.balance} Ks</p>
      </div>

      <form method="POST" class="border p-4 rounded shadow">
        <input type="hidden" name="username" value={data.username} />
        <label class="block mb-2">ထိုးမည့် ဂဏန်း</label>
        <input name="num" type="text" maxLength={2} class="border w-full p-2 mb-4" required />
        
        <label class="block mb-2">ငွေပမာဏ</label>
        <input name="amount" type="number" class="border w-full p-2 mb-4" required />
        
        <button class="w-full bg-green-600 text-white p-3 rounded">ထိုးမယ်</button>
      </form>
      <p class="mt-4 text-sm text-gray-500">* Admin ထံ ငွေဖြည့်ပြီးမှ ထိုးလို့ရပါမယ်။</p>
    </div>
  );
}
