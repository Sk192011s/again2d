// db.ts
export const kv = await Deno.openKv();

// User Data ပုံစံ
export interface User {
  username: string;
  password: string; // အစမ်းမို့လို့ ဒီအတိုင်းသိမ်းပါမယ်
  balance: number;
  role: "admin" | "user";
  session?: string; // Login ဝင်ထားလား စစ်ဖို့
}

// Bet Data ပုံစံ
export interface Bet {
  id: string;
  username: string;
  number: string;
  amount: number;
  status: "pending" | "won" | "lost";
  timestamp: number;
}

// 1. အကောင့်သစ်ဖွင့်ခြင်း
export async function registerUser(username: string, password: string) {
  const userRes = await kv.get(["users", username]);
  if (userRes.value) return { success: false, msg: "ဒီနာမည်နဲ့ ရှိပြီးသားပါ" };

  const newUser: User = {
    username,
    password,
    balance: 0,
    role: username === "admin" ? "admin" : "user", // username 'admin' ဆိုရင် Admin ပေးမယ်
  };
  await kv.set(["users", username], newUser);
  return { success: true, msg: "အကောင့်ဖွင့်ပြီးပါပြီ" };
}

// 2. Login ဝင်ခြင်း
export async function loginUser(username: string, password: string) {
  const userRes = await kv.get<User>(["users", username]);
  const user = userRes.value;

  if (!user || user.password !== password) {
    return { success: false, msg: "နာမည် (သို့) စကားဝှက် မှားနေပါသည်" };
  }

  const session = crypto.randomUUID();
  user.session = session;
  await kv.set(["users", username], user);
  await kv.set(["sessions", session], username); // Session သိမ်းခြင်း
  
  return { success: true, session };
}

// 3. Session စစ်ဆေးခြင်း (ဘယ်သူဝင်ထားလဲကြည့်တာ)
export async function getUserBySession(session: string | null) {
  if (!session) return null;
  const usernameRes = await kv.get<string>(["sessions", session]);
  if (!usernameRes.value) return null;
  
  const userRes = await kv.get<User>(["users", usernameRes.value]);
  return userRes.value;
}

// 4. Logout ထွက်ခြင်း
export async function logoutUser(session: string) {
  await kv.delete(["sessions", session]);
}

// 5. ဂဏန်းထိုးခြင်း
export async function placeBet(user: User, number: string, amount: number) {
  if (user.balance < amount) return { success: false, msg: "လက်ကျန်ငွေ မလောက်ပါ" };

  const betId = crypto.randomUUID();
  const bet: Bet = {
    id: betId,
    username: user.username,
    number,
    amount,
    status: "pending",
    timestamp: Date.now(),
  };

  const res = await kv.atomic()
    .check({ key: ["users", user.username], versionstamp: (await kv.get(["users", user.username])).versionstamp })
    .set(["users", user.username], { ...user, balance: user.balance - amount })
    .set(["bets", betId], bet)
    .commit();

  return res.ok ? { success: true } : { success: false, msg: "ထပ်မံကြိုးစားပါ" };
}

// 6. ဂဏန်းလျော်ခြင်း (Admin Only)
// ဥပမာ - ၈၅ ထွက်တယ်၊ အဆ ၈၀ လျော်မယ်
export async function processPayout(winningNumber: string, multiplier: number) {
  const entries = kv.list<Bet>({ prefix: ["bets"] });
  let winnersCount = 0;

  for await (const entry of entries) {
    const bet = entry.value;
    if (bet.status === "pending") {
      if (bet.number === winningNumber) {
        // ပေါက်တယ် -> ပိုက်ဆံထည့်ပေးမယ်
        const winAmount = bet.amount * multiplier;
        const userRes = await kv.get<User>(["users", bet.username]);
        const user = userRes.value;
        
        if (user) {
          await kv.atomic()
            .set(["users", user.username], { ...user, balance: user.balance + winAmount })
            .set(entry.key, { ...bet, status: "won" })
            .commit();
          winnersCount++;
        }
      } else {
        // မပေါက်ဘူး -> Lost ပြောင်းမယ်
        await kv.set(entry.key, { ...bet, status: "lost" });
      }
    }
  }
  return winnersCount;
}
