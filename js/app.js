const API_URL = "https://api.jsonbin.io/v3/b/YOUR_BIN_ID"; // JSONBin URL
const API_KEY = "YOUR_SECRET_KEY";

const App = {
    data: { users: [], currentUser: null, isDarkMode:true },
    
    storage: {
        async load() {
            try {
                const res = await fetch(API_URL+"/latest", {
                    headers: { "X-Master-Key": API_KEY }
                });
                const json = await res.json();
                if(json.record) App.data = json.record;
            } catch(e){ console.error("JSONBin load error:", e); }
        },
        async save() {
            try {
                await fetch(API_URL, {
                    method:"PUT",
                    headers:{ "Content-Type":"application/json", "X-Master-Key":API_KEY },
                    body: JSON.stringify(App.data)
                });
            } catch(e){ console.error("JSONBin save error:", e); }
        }
    },

    ui: {
        showMessage(id,msg,type='error',dur=5000){
            const el=document.getElementById(id); if(!el) return;
            el.className=`message ${type}`; el.textContent=msg; el.style.display='block';
            setTimeout(()=>el.style.display='none',dur);
        },
        showScreen(screenId){
            document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
        },
        showTab(tab){
            document.querySelectorAll('.main-content').forEach(c=>c.classList.remove('active'));
            document.getElementById(tab+"Tab")?.classList.add('active');
            document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
            document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

            if(tab==='users') App.ui.refreshUserTable();
            if(tab==='staffManage') App.ui.refreshStaffGrid();
        },
        updateUserDisplay(){
            const el = document.getElementById('currentUserName');
            el.textContent = App.data.currentUser?.email||'gebruiker';
            const staffTabBtn=document.getElementById('staffTabBtn');
            if(App.data.currentUser?.role==='admin') staffTabBtn.classList.remove('hidden');
            else staffTabBtn.classList.add('hidden');
        },
        refreshUserTable(){
            const tbody = document.getElementById('userTableBody');
            tbody.innerHTML='';
            App.data.users.forEach((u,i)=>{
                const row = document.createElement('tr');
                row.innerHTML=`<td>${u.email}</td>
                    <td><span class="role-badge ${u.role}">${u.role==='admin'?'Admin':'Viewer'}</span></td>
                    <td>${new Date(u.lastActive).toLocaleString()}</td>
                    <td>
                    ${App.data.currentUser.email!==u.email?`<button class="btn btn-danger btn-small" data-index="${i}">Verwijder</button>`:'<em>Huidige gebruiker</em>'}</td>`;
                tbody.appendChild(row);
            });
            tbody.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>App.auth.removeUser(parseInt(b.dataset.index))));
        },
        refreshStaffGrid(){
            const grid = document.getElementById('staffManageGrid'); grid.innerHTML='';
            App.data.users.filter(u=>u.role==='admin').forEach((u,i)=>{
                const card=document.createElement('div'); card.className='staff-card';
                card.textContent=u.email;
                card.addEventListener('click',()=>App.ui.showStaffInfo(u));
                grid.appendChild(card);
            });
        },
        showStaffInfo(user){
            document.getElementById('staffManageInfo').classList.remove('hidden');
            document.getElementById('staffManageName').textContent=user.email;
            document.getElementById('staffManageDetails').textContent='Info komt hier later...';
            document.getElementById('removeStaffBtn').onclick=()=>App.auth.removeUser(App.data.users.findIndex(u=>u.email===user.email));
        },
        toggleTheme(){
            App.data.isDarkMode=!App.data.isDarkMode;
            document.body.setAttribute('data-theme', App.data.isDarkMode?'':'light');
            document.getElementById('themeToggle').classList.toggle('active', !App.data.isDarkMode);
            App.storage.save();
        }
    },

    auth:{
        login(email,password){
            const user=App.data.users.find(u=>u.email===email&&u.password===password);
            if(user){ user.lastActive=new Date().toISOString(); App.data.currentUser=user; App.storage.save(); App.ui.showScreen('dashboardScreen'); App.ui.showTab('dashboard'); App.ui.updateUserDisplay(); }
            else App.ui.showMessage('loginMessage','Ongeldig email/wachtwoord');
        },
        logout(){ App.data.currentUser=null; App.storage.save(); App.ui.showScreen('loginScreen'); },
        addUser(email,password,role){
            if(!email||!password||!role){ App.ui.showMessage('addUserMessage','Alle velden verplicht'); return; }
            if(App.data.users.find(u=>u.email===email)){ App.ui.showMessage('addUserMessage','Gebruiker bestaat al'); return; }
            App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
            App.storage.save(); App.ui.refreshUserTable(); App.ui.showMessage('addUserMessage',`Gebruiker ${email} toegevoegd`,'success');
        },
        removeUser(index){
            if(index<0||index>=App.data.users.length) return;
            const user=App.data.users.splice(index,1)[0]; App.storage.save(); App.ui.refreshUserTable(); App.ui.refreshStaffGrid(); App.ui.showMessage('addUserMessage',`Gebruiker ${user.email} verwijderd`,'success');
        }
    },

    init: async function(){
        await App.storage.load();
        if(!App.data.isDarkMode) document.body.setAttribute('data-theme','light');
        App.ui.updateUserDisplay();
        App.ui.showScreen(App.data.currentUser?'dashboardScreen':'loginScreen');

        document.getElementById('loginForm')?.addEventListener('submit',e=>{ e.preventDefault(); App.auth.login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value); });
        document.getElementById('addUserForm')?.addEventListener('submit',e=>{ e.preventDefault(); App.auth.addUser(document.getElementById('addUserEmail').value, document.getElementById('addUserPassword').value, document.getElementById('addUserRole').value); });
        document.querySelectorAll('.nav-tab').forEach(b=>b.addEventListener('click',()=>App.ui.showTab(b.dataset.tab)));
        document.getElementById('userMenuButton')?.addEventListener('click',e=>{ e.stopPropagation(); document.getElementById('userDropdown').classList.toggle('show'); });
        document.getElementById('logoutButton')?.addEventListener('click',e=>{ e.preventDefault(); App.auth.logout(); });
        document.getElementById('themeToggle')?.addEventListener('click',()=>App.ui.toggleTheme());
        document.addEventListener('click',()=>document.getElementById('userDropdown')?.classList.remove('show'));
    }
};

document.addEventListener('DOMContentLoaded',()=>App.init());
