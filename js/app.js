const App = {
    data: { users: [], currentUser: null, isDarkMode: true, staff: [] },
    jsonbin: { binId:'68d9759343b1c97be9534096', secretKey:'$2a$10$DTiU3hcuglHpTy/sU3hUKuHWnX7exTTkb6/eahL2zr9cyIwo9feTK', apiUrl:'https://api.jsonbin.io/v3/b/' },

    storage: {
        async load() {
            try {
                const res = await fetch(`${App.jsonbin.apiUrl}${App.jsonbin.binId}/latest`, {
                    headers: { 'X-Master-Key': App.jsonbin.secretKey }
                });
                const json = await res.json();
                App.data = json.record;
            } catch(e) { console.error('Load failed',e); }
        },
        async save() {
            try {
                await fetch(`${App.jsonbin.apiUrl}${App.jsonbin.binId}`, {
                    method:'PUT',
                    headers:{
                        'Content-Type':'application/json',
                        'X-Master-Key': App.jsonbin.secretKey,
                        'X-Bin-Versioning':'false'
                    },
                    body: JSON.stringify(App.data)
                });
            } catch(e) { console.error('Save failed',e); }
        }
    },

    ui: {
        showMessage(id,msg,type='error',duration=5000){
            const el=document.getElementById(id);
            if(!el) return;
            el.className=`message ${type}`;
            el.textContent=msg;
            el.style.display='block';
            setTimeout(()=>el.style.display='none',duration);
        },
        showLogin(){ document.getElementById('loginScreen').classList.add('active'); document.getElementById('dashboardScreen').classList.remove('active'); },
        showDashboard(){ document.getElementById('loginScreen').classList.remove('active'); document.getElementById('dashboardScreen').classList.add('active'); App.ui.showTab('staffTeam'); App.ui.updateUserDisplay(); App.ui.renderStaff(); },
        showTab(tab){ document.querySelectorAll('.main-content').forEach(t=>t.classList.remove('active')); document.getElementById(tab+'Tab').classList.add('active'); document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active')); document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active'); },
        updateUserDisplay(){ const userNameEl=document.getElementById('currentUserName'); if(App.data.currentUser) userNameEl.textContent=App.data.currentUser.email; },
        renderStaff(){ const grid=document.getElementById('staffGrid'); if(!grid) return; grid.innerHTML=''; App.data.staff.forEach((s,i)=>{ const card=document.createElement('div'); card.className='staff-card'; card.textContent=s.name; card.addEventListener('click',()=>{ document.getElementById('staffInfo').classList.remove('hidden'); document.getElementById('staffInfoName').textContent=s.name; document.getElementById('staffInfoDetails').textContent=s.info || 'Geen info beschikbaar'; }); grid.appendChild(card); }); }
    },

    auth: {
        login(email,password){
            const user=App.data.users.find(u=>u.email===email&&u.password===password);
            if(user){ App.data.currentUser={...user}; App.storage.save(); App.ui.showDashboard(); return true; }
            App.ui.showMessage('loginMessage','Ongeldig email of wachtwoord'); return false;
        },
        logout(){ App.data.currentUser=null; App.storage.save(); App.ui.showLogin(); document.getElementById('userDropdown')?.classList.remove('show'); },
        changePassword(current,newPass,confirm){
            if(!App.data.currentUser) return false;
            if(current!==App.data.currentUser.password){ App.ui.showMessage('passwordMessage','Huidig wachtwoord incorrect'); return false; }
            if(newPass!==confirm){ App.ui.showMessage('passwordMessage','Nieuwe wachtwoorden komen niet overeen'); return false; }
            App.data.currentUser.password=newPass; const idx=App.data.users.findIndex(u=>u.email===App.data.currentUser.email); if(idx!==-1) App.data.users[idx].password=newPass; App.storage.save(); App.ui.showMessage('passwordMessage','Wachtwoord gewijzigd','success'); document.getElementById('passwordForm').reset(); return true;
        }
    },

    init(){
        App.storage.load().then(()=>{
            if(!App.data.isDarkMode) document.body.setAttribute('data-theme','light');
            document.getElementById('loginForm')?.addEventListener('submit',e=>{ e.preventDefault(); App.auth.login(document.getElementById('loginEmail').value.trim(),document.getElementById('loginPassword').value); });
            document.getElementById('passwordForm')?.addEventListener('submit',e=>{ e.preventDefault(); App.auth.changePassword(document.getElementById('currentPasswordInput').value,document.getElementById('newPasswordInput').value,document.getElementById('confirmPasswordInput').value); });
            document.querySelectorAll('.nav-tab').forEach(btn=>btn.addEventListener('click',()=>App.ui.showTab(btn.getAttribute('data-tab'))));
            document.getElementById('userMenuButton')?.addEventListener('click',e=>{ e.stopPropagation(); document.getElementById('userDropdown')?.classList.toggle('show'); });
            document.getElementById('logoutButton')?.addEventListener('click',e=>{ e.preventDefault(); App.auth.logout(); });
            document.getElementById('themeToggle')?.addEventListener('click',()=>{ App.data.isDarkMode=!App.data.isDarkMode; if(App.data.isDarkMode){ document.body.removeAttribute('data-theme'); document.getElementById('themeToggle')?.classList.remove('active'); }else{ document.body.setAttribute('data-theme','light'); document.getElementById('themeToggle')?.classList.add('active'); } App.storage.save(); });
            document.addEventListener('click',()=>document.getElementById('userDropdown')?.classList.remove('show'));
            if(App.data.currentUser) App.ui.showDashboard(); else App.ui.showLogin();
        });
    }
};

document.addEventListener('DOMContentLoaded',()=>App.init());
