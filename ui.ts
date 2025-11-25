// ui.ts

// ခေါင်းစဉ်၊ CSS အလှဆင်တာတွေ ဒီမှာပြင်ပါ
export function layout(content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lotto 2D/3D</title>
        <style>
          body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f9; }
          .box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
          input, button { width: 100%; padding: 12px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
          button { background: #28a745; color: white; font-weight: bold; cursor: pointer; }
          button.admin { background: #007bff; }
          .error { color: red; background: #ffe6e6; padding: 10px; border-radius: 5px; }
          .success { color: green; background: #e6ffe6; padding: 10px; border-radius: 5px; }
          nav a { margin-right: 15px; text-decoration: none; color: #333; font-weight: bold; }
        </style>
      </head>
      <body>
        <nav class="box">
            <a href="/">🏠 ပင်မစာမျက်နှာ</a>
            <a href="/admin">🔑 Admin</a>
        </nav>
        ${content}
      </body>
    </html>
  `;
}

export function homePage(msg = "") {
  return layout(`
    <div class="box">
      <h2>🎰 ဂဏန်းထိုးရန်</h2>
      ${msg ? `<p>${msg}</p>` : ""}
      <form method="POST" action="/bet">
        <input name="username" placeholder="နာမည် (Username)" required />
        <input name="number" type="number" placeholder="ထိုးမည့်ဂဏန်း" required />
        <input name="amount" type="number" placeholder="ငွေပမာဏ" required />
        <button type="submit">ထိုးမည်</button>
      </form>
    </div>
    
    <div class="box">
        <h3>လက်ကျန်ငွေ စစ်ရန်</h3>
        <form method="GET" action="/check">
             <input name="username" placeholder="နာမည်ရိုက်ထည့်ပါ" required />
             <button type="submit" style="background: #666;">စစ်မည်</button>
        </form>
    </div>
  `);
}

export function adminPage(msg = "") {
  return layout(`
    <div class="box">
      <h2>🔑 Admin Panel (ငွေဖြည့်ရန်)</h2>
      ${msg ? `<p>${msg}</p>` : ""}
      <form method="POST" action="/topup">
        <input name="username" placeholder="User နာမည်" required />
        <input name="amount" type="number" placeholder="ဖြည့်မည့် ပမာဏ" required />
        <button type="submit" class="admin">ငွေဖြည့်မည်</button>
      </form>
    </div>
  `);
}
