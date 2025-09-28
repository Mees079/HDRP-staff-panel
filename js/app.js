const App = {
    data: {
        users: [
            { email: 'mees', password: 'mees', role: 'admin', lastActive: new Date().toISOString() },
            { email: 'demo', password: 'demo', role: 'viewer', lastActive: new Date().toISOString() }
        ],
        currentUser: null,
        isDarkMode: true
    },
    storage: {
        binId: '68d9759343b1c97be9534096',
        secretKey: '$2a$10$.VfV1dtToI6avt7SnG5wrOOcedq9PeSWWwN4Iq8m7mcWZMCB5ZSFS',
        async save() {
            try {
                await fetch(`https://api.jsonbin.io/v3/b/${this.binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': this.secretKey
                    },
                    body: JSON.stringify(App.data)
                });
            } catch(e) { console.error('Opslaan mislukt:', e); }
        },
        async load() {
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
                    headers: { 'X-Master-Key': this.secretKey }
                });
                const json = await res.json();
                if(json && json.record) App.data = json.record;
            } catch(e) { console.error('Laden mislukt:', e); }
        }
    },
    ui: {
        showMessage(id,msg,type='error',dur=5000) {
            const el = document.getElementById(id);
            if(!el) return;
            el.className=`message ${type}`; el.textContent=msg; el.style.display='block';
            setTimeout(()=>el.style.display='none',dur);
        },
        showLogin() {
            document.getElementById('loginScreen').classList.add('active');
            document.getElementById('dashboardScreen').classList.remove('active');
        },
        showDashboard() {
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('dashboardScreen').classList.add('active');
            App.ui.updateUserDisplay();
            App.ui.showTab('dashboard');
            App.ui.renderStaff();
        },
        showTab(tab) {
            document.querySelectorAll('.main-content').forEach(t=>t.classList.remove('active'));
            document.getElementById(tab+'Tab')?.classList.add('active');
            document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
            document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
        },
        updateUserDisplay() {
            const el = document.getElementById('currentUserName');
            el.textContent = App.data.currentUser?.email||'gebruiker';
            const staffBtn = document.getElementById('staffTabBtn');
            staffBtn.style.display = App.data.currentUser?.role==='admin'?'inline-block':'none';
        },
        renderStaff() {
            const container = document.getElementById('staffList');
            if(!container) return;
            container.innerHTML='';
            App.data.users.filter(u=>u.role==='admin').forEach(u=>{
                const btn=document.createElement('button');
                btn.textContent=u.email;
                btn.className='btn btn-primary btn-full';
                btn.onclick=()=>alert(`Info over ${u.email} komt hier`); // placeholder
                container.appendChild(btn);
            });
        }
    },
    auth: {
        login(email,password) {
            const user = App.data.users.find(u=>u.email===email && u.password===password);
            if(user){
                user.lastActive=new Date().toISOString();
                App.data.currentUser={...user};
                App.storage.save();
                App.ui.showDashboard();
                return true;
            }else{
                App.ui.showMessage('loginMessage','Ongeldig email/wachtwoord');
                return false;
            }
        },
        logout() {
            App.data.currentUser=null;
            App.storage.save();
            App.ui.showLogin();
        },
        addUser(email,password,role){
            if(!email||!password||!role){
                App.ui.showMessage('addUserMessage','Alle velden verplicht'); return false;
            }
            if(App.data.users.find(u=>u.email===email)){
                App.ui.showMessage('addUserMessage','Gebruiker bestaat al'); return false;
            }
            App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
            App.storage.save();
            App.ui.showMessage('addUserMessage',`${email} toegevoegd`,'success');
            document.getElementById('addUserForm')?.reset();
            return true;
        }
    },
    async init(){
        await App.storage.load();

        if(!App.data.isDarkMode){
            document.body.setAttribute('data-theme','light');
            document.getElementById('themeToggle')?.classList.add('active');
        }

        document.getElementById('loginForm')?.addEventListener('submit',e=>{
            e.preventDefault();
            const email=document.getElementById('loginEmail').value.trim();
            const pass=document.getElementById('loginPassword').value;
            App.auth.login(email,pass);
        });

        document.getElementById('addUserForm')?.addEventListener('submit',e=>{
            e.preventDefault();
            const email=document.getElementById('addUserEmail').value.trim();
            const pass=document.getElementById('addUserPassword').value;
            const role=document.getElementById('addUserRole').value;
            App.auth.addUser(email,pass,role);
        });

        document.querySelectorAll('.nav-tab').forEach(btn=>{
            btn.addEventListener('click',()=>App.ui.showTab(btn.getAttribute('data-tab')));
        });

        document.getElementById('userMenuButton')?.addEventListener('click',e=>{
            e.stopPropagation(); 
            document.getElementById('userDropdown')?.classList.toggle('show');
        });

        document.getElementById('logoutButton')?.addEventListener('click',e=>{
            e.preventDefault(); App.auth.logout();
        });

        document.getElementById('themeToggle')?.addEventListener('click',()=>{
            App.data.isDarkMode=!App.data.isDarkMode;
            if(App.data.isDarkMode){
                document.body.removeAttribute('data-theme');
                document.getElementById('themeToggle')?.classList.remove('active');
            }else{
                document.body.setAttribute('data-theme','light');
                document.getElementById('themeToggle')?.classList.add('active');
            }
            App.storage.save();
        });

        document.addEventListener('click',()=>{
            document.getElementById('userDropdown')?.classList.remove('show');
        });

        if(App.data.currentUser) App.ui.showDashboard();
        else App.ui.showLogin();
    }
};

document.addEventListener('DOMContentLoaded',()=>App.init());
