// ui.ts
function toMMTime(timestamp: number) {
    const date = new Date(timestamp + (6.5 * 60 * 60 * 1000));
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; 
    hours = hours ? hours : 12; 
    return `${date.getUTCDate()}/${date.getUTCMonth()+1} ${hours}:${minutes} ${ampm}`;
}

export function layout(content: string, currentPath: string, isLoggedIn = false) {
  return `
    <!DOCTYPE html>
    <html lang="my">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>2D Pro</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
          :root { --primary: #4e54c8; --secondary: #8f94fb; --accent: #ffb75e; --bg: #f3f4f6; }
          body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0 0 70px 0; background: var(--bg); color: #333; }
          
          /* Modern Card */
          .card { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 15px; border: none; }
          .header-card { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border-radius: 0 0 20px 20px; padding: 25px 20px; margin:0; box-shadow: 0 4px 10px rgba(78, 84, 200, 0.3); }
          
          h2, h3, h4 { margin: 0 0 10px 0; font-weight: 600; }
          input, select, button { width: 100%; padding: 14px; margin: 8px 0; border: 1px solid #e0e0e0; border-radius: 12px; box-sizing: border-box; font-size: 15px; outline: none; transition: 0.3s; }
          input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(78,84,200,0.1); }
          
          button { cursor: pointer; font-weight: 600; border: none; color: white; background: var(--primary); box-shadow: 0 4px 6px rgba(78,84,200,0.2); }
          button:active { transform: scale(0.97); }
          button.secondary { background: #11998e; }
          button.danger { background: #ff5f6d; }
          button.admin { background: #2c3e50; }

          /* Bottom Nav */
          .bottom-nav { position: fixed; bottom: 0; width: 100%; background: white; display: flex; justify-content: space-around; padding: 12px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 1000; border-top-left-radius: 20px; border-top-right-radius: 20px; }
          .nav-item { text-decoration: none; color: #999; text-align: center; font-size: 0.8rem; flex: 1; }
          .nav-item.active { color: var(--primary); font-weight: bold; }
          .nav-icon { font-size: 1.4rem; display: block; margin-bottom: 2px; }

          /* Tabs */
          .chip-container { display: flex; gap: 10px; overflow-x: auto; padding: 5px 15px; scrollbar-width: none; }
          .chip { padding: 8px 16px; background: white; border-radius: 20px; white-space: nowrap; border: 1px solid #ddd; cursor: pointer; font-size: 0.9rem; transition: 0.3s; }
          .chip.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 2px 5px rgba(78,84,200,0.3); }
          .tab-content { display: none; animation: fadeIn 0.3s; }
          .tab-content.active { display: block; }

          /* Utility */
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
          .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; }
          .bg-pending { background: #fff8e1; color: #f57f17; }
          .bg-win { background: #e8f5e9; color: #2e7d32; }
          .bg-bet { background: #ffebee; color: #c62828; }
          
          /* Loading */
          #loading { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:2000; align-items:center; justify-content:center; backdrop-filter: blur(5px); }
          .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        </style>
      </head>
      <body>
        <div id="loading"><div class="spinner"></div></div>
        ${content}
        
        <!-- Bottom Navigation -->
        ${isLoggedIn ? `
        <div class="bottom-nav">
          <a href="/" class="nav-item ${currentPath==='/'?'active':''}"><span class="nav-icon">🏠</span>ပင်မ</a>
          <a href="/results" class="nav-item ${currentPath==='/results'?'active':''}"><span class="nav-icon">🏆</span>ထွက်ဂဏန်း</a>
          <a href="/profile" class="nav-item ${currentPath==='/profile'?'active':''}"><span class="nav-icon">👤</span>အကောင့်</a>
        </div>` : ''}

        <script>
           // Loading & Tab Logic
           document.querySelectorAll('a, form').forEach(el => el.onclick = () => { if(!el.href || !el.href.includes('#')) document.getElementById('loading').style.display = 'flex' });
           window.onpageshow = () => document.getElementById('loading').style.display = 'none';

           function openTab(id, btn) {
               document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
               document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
               document.getElementById(id).classList.add('active');
               btn.classList.add('active');
           }
           
           // Voucher DL
           function dlVoucher() {
                html2canvas(document.getElementById("voucher-div")).then(c => {
                    let l = document.createElement("a"); l.download = "2d_voucher.png"; l.href = c.toDataURL(); l.click();
                });
           }
           
           // Confirm Modal Logic (Built-in Browser Confirm for Simplicity/Reliability on Mobile)
           function confirmBet(form) {
               const amt = form.querySelector('[name="amount"]').value;
               if(!amt) { alert("ပမာဏ ထည့်ပါ"); return false; }
               return confirm("ထိုးမှာ သေချာလား?");
           }
        </script>
      </body>
    </html>
  `;
}

