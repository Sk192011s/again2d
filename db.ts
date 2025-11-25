// db.ts
export const kv = await Deno.openKv();

// User ပုံစံ
export interface User {
  username: string;
  balance: number;
  role: "admin" | "user";
}

// User ရှိမရှိ စစ်ပေးတဲ့ function
export async function getUser(username: string) {
  const res = await kv.get<User>(["users", username]);
  return res.value;
}

// User အသစ်ဆောက်ခြင်း (သို့) ငွေဖြည့်ခြင်း
export async function upsertUser(username: string, amount: number, isAdmin = false) {
  const user = await getUser(username);
  const currentBalance = user ? user.balance : 0;
  
  const newUser: User = {
    username,
    balance: currentBalance + amount,
    role: isAdmin ? "admin" : (user?.role || "user"),
  };
  
  await kv.set(["users", username], newUser);
  return newUser;
}

// ဂဏန်းထိုးခြင်း (ပိုက်ဆံဖြတ်ပြီး မှတ်တမ်းတင်)
export async function placeBet(username: string, number: string, amount: number) {
  const user = await getUser(username);
  
  if (!user) return { success: false, msg: "User မရှိပါ" };
  if (user.balance < amount) return { success: false, msg: "ပိုက်ဆံ မလောက်ပါ" };

  const betId = crypto.randomUUID();
  const bet = { username, number, amount, time: Date.now() };

  const res = await kv.atomic()
    .check({ key: ["users", username], versionstamp: (await kv.get(["users", username])).versionstamp })
    .set(["users", username], { ...user, balance: user.balance - amount })
    .set(["bets", betId], bet)
    .commit();

  if (!res.ok) return { success: false, msg: "ထပ်မံ ကြိုးစားပါ" };
  
  return { success: true, msg: "အောင်မြင်ပါသည်", newBalance: user.balance - amount };
}
