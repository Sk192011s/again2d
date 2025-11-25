/// <reference lib="deno.unstable" />

export const kv = await Deno.openKv();

// User တည်ဆောက်ခြင်း/စစ်ဆေးခြင်း
export async function getUser(username: string) {
  const res = await kv.get(["users", username]);
  return res.value || { balance: 0 };
}

// Admin ငွေဖြည့်ခြင်း
export async function topUp(username: string, amount: number) {
  const key = ["users", username];
  const user: any = await getUser(username);
  const newBalance = (user.balance || 0) + amount;
  await kv.set(key, { balance: newBalance });
}

// ထိုးသား ထိုးခြင်း
export async function bet(username: string, num: string, amount: number) {
  const key = ["users", username];
  const user: any = await getUser(username);
  
  if (user.balance < amount) return { success: false, msg: "ပိုက်ဆံမလောက်ပါ" };

  const newBalance = user.balance - amount;
  
  // ငွေဖြတ်မယ်၊ မှတ်တမ်းတင်မယ်
  const betKey = ["bets", username, Date.now()];
  
  const op = kv.atomic()
    .set(key, { balance: newBalance })
    .set(betKey, { num, amount, time: new Date().toLocaleString() });
    
  await op.commit();
  return { success: true, msg: "ထိုးပြီးပါပြီ" };
}
