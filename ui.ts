// ui.ts
export function layout(content: string, isLoggedIn = false) {
  return `
    <!DOCTYPE html>
    <html lang="my">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>2D/3D Club</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 10px; background: #e9ecef; color:#333; }
          .card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 15px; }
          h2, h3, h4 { margin-top:0; color: #495057; }
          input, select, button { width: 100%; padding: 12px; margin: 6px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; }
          button { cursor: pointer; font-weight: bold; border: none; color: white; background: #0d6efd; transition: 0.2s; }
          button:active { transform: scale(0.98); }
          button.secondary { background: #198754; }
          button.danger { background: #dc3545; }
          button.admin { background: #6610f2; }
          
          .nav { display: flex; justify-content: space-between; margin-bottom: 15px; background: white; padding: 10px; border-radius: 8px; align-items: center; }
          .nav a { text-decoration: none; font-weight: bold; color: #495057; display: flex; align-items: center; gap: 5px; }
          
          /* Utility Classes */
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .text-center { text-align: center; }
          .msg { padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 10px; }
          .error { background: #f8d7da; color: #721c24; }
          .success { background: #d1e7dd; color: #0f5132; }

          /* Tabs & Profile */
          .tabs { display: flex; background: white; border-bottom: 1px solid #ddd; }
          .tab-btn { flex: 1; padding: 12px; text-align: center; background: none; color: #555; cursor: pointer; border-bottom: 3px solid transparent; font-size: 0.9rem; }
          .tab-btn.active { border-bottom: 3px solid #0d6efd; color: #0d6efd; font-weight: bold; }
          .tab-content { display: none; padding: 15px; background: white; min-height: 200px; }
          .tab-content.active { display: block; }

          /* Betting Buttons */
          .btn-select { background: #f8f9fa; color: #333; border: 2px solid #ddd; }
          .btn-select.active { background: #ffc107; color: black; border-color: #e0a800; }

          /* History List */
          .list-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
          .bg-bet { background: #ffe6e6; color: #c00; }
          .bg-win { background: #e6fffa; color: #00997a; }
          .bg-topup { background: #e6f0ff; color: #004085; }

           /* Modal */
          .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99; }
          .modal-content { background: white; margin: 30% auto; padding: 20px; width: 85%; border-radius: 8px; text-align: center; }
          .modal-btns { display: flex; gap: 10px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="nav">
          <a href="/">🏠 ပင်မ</a>
          ${isLoggedIn ? '<a href="/profile">👤 အကောင့်</a>' : '<a href="/login">🔑 ဝင်မည်</a>'}
        </div>
        ${content}
        
        <!-- Confirm Modal -->
        <div id="confirmModal" class="modal">
            <div class="modal-content">
                <h3>❗ ထိုးမှာ သေချာလား?</h3>
                <p id="modalDesc" style="color:#555"></p>
                <div class="modal-btns">
                    <button class="danger" onclick="closeModal()">မထိုးပါ</button>
                    <button class="secondary" id="btnRealConfirm">သေချာတယ်</button>
                </div>
            </div>
        </div>

        <script>
            // Tab Logic
            function openTab(name) {
                document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(name).classList.add('active');
                document.getElementById('btn-'+name).classList.add('active');
            }

            // Betting Selection
            let selectedSet = "";
            function selectType(type, btn) {
                document.querySelectorAll('.btn-select').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSet = type;
                document.getElementById('hidden_set').value = type;
            }

            // Modal Logic
            function closeModal() { document.getElementById('confirmModal').style.display = "none"; }
            
            function showConfirm(formId, type) {
                const modal = document.getElementById('confirmModal');
                const desc = document.getElementById('modalDesc');
                const amount = document.querySelector(\`#\${formId} input[name="amount"]\`).value;

                if(!amount) { alert("ငွေပမာဏ ထည့်ပါ"); return false; }
                
                let txt = "";
                if(type === 'normal') {
                    const num = document.querySelector(\`#\${formId} input[name="number"]\`).value;
                    const r = document.querySelector(\`#\${formId} input[name="r_bet"]\`)?.checked ? "(R)" : "";
                    txt = \`ထိုးမည့်ဂဏန်း: \${num} \${r}<br>ပမာဏ: \${amount}\`;
                } else if(type === 'head_tail') {
                    const pos = document.querySelector(\`#\${formId} select[name="position"]\`).value === 'head' ? 'ထိပ်' : 'နောက်';
                    const digit = document.querySelector(\`#\${formId} input[name="digit"]\`).value;
                    txt = \`လုံးစီး: \${digit} (\${pos})<br>ပမာဏ: \${amount}\`;
                } else {
                    if(!selectedSet) { alert("အမျိုးအစား ရွေးပါ"); return false; }
                    txt = \`Shortcut: \${selectedSet}<br>ပမာဏ: \${amount}\`;
                }

                desc.innerHTML = txt;
                modal.style.display = "block";
                document.getElementById('btnRealConfirm').onclick = function() { document.getElementById(formId).submit(); };
                return false;
            }
        </script>
      </body>
    </html>
  `;
}

