const App = {
    data: {
        users: [
            { email: 'admin', password: 'admin', role: 'admin', lastActive: new Date().toISOString() },
            { email: 'demo', password: 'demo', role: 'viewer', lastActive: new Date().toISOString() }
        ],
        currentUser: null,
        isDarkMode: true
    },
    storage: {
        save() { localStorage.setItem('AppData', JSON.stringify(App.data)); },
        load() { const d = localStorage.getItem('AppData'); if(d) App.data = JSON.parse(d); }
    },
    ui: {
        showMessage(id,msg,type='error'){ const el = document.getElementById(id); el.className = `message ${type}`; el.textContent = msg; el.style.display='block'; setTimeout(()=>el.style.display='none',5000); },
        showLogin(){ document.getElementById('loginScreen').classList.add('active'); document.getElementById('dashboardScreen').classList.remove('active'); document.getElementById('loginForm').reset(); },
        showDashboard(){ document.getElementById('loginScreen').classList.remove('active'); document.getElementById('dashboardScreen').classList.add('active'); App.ui.updateUserDisplay(); App.ui.showTab('dashboard'); },
        showTab(tab){ document.querySelectorAll('.main-content').forEach(t=>t.classList.remove('active')); const tEl = document.getElementById(tab+'Tab'); if(tEl) tEl.classList.add('active'); document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active')); const b = document.querySelector(`[data-tab="${tab}"]`); if(b) b.classList.add('active'); if(tab==='users') App.ui.refreshUserTable(); if(tab==='staffManage') App.ui.refreshStaffTable(); },
        updateUserDisplay(){ const el = document.getElementById('currentUserName'); el.textContent = App.data.currentUser?.email || ''; if(App.data.currentUser.role==='admin'){ document.getElementById('usersTabBtn').classList.remove('hidden'); document.getElementById('staffTabBtn').classList.remove('hidden'); } else { document.getElementById('usersTabBtn').classList.add('hidden'); document.getElementById('staffTabBtn').classList.add('hidden'); } },
        refreshUserTable(){ const tbody = document.getElementById('userTableBody'); const countEl = document.getElementById('userCount'); tbody.innerHTML=''; countEl.textContent=`${App.data.users.length} gebruiker${App.data.users.length!==1?'s':''}`; App.data.users.forEach((user,index)=>{ const row = document.createElement('tr'); const isCurrent = App.data.currentUser?.email===user.email; row.innerHTML=`<td>${user.email}</td><td><span class="role-badge ${user.role}">${user.role==='admin'?'Administrator':'Kijker'}</span></td><td>${new Date(user.lastActive).toLocaleString()}</td><td>${!isCurrent?`<button class="btn btn-danger btn-small" data-index="${index}">Verwijder</button>`:'<em>Huidige gebruiker</em>'}</td>`; tbody.appendChild(row); }); tbody.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const i=parseInt(b.dataset.index); App.auth.removeUser(i); App.ui.refreshUserTable(); })); },
        refreshStaffTable(){ const tbody = document.getElementById('staffTableBody'); const countEl = document.getElementById('staffCount'); tbody.innerHTML=''; const staffUsers = App.data.users.filter(u=>u.role==='admin'); countEl.textContent=`${staffUsers.length} stafflid${staffUsers.length!==1?'den':''}`; staffUsers.forEach((user,index)=>{ const row = document.createElement('tr'); const isCurrent = App.data.currentUser?.email===user.email; row.innerHTML=`<td>${user.email}</td><td><span class="role-badge admin">Administrator</span></td><td>${new Date(user.lastActive).toLocaleString()}</td><td>${!isCurrent?`<button class="btn btn-danger btn-small" data-index="${index}">Verwijder</button>`:'<em>Huidige gebruiker</em>'}</td>`; tbody.appendChild(row); }); tbody.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const i=parseInt(b.dataset.index); App.auth.removeUser(i); App.ui.refreshStaffTable(); })); },
        toggleTheme(){ App.data.isDarkMode=!App.data.isDarkMode; const t=document.getElementById('themeToggle'); if(App.data.isDarkMode){ document.body.removeAttribute('data-theme'); t.classList.remove('active'); } else { document.body.setAttribute('data-theme','light'); t.classList.add('active'); } App.storage.save(); },
        toggleUserMenu(){ document.getElementById('userDropdown').classList.toggle('show'); }
    },
    auth: {
        login(email,password){ const u = App.data.users.find(u=>u.email===email && u.password===password); if(u){ u.lastActive=new Date().toISOString(); App.data.currentUser={...u}; App.storage.save(); App.ui.showDashboard(); return true; } else { App.ui.showMessage('loginMessage','Ongeldig email of wachtwoord'); return false; } },
        logout(){ App.data.currentUser=null; App.storage.save(); App.ui.showLogin(); document.getElementById('userDropdown')?.classList.remove('show'); },
        addUser(email,password,role){ if(!email||!password||!role){ App.ui.showMessage('addUserMessage','Vul alle velden in'); return false; } if(App.data.users.find(u=>u.email===email)){ App.ui.showMessage('addUserMessage','Gebruiker bestaat al'); return false; } App.data.users.push({ email,password,role,lastActive:new Date().toISOString() }); App.storage.save(); App.ui.showMessage('addUserMessage',`Gebruiker ${email} toegevoegd`,'success'); App.ui.refreshUserTable(); App.ui.refreshStaffTable(); return true; },
        removeUser(index){ if(index>=0 && index<App.data.users.length){ App.data.users.splice(index,1); App.storage.save(); } }
    },
    init(){
        App.storage.load();
        if(App.data.currentUser){ App.ui.showDashboard(); } else { App.ui.showLogin(); }
        document.getElementById('loginForm').addEventListener('submit',e=>{ e.preventDefault(); const email=document.getElementById('loginEmail').value.trim(); const password=document.getElementById('loginPassword').value; App.auth.login(email,password); });
        document.getElementById('logoutButton').addEventListener('click',e=>{ e.preventDefault(); App.auth.logout(); });
        document.querySelectorAll('.nav-tab').forEach(tab=>tab.addEventListener('click',()=>{ App.ui.showTab(tab.dataset.tab); }));
        document.getElementById('addUserForm')?.addEventListener('submit',e=>{ e.preventDefault(); const email=document.getElementById('addUserEmail').value.trim(); const password=document.getElementById('addUserPassword').value; const role=document.getElementById('addUserRole').value; App.auth.addUser(email,password,role); e.target.reset(); });
        document.getElementById('addStaffForm')?.addEventListener('submit',e=>{ e.preventDefault(); const email=document.getElementById('addStaffEmail').value.trim(); const password=document.getElementById('addStaffPassword').value; const role=document.getElementById('addStaffRole').value; App.auth.addUser(email,password,role); e.target.reset(); App.ui.refreshStaffTable(); });
        document.getElementById('themeToggle')?.addEventListener('click',()=>App.ui.toggleTheme());
        document.getElementById('userMenuButton')?.addEventListener('click',()=>App.ui.toggleUserMenu());
    }
};

document.addEventListener('DOMContentLoaded',()=>{ App.init(); });
