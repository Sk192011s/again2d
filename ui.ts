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
          body { font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 10px; background: #e9ecef; color:#333; }
          .card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 15px; }
          input, select, button { width: 100%; padding: 12px; margin: 6px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; }
          button { cursor: pointer; font-weight: bold; border: none; color: white; background: #0d6efd;}
          .nav { display: flex; justify-content: space-between; margin-bottom: 15px; background: white; padding: 10px; border-radius: 8px; }
          .nav a { text-decoration: none; font-weight: bold; color: #495057; }
          
          /* Profile Specific */
          .profile-header { text-align: center; background: #4b6cb7; color: white; padding: 20px; border-radius: 12px 12px 0 0; }
          .balance-box { font-size: 1.5rem; font-weight: bold; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; margin-top: 10px; }
          
          /* Tabs */
          .tabs { display: flex; background: white; border-bottom: 1px solid #ddd; }
          .tab-btn { flex: 1; padding: 15px; text-align: center; background: none; color: #555; cursor: pointer; border-bottom: 3px solid transparent; }
          .tab-btn.active { border-bottom: 3px solid #0d6efd; color: #0d6efd; font-weight: bold; }
          .tab-content { display: none; padding: 15px; background: white; border-radius: 0 0 12px 12px; min-height: 300px; }
          .tab-content.active { display: block; }

          /* Scrollable List */
          .scroll-box { max-height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; }
          .list-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
          .list-item:last-child { border-bottom: none; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
          .bg-bet { background: #ffe6e6; color: #c00; }
          .bg-win { background: #e6fffa; color: #00997a; }
          .bg-topup { background: #e6f0ff; color: #004085; }
          .date { font-size: 0.75rem; color: #888; }
          
          /* Modal & Others (Reused) */
          .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99; }
          .modal-content { background: white; margin: 20% auto; padding: 20px; width: 80%; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="nav">
          <a href="/">🏠 Home</a>
          ${isLoggedIn ? '<a href="/profile">👤 Profile</a>' : '<a href="/login">🔑 Login</a>'}
        </div>
        ${content}
        <script>
          function openTab(name) {
             document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
             document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
             document.getElementById(name).classList.add('active');
             document.getElementById('btn-'+name).classList.add('active');
          }
          
          // Re-use confirm modal script from before
           function showConfirm(formId) {
             const amt = document.querySelector(\`#\${formId} input[name="amount"]\`).value;
             if(!amt) { alert("ပမာဏထည့်ပါ"); return false; }
             if(confirm("ထိုးမှာ သေချာလား?")) { return true; }
             return false;
           }
        </script>
      </body>
    </html>
  `;
}

export function profilePage(user: any, historyItems: any[], nextCursor: string, activeTab = "history", msg = "") {
  // Split history for display
  const bets = historyItems.filter(i => i.type === 'bet');
  const trans = historyItems.filter(i => i.type !== 'bet');

  const historyHtml = bets.length > 0 ? bets.map(i => `
    <div class="list-item">
      <div>
        <div style="font-weight:bold">${i.description}</div>
        <div class="date">${new Date(i.timestamp).toLocaleString()}</div>
      </div>
      <div class="badge bg-bet">-${i.amount}</div>
    </div>
  `).join('') : '<p style="text-align:center;color:#888">မှတ်တမ်းမရှိပါ</p>';

  const transHtml = trans.length > 0 ? trans.map(i => `
    <div class="list-item">
      <div>
        <div style="font-weight:bold">${i.description}</div>
        <div class="date">${new Date(i.timestamp).toLocaleString()}</div>
      </div>
      <div class="badge ${i.type === 'win' ? 'bg-win' : 'bg-topup'}">+${i.amount}</div>
    </div>
  `).join('') : '<p style="text-align:center;color:#888">မှတ်တမ်းမရှိပါ</p>';

  return layout(`
    <div class="card" style="padding:0; overflow:hidden;">
       <div class="profile-header">
          <div>👤 ${user.username}</div>
          <div class="balance-box">${user.balance} Ks</div>
       </div>
       
       ${msg ? `<div style="padding:10px; text-align:center; background:#ffeb3b">${msg}</div>` : ''}

       <div class="tabs">
          <button id="btn-history" class="tab-btn ${activeTab==='history'?'active':''}" onclick="openTab('history')">📜 ထိုးမှတ်တမ်း</button>
          <button id="btn-trans" class="tab-btn ${activeTab==='trans'?'active':''}" onclick="openTab('trans')">💰 ငွေစာရင်း</button>
          <button id="btn-settings" class="tab-btn ${activeTab==='settings'?'active':''}" onclick="openTab('settings')">⚙️ Settings</button>
       </div>

       <!-- Tab 1: Bets -->
       <div id="history" class="tab-content ${activeTab==='history'?'active':''}">
          <div class="scroll-box">
             ${historyHtml}
          </div>
          ${nextCursor ? `
            <form action="/profile" method="GET">
              <input type="hidden" name="cursor" value="${nextCursor}">
              <input type="hidden" name="tab" value="history">
              <button style="margin-top:10px; background:#6c757d">နောက်ထပ် ကြည့်ရန် ></button>
            </form>` : ''}
       </div>

       <!-- Tab 2: Transactions -->
       <div id="trans" class="tab-content ${activeTab==='trans'?'active':''}">
          <div class="scroll-box">
             ${transHtml}
          </div>
          ${nextCursor ? `
            <form action="/profile" method="GET">
               <input type="hidden" name="cursor" value="${nextCursor}">
               <input type="hidden" name="tab" value="trans">
               <button style="margin-top:10px; background:#6c757d">နောက်ထပ် ကြည့်ရန် ></button>
            </form>` : ''}
       </div>

       <!-- Tab 3: Settings -->
       <div id="settings" class="tab-content ${activeTab==='settings'?'active':''}">
          <h3>🔐 Password ပြောင်းရန်</h3>
          <form method="POST" action="/profile/password">
             <input type="password" name="new_password" placeholder="Password အသစ်" required>
             <button type="submit">ပြောင်းမည်</button>
          </form>
          <hr>
          <a href="/logout"><button style="background:#dc3545">🚪 Logout ထွက်မည်</button></a>
       </div>
    </div>
  `, true);
}

// ... (homePage, loginPage, voucherPage, adminPage - Keep them as they were in previous steps) ...
// For brevity, I am not repeating the exact same code for Home/Login/Admin unless you requested changes there. 
// Assumption: You will copy the homePage, loginPage, etc. from the previous response.
// But to make this copy-pasteable, I will include a basic Home Page structure below.

export function homePage(user: any, msg = "") {
    return layout(`
      <div class="card">
        <h3>👋 မင်္ဂလာပါ ${user.username}</h3>
        <p>လက်ကျန်ငွေ: <strong>${user.balance} ကျပ်</strong></p>
        <div style="display:flex; gap:10px;">
           <a href="/profile" style="flex:1"><button style="background:#17a2b8">👤 My Profile</button></a>
           ${user.role === 'admin' ? '<a href="/admin" style="flex:1"><button style="background:#6610f2">Admin</button></a>' : ''}
        </div>
      </div>
      ${msg}
      <div class="card">
        <h4>💎 ဂဏန်းထိုးရန်</h4>
        <form id="betForm" method="POST" action="/bet" onsubmit="return showConfirm('betForm')">
          <input type="hidden" name="type" value="normal">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <input name="number" type="tel" maxlength="2" placeholder="ဂဏန်း" required>
            <input name="amount" type="number" placeholder="ပမာဏ" required>
          </div>
          <button type="submit">ထိုးမည်</button>
        </form>
        <p style="font-size:0.8rem; color:#666;">* Profile တွင် အသေးစိတ်ကြည့်နိုင်သည်</p>
      </div>
    `, true);
}

export function loginPage(err=""){ return layout(`
  <div class="card"><h2>Login</h2><p style="color:red">${err}</p>
  <form method="POST" action="/login"><input name="username" placeholder="User"><input type="password" name="password" placeholder="Pass"><button>Login</button></form>
  <br><a href="/register">Register</a></div>`); 
}
export function registerPage(err=""){ return layout(`
  <div class="card"><h2>Register</h2><p style="color:red">${err}</p>
  <form method="POST" action="/register"><input name="username" placeholder="User"><input type="password" name="password" placeholder="Pass"><button>Register</button></form></div>`); 
}
export function adminPage(msg="") { return layout(`<h2>Admin</h2>${msg}<div class="card"><form method="POST" action="/admin/topup"><input name="username" placeholder="User"><input name="amount" placeholder="Amount"><button>Topup</button></form></div>
<div class="card"><form method="POST" action="/admin/payout"><input name="number" placeholder="Win Number"><input name="multiplier" value="80"><button>Payout</button></form></div>`, true); }

export function voucherPage(data:any) {
    return layout(`<div class="card" style="text-align:center"><h2>✅ Success</h2><p>Total: ${data.total}</p><a href="/"><button>Back</button></a></div>`, true);
}