// 1. Home Page (Betting Options Restored)
export function homePage(user: any, msg = "") {
  return layout(`
    <div class="card">
      <h3>👋 မင်္ဂလာပါ ${user.username}</h3>
      <p>လက်ကျန်ငွေ: <strong>${user.balance} ကျပ်</strong></p>
      <div class="grid-2">
         <a href="/profile"><button style="background:#17a2b8">📜 မှတ်တမ်းကြည့်ရန်</button></a>
         ${user.role === 'admin' ? '<a href="/admin"><button class="admin">Admin Panel</button></a>' : ''}
      </div>
    </div>

    ${msg ? `<div class="msg ${msg.includes('✅')?'success':'error'}">${msg}</div>` : ''}

    <!-- ရိုးရိုးထိုး -->
    <div class="card">
      <h4>💎 ရိုးရိုးထိုး (R ပါ)</h4>
      <form id="formNormal" method="POST" action="/bet" onsubmit="return showConfirm('formNormal', 'normal')">
        <input type="hidden" name="type" value="normal" />
        <div class="grid-2">
           <input name="number" type="tel" maxlength="2" placeholder="ဂဏန်း (ဥပမာ 25)" required />
           <input name="amount" type="number" placeholder="ပမာဏ" required />
        </div>
        <div style="margin:10px 0;">
            <input type="checkbox" name="r_bet" value="yes" id="r_check" style="width:auto; vertical-align:middle;">
            <label for="r_check">R (အပြန်အလှန်)</label>
        </div>
        <button type="submit">ထိုးမည်</button>
      </form>
    </div>

    <!-- လုံးစီး -->
    <div class="card">
      <h4>🔢 လုံးစီး (၁၀ ကွက်)</h4>
      <form id="formHT" method="POST" action="/bet" onsubmit="return showConfirm('formHT', 'head_tail')">
        <input type="hidden" name="type" value="head_tail" />
        <div class="grid-2">
            <select name="position">
                <option value="head">ထိပ်စီး</option>
                <option value="tail">နောက်ပိတ်</option>
            </select>
            <input name="digit" type="tel" maxlength="1" placeholder="ဂဏန်း (0-9)" required />
        </div>
        <input name="amount" type="number" placeholder="တစ်ကွက်လျှင် ထိုးကြေး" required />
        <button type="submit" class="secondary">လုံးစီး ထိုးမည်</button>
      </form>
    </div>

    <!-- Shortcut -->
    <div class="card">
      <h4>⚡ အမြန်ထိုး (Shortcut)</h4>
      <form id="formShortcut" method="POST" action="/bet" onsubmit="return showConfirm('formShortcut', 'shortcut')">
        <input type="hidden" name="type" value="shortcut" />
        <input type="hidden" name="set" id="hidden_set" />
        
        <div class="grid-2">
            <button type="button" class="btn-select" onclick="selectType('double', this)">အပူး (၁၀) ကွက်</button>
            <button type="button" class="btn-select" onclick="selectType('power', this)">ပါဝါ (၁၀) ကွက်</button>
        </div>
        <br>
        <input name="amount" type="number" placeholder="တစ်ကွက်လျှင် ထိုးကြေး" required />
        <button type="submit">ထိုးမည်</button>
      </form>
    </div>
  `, true);
}

