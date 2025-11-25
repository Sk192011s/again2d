// db.ts
export const kv = await Deno.openKv();

export interface User {
  username: string;
  password: string;
  balance: number;
  role: "admin" | "user";
  session?: string;
}

export interface HistoryItem {
  id: string;
  type: "bet" | "topup" | "win"; 
  description: string;
  amount: number;
  timestamp: number;
}

// --- User Management ---
export async function getUser(username: string) {
  const res = await kv.get<User>(["users", username]);
  return res.value;
}

export async function registerUser(username: string, password: string) {
  const existing = await getUser(username);
  if (existing) return { success: false, msg: "ဒီအမည်နှင့် ရှိပြီးသားဖြစ်သည်" };

  const newUser: User = { username, password, balance: 0, role: username === "admin" ? "admin" : "user" };
  await kv.set(["users", username], newUser);
  return { success: true, msg: "Success" };
}

export async function loginUser(username: string, password: string) {
  const user = await getUser(username);
  if (!user || user.password !== password) return { success: false, msg: "အမည် (သို့) စကားဝှက် မှားယွင်းနေသည်" };

  const session = crypto.randomUUID();
  await kv.set(["users", username], { ...user, session });
  await kv.set(["sessions", session], username);
  return { success: true, session };
}

export async function getUserBySession(session: string | null) {
  if (!session) return null;
  const usernameRes = await kv.get<string>(["sessions", session]);
  if (!usernameRes.value) return null;
  return await getUser(usernameRes.value);
}

export async function logoutUser(session: string) {
  await kv.delete(["sessions", session]);
}

// User Password ကို ကိုယ်တိုင်ချိန်းခြင်း
export async function changePassword(username: string, newPass: string) {
  const user = await getUser(username);
  if(user) {
    await kv.set(["users", username], { ...user, password: newPass });
    return true;
  }
  return false;
}

// Admin က Password Reset လုပ်ပေးခြင်း
export async function adminResetPassword(username: string, newPass: string) {
  const user = await getUser(username);
  if (!user) return false;
  await kv.set(["users", username], { ...user, password: newPass });
  return true;
}

// --- Betting & Transaction Logic ---
export async function addHistory(username: string, type: "bet" | "topup" | "win", amount: number, desc: string) {
  const id = crypto.randomUUID();
  const item: HistoryItem = { id, type, amount, description: desc, timestamp: Date.now() };
  await kv.set(["history", username, Date.now(), id], item);
}

export async function placeBet(user: User, number: string, amount: number) {
  if (user.balance < amount) return { success: false, msg: "လက်ကျန်ငွေ မလောက်ပါ" };

  const betId = crypto.randomUUID();
  const betData = { username: user.username, number, amount, status: "pending", timestamp: Date.now() };

  const res = await kv.atomic()
    .check({ key: ["users", user.username], versionstamp: (await kv.get(["users", user.username])).versionstamp })
    .set(["users", user.username], { ...user, balance: user.balance - amount })
    .set(["bets", betId], betData) 
    .commit();

  if (res.ok) {
    await addHistory(user.username, "bet", amount, `ထိုးကြေး: ${number}`);
    return { success: true };
  }
  return { success: false, msg: "Error, Try Again" };
}

export async function topUpUser(username: string, amount: number) {
  const user = await getUser(username);
  if (!user) return false;
  
  await kv.set(["users", username], { ...user, balance: user.balance + amount });
  await addHistory(username, "topup", amount, "Admin ငွေဖြည့်");
  return true;
}

// Payout with Session Logic (Morning / Evening)
export async function processPayout(number: string, multiplier: number, sessionType: "morning" | "evening") {
  const entries = kv.list({ prefix: ["bets"] });
  let count = 0;
  
  // Myanmar Time Calculation
  const now = new Date();
  const utcTime = now.getTime();
  const mmOffset = 6.5 * 60 * 60 * 1000; 
  const mmDate = new Date(utcTime + mmOffset);
  
  // Create boundary for today 12:00 PM Myanmar Time
  const midDay = new Date(mmDate);
  midDay.setUTCHours(12, 0, 0, 0); 
  // Note: Since we adjusted MM time manually, we treat standard Date methods as MM time roughly for day boundary
  // But strictly comparing timestamps is safer.
  
  // Simplest Logic: 
  // If Morning Payout selected -> Process bets where hour < 12
  // If Evening Payout selected -> Process bets where hour >= 12
  
  for await (const entry of entries) {
    const bet: any = entry.value;
    
    // Convert Bet Timestamp to MM Time Hour
    const betDateMM = new Date(bet.timestamp + mmOffset);
    const betHour = betDateMM.getUTCHours();
    
    let isMatchSession = false;
    if (sessionType === "morning" && betHour < 12) isMatchSession = true;
    if (sessionType === "evening" && betHour >= 12) isMatchSession = true;

    if (bet.status === "pending" && isMatchSession) {
      if (bet.number === number) {
        const winAmount = bet.amount * multiplier;
        const user = await getUser(bet.username);
        if (user) {
          await kv.set(["users", user.username], { ...user, balance: user.balance + winAmount });
          await addHistory(user.username, "win", winAmount, `ပေါက်ကြေး (${number}) - ${sessionType === 'morning' ? 'မနက်' : 'ညနေ'}`);
          await kv.delete(entry.key); 
          count++;
        }
      } else {
         // Lost
         await kv.delete(entry.key); 
      }
    }
  }
  return count;
}

export async function getHistory(username: string, cursor: string = "", limit = 10) {
  const iter = kv.list<HistoryItem>({ prefix: ["history", username] }, { limit, reverse: true, cursor: cursor || undefined });
  const items: HistoryItem[] = [];
  for await (const res of iter) items.push(res.value);
  return { items, nextCursor: iter.cursor };
}
