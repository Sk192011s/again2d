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
          :root { --primary: #4e54c8; --secondary: #8f94fb; --bg: #f3f4f6; }
          body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0 0 70px 0; background: var(--bg); color: #333; }
          
          .card { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 15px; border: none; }
          .header-card { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border-radius: 0 0 20px 20px; padding: 25px 20px; margin:0; }
          
          input, select, button { width: 100%; padding: 14px; margin: 8px 0; border: 1px solid #e0e0e0; border-radius: 12px; box-sizing: border-box; font-size: 15px; outline: none; }
          input:focus { border-color: var(--primary); }
          
          button { cursor: pointer; font-weight: 600; border: none; color: white; background: var(--primary); }
          button.secondary { background: #11998e; }
          button.danger { background: #dc3545; }
          button.admin { background: #2c3e50; }

          /* Bottom Nav */
          .bottom-nav { position: fixed; bottom: 0; width: 100%; background: white; display: flex; justify-content: space-around; padding: 12px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); z-index: 1000; border-top-left-radius: 20px; border-top-right-radius: 20px; }
          .nav-item { text-decoration: none; color: #999; text-align: center; font-size: 0.8rem; flex: 1; }
          .nav-item.active { color: var(--primary); font-weight: bold; }
          .nav-icon { font-size: 1.4rem; display: block; margin-bottom: 2px; }

          /* Tabs & Utilities */
          .chip-container { display: flex; gap: 10px; overflow-x: auto; padding: 5px 15px; }
          .chip { padding: 8px 16px; background: white; border-radius: 20px; white-space: nowrap; border: 1px solid #ddd; cursor: pointer; }
          .chip.active { background: var(--primary); color: white; border-color: var(--primary); }
          .tab-content { display: none; }
          .tab-content.active { display: block; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          
          /* Status Badges */
          .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; }
          .bg-pending { background: #fff3cd; color: #856404; }
          .bg-win { background: #d1e7dd; color: #0f5132; }
          .bg-bet { background: #f8d7da; color: #842029; }
          .bg-topup { background: #cff4fc; color: #055160; }
          .bg-withdraw { background: #e2e3e5; color: #383d41; }
          
          #loading { display: none; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:2000; align-items:center; justify-content:center; }
          .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div id="loading"><div class="spinner"></div></div>
        ${content}
        
        ${isLoggedIn ? `
        <div class="bottom-nav">
          <a href="/" class="nav-item ${currentPath==='/'?'active':''}"><span class="nav-icon">🏠</span>ပင်မ</a>
          <a href="/results" class="nav-item ${currentPath==='/results'?'active':''}"><span class="nav-icon">🏆</span>ထွက်ဂဏန်း</a>
          <a href="/profile" class="nav-item ${currentPath==='/profile'?'active':''}"><span class="nav-icon">👤</span>အကောင့်</a>
        </div>` : ''}

        <script>
           // Loading for Links & Forms
           document.querySelectorAll('a:not([href^="#"]):not([href^="javascript"])').forEach(a => a.onclick = () => document.getElementById('loading').style.display = 'flex');
           document.querySelectorAll('form').forEach(f => f.onsubmit = () => document.getElementById('loading').style.display = 'flex');
           window.onpageshow = () => document.getElementById('loading').style.display = 'none';

           function openTab(id, btn) {
               document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
               document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
               document.getElementById(id).classList.add('active');
               btn.classList.add('active');
           }
           
           function dlVoucher() {
                html2canvas(document.getElementById("voucher-div")).then(c => {
                    let l = document.createElement("a"); l.download = "2d_voucher.png"; l.href = c.toDataURL(); l.click();
                });
           }
           
           // Fixed Confirm Function
           function checkConfirm(event, msg) {
               if(!confirm(msg)) {
                   event.preventDefault();
                   document.getElementById('loading').style.display = 'none'; // hide loader if canceled
                   return false;
               }
               return true;
           }

           function confirmBet(event) {
               const form = event.target;
               const amt = form.querySelector('[name="amount"]').value;
               if(!amt) { alert("ပမာဏ ထည့်ပါ"); event.preventDefault(); return false; }
               return checkConfirm(event, "ထိုးမှာ သေချာလား?");
           }
        </script>
      </body>
    </html>
  `;
}

// 1. Home Page
export function homePage(user: any, gameStatus: any, msg = "") {
  const sessTxt = gameStatus.currentSession === 'morning' ? "☀️ မနက်ပိုင်း (12:00)" : "🌙 ညနေပိုင်း (4:30)";
  const statusColor = gameStatus.isOpen ? "#4caf50" : "#f44336";
  const statusTxt = gameStatus.isOpen ? "ဖွင့်သည်" : "ပိတ်ထားသည်";

  return layout(`
    <div class="header-card">
       <div style="display:flex; justify-content:space-between; align-items:center;">
          <div><h3 style="margin:0;">မင်္ဂလာပါ,</h3><h2 style="margin:0;">${user.username}</h2></div>
          <div style="text-align:right;"><div style="opacity:0.9;">လက်ကျန်ငွေ</div><div style="font-size:1.4rem; font-weight:bold;">${user.balance.toLocaleString()} Ks</div></div>
       </div>
       <div style="margin-top:15px; background:rgba(255,255,255,0.15); padding:10px; border-radius:10px; display:flex; justify-content:space-between;">
          <span>${sessTxt}</span>
          <span style="background:white; color:${statusColor}; padding:2px 10px; border-radius:10px; font-weight:bold;">● ${statusTxt}</span>
       </div>
    </div>
    
    ${msg ? `<div style="margin:15px; padding:15px; background:${msg.includes('❌')?'#ffebee':'#e8f5e9'}; border-radius:10px; text-align:center;">${msg}</div>` : ''}

    <div style="margin-top:10px;">
        <div class="chip-container">
            <div class="chip active" onclick="openTab('tab-2d', this)">💎 2D</div>
            <div class="chip" onclick="openTab('tab-break', this)">⚡ Break</div>
            <div class="chip" onclick="openTab('tab-ht', this)">🔢 လုံးစီး</div>
            <div class="chip" onclick="openTab('tab-short', this)">🚀 Shortcut</div>
        </div>
    </div>

    <div id="tab-2d" class="tab-content active">
        <div class="card">
          <h4>💎 ရိုးရိုးထိုး (R ပါ)</h4>
          <form method="POST" action="/bet" onsubmit="return confirmBet(event)">
            <input type="hidden" name="type" value="normal">
            <div class="grid-2"><input name="number" type="tel" maxlength="2" placeholder="ဂဏန်း" required><input name="amount" type="number" placeholder="ပမာဏ" required></div>
            <div style="margin:10px 0;"><input type="checkbox" name="r_bet" value="yes" style="width:auto"> R (အပြန်အလှန်)</div>
            <button>ထိုးမည်</button>
          </form>
        </div>
    </div>

    <div id="tab-break" class="tab-content">
        <div class="card">
          <h4>⚡ အပယ် (Break)</h4>
          <form method="POST" action="/bet" onsubmit="return confirmBet(event)">
            <input type="hidden" name="type" value="break">
            <input name="digits" type="tel" maxlength="3" placeholder="ဂဏန်း ၃ လုံး (e.g. 538)" required style="text-align:center; letter-spacing:5px;">
            <input name="amount" type="number" placeholder="ပမာဏ" required>
            <button class="secondary">ထိုးမည်</button>
          </form>
        </div>
    </div>

    <div id="tab-ht" class="tab-content">
        <div class="card">
          <h4>🔢 လုံးစီး</h4>
          <form method="POST" action="/bet" onsubmit="return confirmBet(event)">
            <input type="hidden" name="type" value="head_tail">
            <div class="grid-2">
                <select name="position"><option value="head">ထိပ်စီး</option><option value="tail">နောက်ပိတ်</option></select>
                <input name="digit" type="tel" maxlength="1" placeholder="ဂဏန်း" required>
            </div>
            <input name="amount" type="number" placeholder="ပမာဏ" required>
            <button>ထိုးမည်</button>
          </form>
        </div>
    </div>

    <div id="tab-short" class="tab-content">
        <div class="card">
          <h4>🚀 အမြန်ထိုး</h4>
          <form method="POST" action="/bet" onsubmit="return confirmBet(event)">
            <input type="hidden" name="type" value="shortcut">
            <div class="grid-2">
               <button type="submit" name="set" value="double" class="secondary" style="background:#ffb75e; color:black;">အပူး</button>
               <button type="submit" name="set" value="power" class="secondary" style="background:#8f94fb;">ပါဝါ</button>
            </div>
            <input name="amount" type="number" placeholder="ပမာဏ" required style="margin-top:10px;">
          </form>
        </div>
    </div>
    
    ${user.role==='admin' ? '<div style="text-align:center;"><a href="/admin"><button class="admin" style="width:auto; padding:10px 30px;">Admin Panel</button></a></div>' : ''}
  `, '/', true);
}

// 2. Profile Page (Updated History Labels)
export function profilePage(user: any, historyItems: any[], msg="") {
    const list = historyItems.length ? historyItems.map(i => {
       let badgeClass = 'bg-bet', text = '', sign = '-';
       if (i.type === 'win') { badgeClass='bg-win'; text='Win'; sign='+'; }
       else if (i.type === 'topup') { badgeClass='bg-topup'; text='Deposit'; sign='+'; }
       else if (i.type === 'withdraw') { badgeClass='bg-withdraw'; text='Withdraw'; sign='-'; }
       else if (i.status === 'pending') { badgeClass='bg-pending'; text='Pending'; sign='-'; }
       else { text='Bet'; }

       return `
       <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee; background:white;">
          <div><div style="font-weight:600;">${i.description}</div><div style="font-size:0.75rem; color:#888;">${toMMTime(i.timestamp)}</div></div>
          <div style="text-align:right;">
             <div style="font-weight:bold;">${sign}${i.amount}</div>
             <div class="badge ${badgeClass}">${text}</div>
          </div>
       </div>`;
    }).join('') : '<div style="padding:20px; text-align:center; color:#888;">မှတ်တမ်း မရှိပါ</div>';

    return layout(`
      <div style="background:var(--primary); padding:30px 20px; color:white; border-radius:0 0 20px 20px; text-align:center;">
          <div style="font-size:2rem; font-weight:bold;">${user.username}</div>
          <div>လက်ကျန်ငွေ: ${user.balance.toLocaleString()} Ks</div>
      </div>
      ${msg ? `<div style="text-align:center; padding:10px; background:#e8f5e9; color:green; margin:10px;">${msg}</div>` : ''}
      <div style="margin-top:-20px; padding:0 15px;">
         <div style="display:flex; justify-content:space-between; align-items:center; margin:10px 5px;">
             <h4>📜 မှတ်တမ်း</h4>
             <form method="POST" action="/profile/clear" onsubmit="return checkConfirm(event, 'Pending မှလွဲ၍ ကျန်သည်များ ဖျက်မည်။ သေချာလား?')">
                 <button class="danger" style="padding:5px 10px; font-size:0.8rem;">🗑️ ရှင်းမည်</button>
             </form>
         </div>
         <div class="card" style="padding:0; overflow:hidden; max-height:400px; overflow-y:auto;">${list}</div>
         <div class="card">
             <h4>🔐 Password ပြောင်းရန်</h4>
             <form method="POST" action="/profile/password">
                 <input type="password" name="new_password" placeholder="စကားဝှက် အသစ်" required>
                 <button class="secondary">ပြောင်းမည်</button>
             </form>
         </div>
         <div style="text-align:center; margin-bottom:20px;">
             <form method="POST" action="/logout"><button class="danger" style="width:auto;">အကောင့်ထွက်မည်</button></form>
         </div>
      </div>
    `, '/profile', true);
}

// 3. Admin Page (With Winners List)
export function adminPage(winners: string[] = [], msg="") { 
    return layout(`
    <h2>👮‍♂️ Admin Panel</h2>
    ${msg ? `<div style="padding:10px; background:#d1e7dd; margin-bottom:10px;">${msg}</div>` : ''}
    
    ${winners.length > 0 ? `
    <div class="card" style="border:2px solid green;">
        <h3>🎉 ယခုပေါက်သူများ (${winners.length})</h3>
        <ul style="max-height:150px; overflow-y:auto;">${winners.map(w => `<li>${w}</li>`).join('')}</ul>
    </div>` : ''}

    <div class="card">
        <h3>💰 ငွေစာရင်း</h3>
        <form method="POST" action="/admin/manage_money">
            <input name="username" placeholder="Username" required>
            <input name="amount" type="number" placeholder="Amount" required>
            <div class="grid-2">
                <button type="submit" name="action" value="topup" class="secondary">ငွေဖြည့်</button>
                <button type="submit" name="action" value="withdraw" class="danger">ငွေထုတ်</button>
            </div>
        </form>
    </div>
    
    <div class="card">
        <h3>🏆 လျော်ကြေး (Payout)</h3>
        <form method="POST" action="/admin/payout" onsubmit="return checkConfirm(event, 'လျော်ကြေးရှင်းမှာ သေချာလား?')">
            <input name="number" placeholder="ထွက်ဂဏန်း (e.g. 55)" required>
            <select name="session"><option value="morning">Morning</option><option value="evening">Evening</option></select>
            <button class="admin">ရှင်းမည်</button>
        </form>
    </div>
    `, '/admin', true); 
}

export function loginPage(e=""){return layout(`<div style="display:flex; height:100vh; align-items:center; justify-content:center; background:white;"><div style="width:85%;"><h2 style="color:var(--primary); text-align:center;">အကောင့်ဝင်ရန်</h2>${e?`<p style="color:red; text-align:center;">${e}</p>`:''}<form method="POST" action="/login"><input name="username" placeholder="အသုံးပြုသူအမည်" required><input type="password" name="password" placeholder="စကားဝှက်" required><button>ဝင်ရောက်မည်</button></form><br><div style="text-align:center;"><a href="/register" style="color:#666;">အကောင့်မရှိဘူးလား? <b>အကောင့်သစ်ဖွင့်ပါ</b></a></div></div></div>`, '/login');}
export function registerPage(e=""){return layout(`<div style="display:flex; height:100vh; align-items:center; justify-content:center; background:white;"><div style="width:85%;"><h2 style="color:var(--primary); text-align:center;">အကောင့်သစ်ဖွင့်ရန်</h2>${e?`<p style="color:red; text-align:center;">${e}</p>`:''}<form method="POST" action="/register"><input name="username" placeholder="အသုံးပြုသူအမည်" required><input type="password" name="password" placeholder="စကားဝှက်" required><button class="secondary">စာရင်းသွင်းမည်</button></form><br><div style="text-align:center;"><a href="/login" style="color:#666;">အကောင့်ရှိပြီးသားလား? <b>ဝင်ရောက်ပါ</b></a></div></div></div>`, '/register');}
export function voucherPage(d){return layout(`<div class="card" style="text-align:center;"><div style="font-size:3rem;">✅</div><h2>အောင်မြင်ပါသည်</h2><div id="voucher-div" style="background:#fffde7; padding:20px; border:1px dashed #aaa; text-align:left;"><div>Name: ${d.username}</div><div>Time: ${toMMTime(Date.now())}</div><hr><div style="display:flex; gap:5px; flex-wrap:wrap;">${d.bets.map(b=>`<span>${b.num}-${b.amt}</span>`).join(' ')}</div><hr><div style="text-align:right; font-weight:bold;">Total: ${d.total} Ks</div></div><button onclick="dlVoucher()" class="secondary">Save Image</button><br><br><a href="/"><button>နောက်တစ်ခု</button></a></div>`, '/');}
export function winHistoryPage(r){return layout(`<div class="header-card"><h2>🏆 ထွက်ဂဏန်း</h2></div><div style="padding:15px;">${r.map(x=>`<div class="card" style="display:flex; justify-content:space-between; align-items:center;"><div><b>${x.date}</b><div class="badge" style="background:#eee;">${x.session}</div></div><div style="font-size:2rem; color:var(--primary); font-weight:bold;">${x.number}</div></div>`).join('')}</div>`, '/results', true);}
