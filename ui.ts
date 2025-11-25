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
          body { font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 10px; background: #e9ecef; }
          .card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 15px; }
          input, select, button { width: 100%; padding: 12px; margin: 6px 0; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box; }
          button { cursor: pointer; transition: 0.2s; font-weight: bold; border: none; color: white; background: #0d6efd;}
          button:active { transform: scale(0.98); }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          
          /* Navigation */
          .nav { display: flex; justify-content: space-between; margin-bottom: 15px; background: white; padding: 10px; border-radius: 8px; }
          .nav a { text-decoration: none; font-weight: bold; color: #495057; }

          /* Custom Buttons */
          .btn-select { background: #f8f9fa; color: #333; border: 2px solid #ddd; }
          .btn-select.active { background: #ffc107; color: black; border-color: #e0a800; box-shadow: 0 0 8px rgba(255, 193, 7, 0.5); }
          
          /* Modal (Confirm Box) */
          .modal { display: none; position: fixed; z-index: 100; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
          .modal-content { background-color: white; margin: 15% auto; padding: 20px; border-radius: 10px; width: 80%; text-align: center; }
          .modal-buttons { display: flex; gap: 10px; margin-top: 20px; }
          .btn-confirm { background: #198754; flex: 1; }
          .btn-cancel { background: #dc3545; flex: 1; }

          /* Voucher Styling */
          .voucher { border: 2px dashed #333; padding: 20px; background: #fffbe6; font-family: 'Courier New', monospace; position: relative; }
          .voucher h2 { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-top: 0; }
          .voucher-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .voucher-total { border-top: 1px dashed #333; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 1.2rem; }
          .watermark { position: absolute; top: 30%; left: 20%; opacity: 0.1; font-size: 3rem; transform: rotate(-30deg); color: red; font-weight: bold; }
          
          @media print {
            body * { visibility: hidden; }
            .voucher, .voucher * { visibility: visible; }
            .voucher { position: absolute; left: 0; top: 0; width: 100%; border: none; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="nav">
          <a href="/">🏠 Home</a>
          ${isLoggedIn ? '<a href="/logout">🚪 Logout</a>' : '<a href="/login">🔑 Login</a>'}
        </div>
        ${content}
        
        <script>
          // Script for Button Selection & Modal
          let selectedSet = "";

          function selectType(type, btn) {
            // Reset colors
            document.querySelectorAll('.btn-select').forEach(b => b.classList.remove('active'));
            // Set active
            btn.classList.add('active');
            selectedSet = type;
            document.getElementById('hidden_set').value = type;
          }

          function showConfirm(formId, type) {
            const modal = document.getElementById('confirmModal');
            const desc = document.getElementById('modalDesc');
            const amountInput = document.querySelector(\`#\${formId} input[name="amount"]\`);
            const amount = amountInput ? amountInput.value : 0;
            
            if(!amount) { alert("ငွေပမာဏ ထည့်ပေးပါ"); return false; }

            let message = "";
            if(type === 'normal') {
                const num = document.querySelector(\`#\${formId} input[name="number"]\`).value;
                const r = document.querySelector(\`#\${formId} input[name="r_bet"]\`)?.checked ? "(R)" : "";
                message = \`ထိုးမည့်ဂဏန်း: \${num} \${r}<br>ငွေပမာဏ: \${amount} ကျပ်\`;
            } else if (type === 'head_tail') {
                 const pos = document.querySelector(\`#\${formId} select[name="position"]\`).value;
                 const digit = document.querySelector(\`#\${formId} input[name="digit"]\`).value;
                 const txt = pos === 'head' ? 'ထိပ်' : 'နောက်';
                 message = \`လုံးစီး: \${digit} (\${txt})<br>ငွေပမာဏ: \${amount} ကျပ် (တစ်ကွက်)\`;
            } else if (type === 'shortcut') {
                if(!selectedSet) { alert("အပူး သို့မဟုတ် ပါဝါ ရွေးပါ"); return false; }
                const txt = selectedSet === 'double' ? 'အပူး (၁၀) ကွက်' : 'ပါဝါ (၁၀) ကွက်';
                message = \`အမျိုးအစား: \${txt}<br>ငွေပမာဏ: \${amount} ကျပ် (တစ်ကွက်)\`;
            }

            desc.innerHTML = message;
            modal.style.display = "block";
            
            // Assign Confirm Action
            document.getElementById('btnRealConfirm').onclick = function() {
                document.getElementById(formId).submit();
            };
            return false;
          }

          function closeModal() {
            document.getElementById('confirmModal').style.display = "none";
          }
        </script>
      </body>
    </html>
  `;
}

// ... Login / Register pages remain same (omitted for brevity, copy from previous code if needed) ...
export function loginPage(error = "") {
    return layout(`
      <div class="card">
        <h2>Login</h2>
        ${error ? `<p style="color:red">${error}</p>` : ""}
        <form method="POST" action="/login">
          <input name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <br><a href="/register">Register</a>
      </div>
    `);
}
  
export function registerPage(error = "") {
    return layout(`
      <div class="card">
        <h2>Register</h2>
        ${error ? `<p style="color:red">${error}</p>` : ""}
        <form method="POST" action="/register">
          <input name="username" placeholder="Username" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit" class="secondary">Register</button>
        </form>
      </div>
    `);
}

export function homePage(user: any, msg = "") {
  return layout(`
    <div class="card">
      <h3>👋 မင်္ဂလာပါ ${user.username}</h3>
      <p>လက်ကျန်ငွေ: <strong>${user.balance} ကျပ်</strong></p>
      ${user.role === 'admin' ? '<a href="/admin"><button style="background:#6610f2">Admin Panel</button></a>' : ''}
    </div>

    ${msg}

    <!-- 1. Normal Bet -->
    <div class="card">
      <h4>💎 ရိုးရိုးထိုး (R ပါ)</h4>
      <form id="formNormal" method="POST" action="/bet" onsubmit="return showConfirm('formNormal', 'normal')">
        <input type="hidden" name="type" value="normal" />
        <div class="grid-2">
           <input name="number" type="text" pattern="[0-9]*" maxlength="2" placeholder="ဂဏန်း (e.g. 25)" required />
           <input name="amount" type="number" placeholder="ငွေပမာဏ" required />
        </div>
        <div style="margin:10px 0;">
            <input type="checkbox" name="r_bet" value="yes" id="r_check" style="width:auto;">
            <label for="r_check">R (အပြန်အလှန်)</label>
        </div>
        <button type="submit">ထိုးမည်</button>
      </form>
    </div>

    <!-- 2. Shortcut Bet (Buttons) -->
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
    
    <!-- 3. Head/Tail -->
    <div class="card">
      <h4>🔢 လုံးစီး</h4>
      <form id="formHT" method="POST" action="/bet" onsubmit="return showConfirm('formHT', 'head_tail')">
        <input type="hidden" name="type" value="head_tail" />
        <div class="grid-2">
            <select name="position">
                <option value="head">ထိပ်စီး</option>
                <option value="tail">နောက်ပိတ်</option>
            </select>
            <input name="digit" type="number" min="0" max="9" placeholder="ဂဏန်း (0-9)" required />
        </div>
        <input name="amount" type="number" placeholder="ထိုးကြေး" required />
        <button type="submit">ထိုးမည်</button>
      </form>
    </div>

    <!-- Modal HTML -->
    <div id="confirmModal" class="modal">
        <div class="modal-content">
            <h3>❗ ထိုးမှာ သေချာလား?</h3>
            <p id="modalDesc" style="font-size: 1.1rem; color: #555;"></p>
            <div class="modal-buttons">
                <button type="button" class="btn-cancel" onclick="closeModal()">မထိုးပါ</button>
                <button type="button" class="btn-confirm" id="btnRealConfirm">သေချာတယ် ထိုးမယ်</button>
            </div>
        </div>
    </div>
  `, true);
}

// Voucher Page Layout
export function voucherPage(data: any) {
  const date = new Date();
  // Myanmar Time Offset (UTC+6:30)
  const mmTime = new Date(date.getTime() + (6.5 * 60 * 60 * 1000));
  const timeString = mmTime.toUTCString().split(' ')[4]; // simple HH:MM:SS extraction
  const hour = mmTime.getUTCHours();
  
  // Session determination
  const session = hour < 12 ? "မနက်ပိုင်း (12:00 PM)" : "ညနေပိုင်း (4:30 PM)";
  const dateString = mmTime.toISOString().split('T')[0];

  return layout(`
    <div class="card">
        <div class="voucher">
            <div class="watermark">PAID</div>
            <h2>✅ ဘောင်ချာမှတ်တမ်း</h2>
            <div class="voucher-row"><span>အမည်:</span> <strong>${data.username}</strong></div>
            <div class="voucher-row"><span>ရက်စွဲ:</span> <span>${dateString}</span></div>
            <div class="voucher-row"><span>အချိန်:</span> <span>${session}</span></div>
            <hr style="border-style: dashed;">
            <div class="voucher-row">
                <span style="width: 60%">ဂဏန်းများ</span>
                <span>ပမာဏ</span>
            </div>
            ${data.bets.map((b: any) => `
                <div class="voucher-row">
                    <span style="width: 60%">${b.num}</span>
                    <span>${b.amt}</span>
                </div>
            `).join('')}
            <div class="voucher-total">
                <div class="voucher-row">
                    <span>စုစုပေါင်း:</span>
                    <span>${data.total} ကျပ်</span>
                </div>
            </div>
            <br>
            <p style="text-align:center; font-size: 0.8rem;">** ကျေးဇူးတင်ပါသည် **</p>
        </div>
        <br>
        <button onclick="window.print()" style="background: #333;">🖨️ Save Voucher (PDF/Screenshot)</button>
        <a href="/"><button style="margin-top:10px;">နောက်တစ်ခု ထပ်ထိုးမယ်</button></a>
    </div>
  `, true);
}

export function adminPage(msg = "") {
    // ... Copy from previous adminPage code ...
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