// 2. Myanmar Login / Register
export function loginPage(err="") {
    return layout(`
      <div class="card">
        <h2 class="text-center">အကောင့်ဝင်ရန်</h2>
        ${err ? `<div class="msg error">${err}</div>` : ""}
        <form method="POST" action="/login">
          <label>အသုံးပြုသူ အမည် (Username)</label>
          <input name="username" required />
          <label>စကားဝှက် (Password)</label>
          <input type="password" name="password" required />
          <button type="submit">ဝင်ရောက်မည်</button>
        </form>
        <br>
        <p class="text-center">အကောင့်မရှိဘူးလား? <a href="/register">အကောင့်သစ်ဖွင့်ရန်</a></p>
      </div>
    `);
}
export function registerPage(err="") {
    return layout(`
      <div class="card">
        <h2 class="text-center">အကောင့်သစ်ဖွင့်ရန်</h2>
        ${err ? `<div class="msg error">${err}</div>` : ""}
        <form method="POST" action="/register">
           <label>အသုံးပြုသူ အမည် (Username)</label>
          <input name="username" required />
           <label>စကားဝှက် (Password)</label>
          <input type="password" name="password" required />
          <button type="submit" class="secondary">စာရင်းသွင်းမည်</button>
        </form>
         <br>
        <p class="text-center">အကောင့်ရှိပြီးသားလား? <a href="/login">ဝင်ရောက်ရန်</a></p>
      </div>
    `);
}

// 3. Profile (Keep same, just update text)
export function profilePage(user: any, historyItems: any[], nextCursor: string, activeTab = "history", msg = "") {
  const bets = historyItems.filter(i => i.type === 'bet');
  const trans = historyItems.filter(i => i.type !== 'bet');
  
  const renderList = (list: any[]) => list.length ? list.map(i => `
    <div class="list-item">
      <div><div style="font-weight:bold">${i.description}</div><div style="font-size:0.7rem;color:#888">${new Date(i.timestamp).toLocaleString()}</div></div>
      <div class="badge ${i.type==='bet'?'bg-bet':(i.type==='win'?'bg-win':'bg-topup')}">${i.type==='bet'?'-':'+'}${i.amount}</div>
    </div>`).join('') : '<p class="text-center" style="color:#999">မှတ်တမ်းမရှိပါ</p>';

  return layout(`
    <div class="card" style="padding:0; overflow:hidden;">
       <div style="background:#4b6cb7; color:white; padding:20px; text-align:center;">
          <div style="font-size:1.2rem; font-weight:bold;">${user.username}</div>
          <div style="background:rgba(255,255,255,0.2); padding:10px; margin-top:10px; border-radius:8px; font-size:1.5rem;">${user.balance} Ks</div>
       </div>
       ${msg ? `<div class="msg success">${msg}</div>` : ''}

       <div class="tabs">
          <button id="btn-history" class="tab-btn ${activeTab==='history'?'active':''}" onclick="openTab('history')">📜 ထိုးမှတ်တမ်း</button>
          <button id="btn-trans" class="tab-btn ${activeTab==='trans'?'active':''}" onclick="openTab('trans')">💰 ငွေစာရင်း</button>
          <button id="btn-settings" class="tab-btn ${activeTab==='settings'?'active':''}" onclick="openTab('settings')">⚙️ ပြင်ဆင်ရန်</button>
       </div>

       <div id="history" class="tab-content ${activeTab==='history'?'active':''}">
          <div style="max-height:350px; overflow-y:auto; border:1px solid #eee; border-radius:8px;">${renderList(bets)}</div>
          ${nextCursor ? `<form><input type="hidden" name="cursor" value="${nextCursor}"><button style="margin-top:10px; background:#6c757d">နောက်ထပ်</button></form>`:''}
       </div>

       <div id="trans" class="tab-content ${activeTab==='trans'?'active':''}">
           <div style="max-height:350px; overflow-y:auto; border:1px solid #eee; border-radius:8px;">${renderList(trans)}</div>
           ${nextCursor ? `<form><input type="hidden" name="cursor" value="${nextCursor}"><input type="hidden" name="tab" value="trans"><button style="margin-top:10px; background:#6c757d">နောက်ထပ်</button></form>`:''}
       </div>

       <div id="settings" class="tab-content ${activeTab==='settings'?'active':''}">
          <h4>🔐 စကားဝှက် ပြောင်းရန်</h4>
          <form method="POST" action="/profile/password">
             <input type="password" name="new_password" placeholder="စကားဝှက် အသစ်" required>
             <button type="submit">ပြောင်းမည်</button>
          </form>
          <hr>
          <a href="/logout"><button class="danger">🚪 အကောင့်ထွက်မည်</button></a>
       </div>
    </div>
  `, true);
}