export function homePage(user: any, gameStatus: any, msg = "") {
  // Session Display Text
  const sessTxt = gameStatus.currentSession === 'morning' ? "☀️ မနက်ပိုင်း (12:00)" : "🌙 ညနေပိုင်း (4:30)";
  const statusColor = gameStatus.isOpen ? "#4caf50" : "#f44336";
  const statusTxt = gameStatus.isOpen ? "ဖွင့်သည်" : "ပိတ်ထားသည်";

  return layout(`
    <div class="header-card">
       <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0; font-weight:300;">မင်္ဂလာပါ,</h3>
            <h2 style="margin:0;">${user.username}</h2>
          </div>
          <div style="text-align:right;">
             <div style="font-size:0.8rem; opacity:0.9;">လက်ကျန်ငွေ</div>
             <div style="font-size:1.4rem; font-weight:bold;">${user.balance.toLocaleString()} Ks</div>
          </div>
       </div>
       <div style="margin-top:15px; background:rgba(255,255,255,0.15); padding:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.9rem;">${sessTxt}</span>
          <span style="background:white; color:${statusColor}; padding:3px 10px; border-radius:20px; font-size:0.8rem; font-weight:bold;">● ${statusTxt}</span>
       </div>
    </div>
    
    ${msg ? `<div style="margin:15px; padding:15px; background:${msg.includes('❌')?'#ffebee':'#e8f5e9'}; border-radius:10px; text-align:center; color:#333;">${msg}</div>` : ''}

    <div style="margin-top:10px;">
        <div class="chip-container">
            <div class="chip active" onclick="openTab('tab-2d', this)">💎 2D ထိုး</div>
            <div class="chip" onclick="openTab('tab-break', this)">⚡ အပယ် (Break)</div>
            <div class="chip" onclick="openTab('tab-ht', this)">🔢 လုံးစီး</div>
            <div class="chip" onclick="openTab('tab-short', this)">🚀 Shortcut</div>
        </div>
    </div>

    <!-- 1. Normal 2D -->
    <div id="tab-2d" class="tab-content active">
        <div class="card">
          <h4>💎 ရိုးရိုးထိုး (R ပါ)</h4>
          <form method="POST" action="/bet" onsubmit="return confirmBet(this)">
            <input type="hidden" name="type" value="normal">
            <div class="grid-2">
                <input name="number" type="tel" maxlength="2" placeholder="ဂဏန်း (e.g. 55)" required>
                <input name="amount" type="number" placeholder="ပမာဏ" required>
            </div>
            <div style="margin:10px 0; display:flex; align-items:center; gap:10px;">
                <input type="checkbox" name="r_bet" value="yes" style="width:20px; height:20px; margin:0;">
                <label>R (အပြန်အလှန်)</label>
            </div>
            <button type="submit">ထိုးမည်</button>
          </form>
        </div>
    </div>

    <!-- 2. Break (New Logic) -->
    <div id="tab-break" class="tab-content">
        <div class="card">
          <h4>⚡ အပယ် (Break) Logic</h4>
          <p style="font-size:0.8rem; color:#666;">ဂဏန်း (၃) လုံးရိုက်ထည့်ပါ။ ထိုဂဏန်းများ အချင်းချင်းတွဲခြင်း နှင့် အပူးများကို ပယ်ပြီး ကျန်တွဲလုံးများကို R ဖြင့် ထိုးပေးပါမည်။</p>
          <form method="POST" action="/bet" onsubmit="return confirmBet(this)">
            <input type="hidden" name="type" value="break">
            <label>ဂဏန်း (၃) လုံး (ဥပမာ: 538)</label>
            <input name="digits" type="tel" maxlength="3" placeholder="538" required style="letter-spacing:5px; font-weight:bold; text-align:center;">
            <input name="amount" type="number" placeholder="တစ်ကွက်လျှင် ထိုးကြေး" required>
            <button type="submit" class="secondary">တွက်ချက်ပြီး ထိုးမည်</button>
          </form>
        </div>
    </div>

    <!-- 3. Head/Tail -->
    <div id="tab-ht" class="tab-content">
        <div class="card">
          <h4>🔢 လုံးစီး (၁၀ ကွက်)</h4>
          <form method="POST" action="/bet" onsubmit="return confirmBet(this)">
            <input type="hidden" name="type" value="head_tail">
            <div class="grid-2">
                <select name="position">
                    <option value="head">ထိပ်စီး</option>
                    <option value="tail">နောက်ပိတ်</option>
                </select>
                <input name="digit" type="tel" maxlength="1" placeholder="ဂဏန်း (0-9)" required>
            </div>
            <input name="amount" type="number" placeholder="တစ်ကွက်လျှင် ထိုးကြေး" required>
            <button type="submit">ထိုးမည်</button>
          </form>
        </div>
    </div>

    <!-- 4. Shortcut -->
    <div id="tab-short" class="tab-content">
        <div class="card">
          <h4>🚀 အမြန်ထိုး</h4>
          <form method="POST" action="/bet" onsubmit="return confirmBet(this)">
            <input type="hidden" name="type" value="shortcut">
            <div class="grid-2">
               <button type="submit" name="set" value="double" class="secondary" style="background:#ffb75e; color:black;">အပူး (၁၀) ကွက်</button>
               <button type="submit" name="set" value="power" class="secondary" style="background:#8f94fb;">ပါဝါ (၁၀) ကွက်</button>
            </div>
            <input name="amount" type="number" placeholder="တစ်ကွက်လျှင် ထိုးကြေး" required style="margin-top:15px;">
          </form>
        </div>
    </div>

    ${user.role === 'admin' ? '<div style="text-align:center; margin-bottom:20px;"><a href="/admin"><button class="admin" style="width:auto; padding:10px 30px;">Admin Panel</button></a></div>' : ''}
  `, '/', true);
}

