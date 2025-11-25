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
          body { font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 15px; background: #f0f2f5; }
          .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 15px; }
          input, button { width: 100%; padding: 12px; margin: 6px 0; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
          button { background: #1877f2; color: white; font-weight: bold; border: none; cursor: pointer; }
          button.secondary { background: #42b72a; }
          button.danger { background: #dc3545; }
          button.admin { background: #6f42c1; }
          .nav { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .nav a { text-decoration: none; font-weight: bold; color: #555; }
          .msg { padding: 10px; border-radius: 5px; margin-bottom: 10px; text-align: center; }
          .success { background: #d4edda; color: #155724; }
          .error { background: #f8d7da; color: #721c24; }
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
        <button type="submit">ဝင်မည်</button>
      </form>
      <hr>
      <p style="text-align:center">အကောင့်မရှိဘူးလား?</p>
      <a href="/register"><button class="secondary">အကောင့်အသစ်ဖွင့်မည်</button></a>
    </div>
  `);
}

export function registerPage(error = "") {
  return layout(`
    <div class="card">
      <h2>အကောင့်သစ်ဖွင့်ရန်</h2>
      ${error ? `<div class="msg error">${error}</div>` : ""}
      <form method="POST" action="/register">
        <input name="username" placeholder="Username အသစ်ပေးပါ" required />
        <input type="password" name="password" placeholder="Password ပေးပါ" required />
        <button type="submit" class="secondary">စာရင်းသွင်းမည်</button>
      </form>
      <br>
      <a href="/login">Login သို့ပြန်သွားရန်</a>
    </div>
  `);
}

export function homePage(user: any, msg = "") {
  return layout(`
    <div class="card">
      <h3>မင်္ဂလာပါ, ${user.username} 👋</h3>
      <p>လက်ကျန်ငွေ: <strong>${user.balance} ကျပ်</strong></p>
      ${user.role === 'admin' ? '<a href="/admin"><button class="admin">Admin Panel သို့သွားရန်</button></a>' : ''}
    </div>

    <div class="card">
      <h3>🎰 ဂဏန်းထိုးရန်</h3>
      ${msg}
      <form method="POST" action="/bet">
        <input name="number" type="number" placeholder="ထိုးမည့်ဂဏန်း" required />
        <input name="amount" type="number" placeholder="ငွေပမာဏ" required />
        <button type="submit">ထိုးမည်</button>
      </form>
    </div>
  `, true);
}

export function adminPage(msg = "") {
  return layout(`
    <h2>👮‍♂️ Admin Control Panel</h2>
    ${msg}
    
    <div class="card">
      <h3>💰 ငွေဖြည့်ပေးရန်</h3>
      <form method="POST" action="/admin/topup">
        <input name="username" placeholder="User နာမည်" required />
        <input name="amount" type="number" placeholder="ပမာဏ" required />
        <button type="submit" class="secondary">ငွေဖြည့်မည်</button>
      </form>
    </div>

    <div class="card" style="border: 2px solid #6f42c1;">
      <h3>🏆 ပေါက်ဂဏန်းကြေညာရန် (လျော်ကြေးရှင်းရန်)</h3>
      <p style="color:red; font-size: 0.9rem;">သတိ: နှိပ်လိုက်တာနဲ့ အကုန်ရှင်းပေးသွားပါလိမ့်မယ်။</p>
      <form method="POST" action="/admin/payout">
        <input name="number" type="text" placeholder="ပေါက်ဂဏန်း (ဥပမာ: 55)" required />
        <input name="multiplier" type="number" value="80" placeholder="လျော်မည့်အဆ (Default: 80)" required />
        <button type="submit" class="admin">လျော်ကြေး ရှင်းမည်</button>
      </form>
    </div>
  `, true);
}