// 4. Admin Page (New Features)
export function adminPage(msg = "") {
    return layout(`
    <h2>👮‍♂️ Admin Control</h2>
    ${msg ? `<div class="msg success">${msg}</div>` : ''}
    
    <div class="card">
      <h3>💰 User ငွေဖြည့်ရန်</h3>
      <form method="POST" action="/admin/topup">
        <div class="grid-2">
            <input name="username" placeholder="Username" required />
            <input name="amount" type="number" placeholder="Amount" required />
        </div>
        <button type="submit" class="secondary">ငွေဖြည့်မည်</button>
      </form>
    </div>

    <div class="card" style="border: 2px solid #6610f2;">
      <h3>🏆 လျော်ကြေးရှင်းရန် (Payout)</h3>
      <form method="POST" action="/admin/payout">
        <label>ပေါက်ဂဏန်း:</label>
        <input name="number" type="tel" placeholder="2D (e.g. 55)" required />
        <div class="grid-2">
            <select name="session">
                <option value="morning">☀️ မနက်ပိုင်း (12:00)</option>
                <option value="evening">🌙 ညနေပိုင်း (4:30)</option>
            </select>
            <input name="multiplier" type="number" value="80" placeholder="အဆ (Default: 80)" />
        </div>
        <button type="submit" class="admin">လျော်ကြေး ရှင်းမည်</button>
      </form>
    </div>

    <div class="card" style="border: 1px solid red;">
       <h3>🔐 User Password Reset</h3>
       <form method="POST" action="/admin/resetpass">
         <div class="grid-2">
            <input name="username" placeholder="Username" required />
            <input name="new_password" placeholder="New Password" required />
         </div>
         <button type="submit" class="danger">Reset Password</button>
       </form>
    </div>
  `, true);
}

export function voucherPage(data:any) {
    return layout(`
    <div class="card text-center">
        <h2>✅ အောင်မြင်သည်</h2>
        <p>စုစုပေါင်း: <strong>${data.total} ကျပ်</strong></p>
        <div style="border:1px dashed #333; padding:10px; background:#fffbe6; text-align:left; font-family:monospace;">
            <div>Name: ${data.username}</div>
            <hr>
            ${data.bets.map((b:any)=> `<div>${b.num} - ${b.amt}</div>`).join('')}
        </div>
        <br>
        <a href="/"><button>နောက်တစ်ခု ထပ်ထိုးမည်</button></a>
        <br><br>
        <button onclick="window.print()" class="secondary">Save Voucher</button>
    </div>`, true);
}