export function voucherPage(data: any) {
    return layout(`
    <div class="card" style="text-align:center;">
        <div style="font-size:3rem;">✅</div>
        <h2>အောင်မြင်ပါသည်</h2>
        <div id="voucher-div" style="background:#fffde7; padding:20px; border:1px dashed #aaa; margin:15px 0; text-align:left; font-family:monospace; position:relative;">
             <div style="text-align:center; font-weight:bold; border-bottom:1px solid #ddd; padding-bottom:5px; margin-bottom:5px;">2D VOUCHER</div>
             <div><strong>Name:</strong> ${data.username}</div>
             <div><strong>Time:</strong> ${toMMTime(Date.now())}</div>
             <hr style="border:0; border-top:1px dashed #ccc;">
             <div style="display:flex; flex-wrap:wrap; gap:5px;">
                 ${data.bets.map((b:any) => `<span style="background:white; border:1px solid #ddd; padding:2px 5px; border-radius:3px;">${b.num}-${b.amt}</span>`).join('')}
             </div>
             <hr style="border:0; border-top:1px dashed #ccc;">
             <div style="text-align:right; font-size:1.2rem; font-weight:bold;">Total: ${data.total} Ks</div>
        </div>
        <button onclick="dlVoucher()" class="secondary">📥 Save Image</button>
        <br><br>
        <a href="/"><button>နောက်တစ်ခု ထပ်ထိုးမည်</button></a>
    </div>
    `, '/');
}

