// ui.ts
export function layout(content: string, isLoggedIn = false) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2D/3D Club</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 10px; background: #e9ecef; }
          .card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 15px; }
          h2, h3 { margin-top: 0; color: #333; }
          input, select, button { width: 100%; padding: 12px; margin: 6px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; font-size: 16px; }
          button { background: #0d6efd; color: white; font-weight: bold; border: none; cursor: pointer; transition: 0.2s; }
          button:active { transform: scale(0.98); }
          button.secondary { background: #198754; }
          button.danger { background: #dc3545; }
          button.admin { background: #6610f2; }
          button.warning { background: #ffc107; color: black; }
          
          .nav { display: flex; justify-content: space-between; margin-bottom: 15px; background: white; padding: 10px; border-radius: 8px; }
          .nav a { text-decoration: none; font-weight: bold; color: #495057; }
          
          .msg { padding: 12px; border-radius: 8px; margin-bottom: 10px; text-align: center; font-weight: bold; }
          .success { background: #d1e7dd; color: #0f5132; }
          .error { background: #f8d7da; color: #842029; }
          
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .checkbox-wrapper { display: flex; align-items: center; gap: 10px; margin: 10px 0; font-weight: bold; }
          input[type="checkbox"] { width: 25px; height: 25px; margin: 0; }
          
          .tab-header { background: #f8f9fa; padding: 10px; border-radius: 8px 8px 0 0; border-bottom: 2px solid #ddd; margin-bottom: 10px; font-weight: bold; text-align: center;}
        </style>
      </head>
      <body>
        <div class="nav">
          <a href="/">🏠 Home</a>
          ${isLoggedIn ? '<a href="/logout">🚪 Logout</a>' : '<a href="/login">🔑 Login</a>'}
        </div>
        ${content}
      </body>
    </html>
  `;
}

export function loginPage(error = "") {
  return layout(`
    <div class="card">
      <h2>အကောင့်ဝင်ရန်</h2>
      ${error ? `<div class="msg error">${error}</div>` : ""}
      <form method="POST" action="/login">
        <input name="username" placeholder="Username" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login ဝင်မည်</button>
      </form>
      <hr>
      <a href="/register"><button class="secondary">အကောင့်သစ်ဖွင့်မည်</button></a>
    </div>
  `);
}

export function registerPage(error = "") {
  return layout(`
    <div class="card">
      <h2>Register</h2>
      ${error ? `<div class="msg error">${error}</div>` : ""}
      <form method="POST" action="/register">
        <input name="username" placeholder="Username" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit" class="secondary">စာရင်းသွင်းမည်</button>
      </form>
    </div>
  `);
}

export function homePage(user: any, msg = "") {
  return layout(`
    <div class="card">
      <h3>👋 မင်္ဂလာပါ ${user.username}</h3>
      <div style="font-size: 1.2rem; background: #eef; padding: 10px; border-radius: 8px;">
        လက်ကျန်ငွေ: <strong>${user.balance} ကျပ်</strong>
      </div>
      ${user.role === 'admin' ? '<br><a href="/admin"><button class="admin">Admin Panel သို့သွားရန်</button></a>' : ''}
    </div>

    ${msg}

    <!-- ၁. ရိုးရိုးထိုး (R ပါ) -->
    <div class="card">
      <div class="tab-header">💎 ရိုးရိုးထိုး / R (အပြန်အလှန်)</div>
      <form method="POST" action="/bet">
        <input type="hidden" name="type" value="normal" />
        <div class="grid-2">
           <input name="number" type="text" pattern="[0-9]*" maxlength="2" placeholder="ဂဏန်း (ဥပမာ 25)" required />
           <input name="amount" type="number" placeholder="ငွေပမာဏ" required />
        </div>
        <div class="checkbox-wrapper">
            <input type="checkbox" name="r_bet" value="yes" id="r_check">
            <label for="r_check">R (အပြန်အလှန်ထိုးမည်)</label>
        </div>
        <button type="submit">ထိုးမည်</button>
      </form>
    </div>

    <!-- ၂. လုံးစီး (ထိပ်/နောက်) -->
    <div class="card">
      <div class="tab-header">🔢 လုံးစီးထိုး (၁၀ ကွက်)</div>
      <form method="POST" action="/bet">
        <input type="hidden" name="type" value="head_tail" />
        <div class="grid-2">
            <select name="position">
                <option value="head">ထိပ်စီး (ဥပမာ 1 -> 10,11..19)</option>
                <option value="tail">နောက်ပိတ် (ဥပမာ 1 -> 01,11..91)</option>
            </select>
            <input name="digit" type="number" min="0" max="9" placeholder="ဂဏန်း (0-9)" required />
        </div>
        <input name="amount" type="number" placeholder="တစ်ကွက်လျှင် ထိုးကြေး" required />
        <button type="submit" class="secondary">လုံးစီး ထိုးမည်</button>
      </form>
    </div>

    <!-- ၃. အစုလိုက် (အပူး/ပါဝါ) -->
    <div class="card">
      <div class="tab-header">⚡ အမြန်ထိုး (Shortcuts)</div>
      <form method="POST" action="/bet">
        <input type="hidden" name="type" value="shortcut" />
        <input name="amount" type="number" placeholder="တစ်ကွက်လျှင် ထိုးကြေး" required />
        <div class="grid-2">
            <button type="submit" name="set" value="double" class="warning">အပူး (၁၀ ကွက်)</button>
            <button type="submit" name="set" value="power" class="warning">ပါဝါ (၁၀ ကွက်)</button>
        </div>
      </form>
    </div>
  `, true);
}

export function adminPage(msg = "") {
  return layout(`
    <h2>👮‍♂️ Admin Panel</h2>
    ${msg}
    
    <div class="card">
      <h3>💰 ငွေဖြည့်ပေးရန်</h3>
      <form method="POST" action="/admin/topup">
        <input name="username" placeholder="User နာမည်" required />
        <input name="amount" type="number" placeholder="ပမာဏ" required />
        <button type="submit" class="secondary">ငွေဖြည့်မည်</button>
      </form>
    </div>

    <div class="card" style="border: 2px solid #6610f2;">
      <h3>🏆 လျော်ကြေးရှင်းရန်</h3>
      <form method="POST" action="/admin/payout">
        <input name="number" type="text" placeholder="ပေါက်ဂဏန်း (ဥပမာ: 55)" required />
        <input name="multiplier" type="number" value="80" placeholder="အဆ (Default: 80)" required />
        <button type="submit" class="admin">ရှင်းမည်</button>
      </form>
    </div>
  `, true);
}
