// db.ts
export const kv = await Deno.openKv();

export interface User {
  username: string;
  password: string;
  balance: number;
  role: "admin" | "user";
  session?: string;
}

// မှတ်တမ်းအမျိုးအစားများ (Bet = ထိုးကြေး, Topup = ငွေဖြည့်, Win = ပေါက်ကြေး)
export interface HistoryItem {
  id: string;
  type: "bet" | "topup" | "win"; 
  description: string;
  amount: number;
  timestamp: number;
}

// 1. Login & User Management
export async function getUser(username: string) {
  const res = await kv.get<User>(["users", username]);
  return res.value;
}

export async function registerUser(username: string, password: string) {
  const existing = await getUser(username);
  if (existing) return { success: false, msg: "User ရှိပြီးသားပါ" };

  const newUser: User = { username, password, balance: 0, role: username === "admin" ? "admin" : "user" };
  await kv.set(["users", username], newUser);
  return { success: true, msg: "Success" };
}

export async function loginUser(username: string, password: string) {
  const user = await getUser(username);
  if (!user || user.password !== password) return { success: false, msg: "မှားယွင်းနေပါသည်" };

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

export async function changePassword(username: string, newPass: string) {
  const user = await getUser(username);
  if(user) {
    await kv.set(["users", username], { ...user, password: newPass });
    return true;
  }
  return false;
}

// 2. Betting & Transactions with History
export async function addHistory(username: string, type: "bet" | "topup" | "win", amount: number, desc: string) {
  const id = crypto.randomUUID();
  const item: HistoryItem = { id, type, amount, description: desc, timestamp: Date.now() };
  // Store history: ["history", username, timestamp, id]
  await kv.set(["history", username, Date.now(), id], item);
}

export async function placeBet(user: User, number: string, amount: number) {
  if (user.balance < amount) return { success: false, msg: "ငွေမလောက်ပါ" };

  const betId = crypto.randomUUID();
  const betData = { username: user.username, number, amount, status: "pending", timestamp: Date.now() };

  const res = await kv.atomic()
    .check({ key: ["users", user.username], versionstamp: (await kv.get(["users", user.username])).versionstamp })
    .set(["users", user.username], { ...user, balance: user.balance - amount })
    .set(["bets", betId], betData) // For admin payout check
    .commit();

  if (res.ok) {
    // Add to user history separately (Non-blocking)
    await addHistory(user.username, "bet", amount, `ထိုးကြေး: ${number}`);
    return { success: true };
  }
  return { success: false, msg: "Error, Try Again" };
}

// 3. Admin Functions
export async function topUpUser(username: string, amount: number) {
  const user = await getUser(username);
  if (!user) return false;
  
  await kv.set(["users", username], { ...user, balance: user.balance + amount });
  await addHistory(username, "topup", amount, "Admin ငွေဖြည့်");
  return true;
}

export async function processPayout(number: string, multiplier: number) {
  const entries = kv.list({ prefix: ["bets"] });
  let count = 0;
  for await (const entry of entries) {
    const bet: any = entry.value;
    if (bet.status === "pending") {
      if (bet.number === number) {
        const winAmount = bet.amount * multiplier;
        const user = await getUser(bet.username);
        if (user) {
          await kv.set(["users", user.username], { ...user, balance: user.balance + winAmount });
          await addHistory(user.username, "win", winAmount, `ပေါက်ကြေး (${number})`);
          await kv.delete(entry.key); // Clear bet to save space or mark as won
          count++;
        }
      } else {
         // Optionally delete lost bets to clean DB
         await kv.delete(entry.key); 
      }
    }
  }
  return count;
}

// 4. Fetch History (Pagination Logic)
export async function getHistory(username: string, cursor: string = "", limit = 10) {
  const iter = kv.list<HistoryItem>({ prefix: ["history", username] }, { limit, reverse: true, cursor: cursor || undefined });
  const items: HistoryItem[] = [];
  for await (const res of iter) items.push(res.value);
  return { items, nextCursor: iter.cursor };
}