export function profilePage(user: any, historyItems: any[]) {
    // Simplified Profile for brevity - Focus on History
    const list = historyItems.length ? historyItems.map(i => `
       <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee; background:white;">
          <div>
             <div style="font-weight:600; font-size:0.95rem;">${i.description}</div>
             <div style="font-size:0.75rem; color:#888;">${toMMTime(i.timestamp)}</div>
          </div>
          <div class="badge ${i.type==='bet'?'bg-bet':(i.type==='win'?'bg-win':'bg-pending')}">
             ${i.type==='bet'?'-':'+'}${i.amount}
          </div>
       </div>
    `).join('') : '<div style="padding:20px; text-align:center; color:#888;">မှတ်တမ်း မရှိပါ</div>';

    return layout(`
      <div style="background:var(--primary); padding:30px 20px; color:white; border-radius:0 0 20px 20px; text-align:center;">
          <div style="font-size:2rem; font-weight:bold;">${user.username}</div>
          <div style="opacity:0.9;">လက်ကျန်ငွေ: ${user.balance} Ks</div>
      </div>
      <div style="margin-top:-20px; padding:0 15px;">
         <div class="card" style="padding:0; overflow:hidden;">
            ${list}
         </div>
         <div style="text-align:center; margin-bottom:20px;">
             <form method="POST" action="/logout"><button class="danger" style="width:auto;">Logout</button></form>
         </div>
      </div>
    `, '/profile', true);
}

export function winHistoryPage(results: any[]) {
    return layout(`
       <div class="header-card">
           <h2>🏆 ထွက်ဂဏန်းများ</h2>
       </div>
       <div style="padding:15px;">
          ${results.map(r => `
             <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin:0 0 10px 0;">
                 <div>
                    <div style="font-weight:bold;">${r.date}</div>
                    <div class="badge" style="background:#eee;">${r.session==='morning'?'☀️ Morning':'🌙 Evening'}</div>
                 </div>
                 <div style="font-size:2rem; font-weight:bold; color:var(--primary);">${r.number}</div>
             </div>
          `).join('')}
       </div>
    `, '/results', true);
}

// ... Login/Admin (Minimal) ...
export function loginPage(e=""){return layout(`<div style="display:flex; height:100vh; align-items:center; justify-content:center; background:white;"><div style="width:80%;"><h1 style="color:var(--primary);">Login</h1><form method="POST" action="/login"><input name="username" placeholder="User" required><input type="password" name="password" placeholder="Pass" required><button>Login</button></form><br><a href="/register">Register</a></div></div>`, '/login');}
export function registerPage(e=""){return layout(`<div style="display:flex; height:100vh; align-items:center; justify-content:center; background:white;"><div style="width:80%;"><h1 style="color:var(--primary);">Register</h1><form method="POST" action="/register"><input name="username" placeholder="User" required><input type="password" name="password" placeholder="Pass" required><button>Register</button></form><br><a href="/login">Login</a></div></div>`, '/register');}
export function adminPage(m="") { return layout(`<h2>Admin</h2>${m}<div class="card"><form method="POST" action="/admin/topup"><input name="username" placeholder="User"><input name="amount" placeholder="Amt"><button>Topup</button></form></div><div class="card"><form method="POST" action="/admin/payout"><input name="number" placeholder="Win Num"><select name="session"><option value="morning">Morning</option><option value="evening">Evening</option></select><button>Payout</button></form></div>`, '/admin', true); }
