// db.ts
export const kv = await Deno.openKv();

// 🔥 ADMIN SETTINGS (Deno Env မှ ယူမည်) 🔥
// Default: Username="admin", Password="123" (Deno မှာ မထည့်ထားရင် သုံးရန်)
const ADMIN_USER = Deno.env.get("ADMIN_USERNAME") || "admin";
const ADMIN_PASS = Deno.env.get("ADMIN_PASSWORD") || "123"; 

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
  isOpen: boolean; 
  isManuallyClosed: boolean;
  lastUpdated: number;
}

// --- ADMIN AUTO INIT ---
export async function initAdmin() {
    const res = await kv.get<User>(["users", ADMIN_USER]);
    const currentAdmin = res.value;

    // Admin Data ကို Update လုပ်မယ် (Password ကို Env ကအတိုင်း ထားမယ်)
    const adminData: User = {
        username: ADMIN_USER,
        password: ADMIN_PASS, 
        balance: currentAdmin ? currentAdmin.balance : 100000000, 
        role: "admin",
        session: currentAdmin?.session
    };

    await kv.set(["users", ADMIN_USER], adminData);
    console.log("Admin Init Done with Env Password.");
}

await initAdmin();

// --- Game Status ---
export async function getGameStatus() {
  const res = await kv.get<GameStatus>(["game_status"]);
  let status = res.value || { currentSession: "morning", isOpen: true, isManuallyClosed: false, lastUpdated: Date.now() };

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

export async function getAllUsers() {
    const iter = kv.list<User>({ prefix: ["users"] });
    const users: User[] = [];
    for await (const res of iter) users.push(res.value);
    return users;
}

export async function registerUser(username: string, password: string) {
  const existing = await getUser(username);
  if (existing) return { success: false, msg: "ဤအမည်ဖြင့် ရှိပြီးသားဖြစ်သည်" };
  const newUser: User = { username, password, balance: 0, role: username === "admin" ? "admin" : "user" };
  await kv.set(["users", username], newUser);
  return { success: true, msg: "Success" };
}

export async function loginUser(username: string, password: string) {
  // Admin Login ဆိုရင် Env ထဲက Password နဲ့ တိုက်စစ်မယ် (အလုံခြုံဆုံး)
  if (username === ADMIN_USER && password === ADMIN_PASS) {
      const user = await getUser(username);
      if (user) {
          const session = crypto.randomUUID();
          await kv.set(["users", username], { ...user, session });
          await kv.set(["sessions", session], username);
          return { success: true, session };
      }
  }

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
  const timestamp = Date.now();
  const finalStatus = type === 'bet' ? 'pending' : status;
  const item: HistoryItem = { id, type, amount, description: desc, timestamp, status: finalStatus };
  await kv.set(["history", username, timestamp, id], item);
  return { id, timestamp };
}

export async function clearUserHistory(username: string) {
    const iter = kv.list<HistoryItem>({ prefix: ["history", username] });
    for await (const res of iter) {
        // Pending နဲ့ Win ကို ချန်ထားမယ် (ကျန်တာဖျက်မယ်)
        if (res.value.status !== 'pending' && res.value.type !== 'win') {
            await kv.delete(res.key);
        }
    }
}

export async function deleteHistoryItem(username: string, timestamp: number, id: string) {
    await kv.delete(["history", username, timestamp, id]);
}

export async function placeBet(user: User, number: string, amount: number) {
  if (user.balance < amount) return { success: false, msg: "လက်ကျန်ငွေ မလောက်ပါ" };
  
  const hist = await addHistory(user.username, "bet", amount, `ထိုးဂဏန်း: ${number}`, "pending");

  const betId = crypto.randomUUID();
  const betData = { 
      username: user.username, 
      number, 
      amount, 
      status: "pending", 
      timestamp: Date.now(),
      historyId: hist.id,
      historyTimestamp: hist.timestamp
  };

  const res = await kv.atomic()
    .check({ key: ["users", user.username], versionstamp: (await kv.get(["users", user.username])).versionstamp })
    .set(["users", user.username], { ...user, balance: user.balance - amount })
    .set(["bets", betId], betData) 
    .commit();

  if (res.ok) return { success: true };
  return { success: false, msg: "Error" };
}

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
      const histKey = ["history", bet.username, bet.historyTimestamp, bet.historyId];
      const histRes = await kv.get<HistoryItem>(histKey);

      if (bet.number === number) {
        const winAmount = bet.amount * multiplier;
        const user = await getUser(bet.username);
        if (user) {
          await kv.set(["users", user.username], { ...user, balance: user.balance + winAmount });
          await addHistory(user.username, "win", winAmount, `ထီပေါက်သည် (${number})`, "won");
          if(histRes.value) await kv.set(histKey, { ...histRes.value, status: "won" });
          await kv.delete(entry.key); 
          winners.push(`${user.username} (+${winAmount})`);
        }
      } else {
         if(histRes.value) await kv.set(histKey, { ...histRes.value, status: "lost" });
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
