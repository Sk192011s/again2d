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
  type: "bet" | "topup" | "withdraw" | "win"; 
  description: string;
  amount: number;
  timestamp: number;
  status?: "pending" | "won" | "lost";
}

export interface WinResult {
  date: string;
  session: "morning" | "evening";
  number: string;
  timestamp: number;
}

export interface GameStatus {
  currentSession: "morning" | "evening";
  isOpen: boolean;       // System auto open/close based on payout
  isManuallyClosed: boolean; // Admin manual override (New Feature)
  lastUpdated: number;
}

// --- Game Status & Auto Switch ---
export async function getGameStatus() {
  const res = await kv.get<GameStatus>(["game_status"]);
  
  // Default Initial State
  let status = res.value || { currentSession: "morning", isOpen: true, isManuallyClosed: false, lastUpdated: Date.now() };

  // Auto Session Switch Logic (Time based)
  const now = new Date();
  const mmTime = new Date(now.getTime() + (6.5 * 60 * 60 * 1000));
  const hours = mmTime.getUTCHours();
  
  if (hours >= 12 && status.currentSession === 'morning') {
      status.currentSession = 'evening';
      status.isOpen = true; 
      await kv.set(["game_status"], status);
  }
  if (hours < 12 && status.currentSession === 'evening') {
       status.currentSession = 'morning';
       status.isOpen = true;
       await kv.set(["game_status"], status);
  }
  return status;
}

export async function setGameStatus(status: GameStatus) {
  await kv.set(["game_status"], status);
}

// Admin Toggle Manual Close/Open
export async function toggleManualStatus(close: boolean) {
    const status = await getGameStatus();
    status.isManuallyClosed = close;
    await setGameStatus(status);
    return status;
}

// --- User Logic ---
export async function getUser(username: string) {
  const res = await kv.get<User>(["users", username]);
  return res.value;
}

export async function registerUser(username: string, password: string) {
  const existing = await getUser(username);
  if (existing) return { success: false, msg: "ဤအမည်ဖြင့် ရှိပြီးသားဖြစ်သည်" };
  const newUser: User = { username, password, balance: 0, role: username === "admin" ? "admin" : "user" };
  await kv.set(["users", username], newUser);
  return { success: true, msg: "Success" };
}

export async function loginUser(username: string, password: string) {
  const user = await getUser(username);
  if (!user || user.password !== password) return { success: false, msg: "အမည် (သို့) စကားဝှက် မှားယွင်းနေပါသည်" };
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
  if(user) { await kv.set(["users", username], { ...user, password: newPass }); return true; }
  return false;
}

// --- History & Betting ---
export async function addHistory(username: string, type: "bet" | "topup" | "withdraw" | "win", amount: number, desc: string, status: "pending"|"won"|"lost" = "won") {
  const id = crypto.randomUUID();
  const finalStatus = type === 'bet' ? 'pending' : status;
  const item: HistoryItem = { id, type, amount, description: desc, timestamp: Date.now(), status: finalStatus };
  await kv.set(["history", username, Date.now(), id], item);
}

export async function clearUserHistory(username: string) {
    const iter = kv.list<HistoryItem>({ prefix: ["history", username] });
    for await (const res of iter) {
        if (res.value.status !== 'pending') {
            await kv.delete(res.key);
        }
    }
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
    await addHistory(user.username, "bet", amount, `ထိုးဂဏန်း: ${number}`, "pending");
    return { success: true };
  }
  return { success: false, msg: "Error" };
}

// Money Mgmt
export async function topUpUser(username: string, amount: number) {
  const user = await getUser(username);
  if (!user) return false;
  await kv.set(["users", username], { ...user, balance: user.balance + amount });
  await addHistory(username, "topup", amount, "Admin ငွေဖြည့်", "won");
  return true;
}

export async function withdrawUser(username: string, amount: number) {
    const user = await getUser(username);
    if (!user || user.balance < amount) return false;
    await kv.set(["users", username], { ...user, balance: user.balance - amount });
    await addHistory(username, "withdraw", amount, "Admin ငွေထုတ်", "won");
    return true;
}

// --- Payout ---
export async function addWinResult(number: string, session: "morning" | "evening") {
    const result: WinResult = { date: new Date().toISOString().split('T')[0], session, number, timestamp: Date.now() };
    await kv.set(["results", Date.now()], result);
}

export async function getWinResults(limit = 10) {
    const iter = kv.list<WinResult>({ prefix: ["results"] }, { limit, reverse: true });
    const items = [];
    for await (const res of iter) items.push(res.value);
    return items;
}

export async function processPayout(number: string, multiplier: number, sessionType: "morning" | "evening") {
  const entries = kv.list({ prefix: ["bets"] });
  const winners: string[] = [];
  const mmOffset = 6.5 * 60 * 60 * 1000; 

  for await (const entry of entries) {
    const bet: any = entry.value;
    const betHour = new Date(bet.timestamp + mmOffset).getUTCHours();
    
    let isMatchSession = false;
    if (sessionType === "morning" && betHour < 12) isMatchSession = true;
    if (sessionType === "evening" && betHour >= 12) isMatchSession = true;

    if (bet.status === "pending" && isMatchSession) {
      if (bet.number === number) {
        const winAmount = bet.amount * multiplier;
        const user = await getUser(bet.username);
        if (user) {
          await kv.set(["users", user.username], { ...user, balance: user.balance + winAmount });
          await addHistory(user.username, "win", winAmount, `ထီပေါက်သည် (${number})`, "won");
          await kv.delete(entry.key); 
          winners.push(`${user.username} (+${winAmount})`);
        }
      } else {
         await kv.delete(entry.key); 
      }
    }
  }

  await addWinResult(number, sessionType);
  return winners;
}

export async function getHistory(username: string, cursor: string = "", limit = 50) {
  const iter = kv.list<HistoryItem>({ prefix: ["history", username] }, { limit, reverse: true, cursor: cursor || undefined });
  const items: HistoryItem[] = [];
  for await (const res of iter) items.push(res.value);
  return { items, nextCursor: iter.cursor };
}
