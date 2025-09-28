const App = {
    data: {
        users: [],
        currentUser: null,
        isDarkMode: true
    },
    config: {
        JSONBIN_ID: '68d9759343b1c97be9534096',
        JSONBIN_KEY: '$2a$10$DTiU3hcuglHpTy/sU3hUKuHWnX7exTTkb6/eahL2zr9cyIwo9feTK'
    },
    storage: {
        saveLocal() {
            localStorage.setItem('AppData', JSON.stringify(App.data));
        },
        loadLocal() {
            const storedData = localStorage.getItem('AppData');
            if (storedData) App.data = JSON.parse(storedData);
        }
    },
    remote: {
        async loadFromJSONBin() {
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${App.config.JSONBIN_ID}/latest`, {
                    headers: { 'X-Master-Key': App.config.JSONBIN_KEY }
                });
                const json = await res.json();
                if (json.record) App.data = json.record;
            } catch (e) { console.error(e); }
        },
        async saveToJSONBin() {
            try {
                await fetch(`https://api.jsonbin.io/v3/b/${App.config.JSONBIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': App.config.JSONBIN_KEY
                    },
                    body: JSON.stringify(App.data)
                });
            } catch (e) { console.error(e); }
        }
    },
    ui: {
        showMessage(id,msg,type='error',dur=5000){
            const el=document.getElementById(id);
            el.className=`message ${type}`;
            el.textContent=msg;
            el.style.display='block';
            setTimeout(()=>el.style.display='none',dur);
        },
        showLogin(){
            document.getElementById('loginScreen').classList.add('active');
            document.getElementById('dashboardScreen').classList.remove('active');
            document.getElementById('loginForm').reset();
        },
        showDashboard(){
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('dashboardScreen').classList.add('active');
            App.ui.updateUserDisplay();
            App.ui.showTab('dashboard');
        },
        showTab(tab){
            document.querySelectorAll('.main-content').forEach(t=>t.classList.remove('active'));
            const target=document.getElementById(tab+'Tab');
            if(target) target.classList.add('active');
            document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
            const btn=document.querySelector(`[data-tab="${tab}"]`);
            if(btn) btn.classList.add('active');
            if(tab==='users') App.ui.refreshUserTable();
        },
        updateUserDisplay(){
            const userNameEl=document.getElementById('currentUserName');
            const usersTabBtn=document.getElementById('usersTabBtn');
            if(App.data.currentUser){
                userNameEl.textContent=App.data.currentUser.email;
                if(["eigenaar","staffco"].includes(App.data.currentUser.role)) usersTabBtn.classList.remove('hidden');
                else usersTabBtn.classList.add('hidden');
                document.getElementById('ownerOption').disabled = App.data.currentUser.role !== 'eigenaar';
            }
        },
        refreshUserTable(){
            const tbody=document.getElementById('userTableBody');
            const countEl=document.getElementById('userCount');
            if(!tbody||!countEl) return;
            tbody.innerHTML='';
            countEl.textContent=`${App.data.users.length} gebruiker${App.data.users.length!==1?'s':''}`;
            App.data.users.forEach((user,index)=>{
                const row=document.createElement('tr');
                const lastActive=new Date(user.lastActive).toLocaleString('nl-NL');
                const isCurrent=App.data.currentUser && App.data.currentUser.email===user.email;
                row.innerHTML=`
                    <td>${user.email}</td>
                    <td><span class="role-badge ${user.role}">${user.role==='eigenaar'?'Eigenaar':user.role==='staffco'?'Staff Coördinatie':'Staff'}</span></td>
                    <td>${lastActive}</td>
                    <td>
                        <div class="user-actions">
                        ${!isCurrent && App.data.currentUser.role==='eigenaar'?`<button class="btn btn-danger btn-small delete-user-btn" data-user-index="${index}">Verwijder</button>`:isCurrent?'<em>Huidige gebruiker</em>':''}
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            document.querySelectorAll('.delete-user-btn').forEach(b=>{
                b.addEventListener('click',function(){
                    const i=parseInt(this.getAttribute('data-user-index'));
                    App.auth.removeUser(i);
                });
            });
        },
        toggleTheme(){
            App.data.isDarkMode=!App.data.isDarkMode;
            const toggle=document.getElementById('themeToggle');
            if(App.data.isDarkMode){document.body.removeAttribute('data-theme');toggle.classList.remove('active');}
            else{document.body.setAttribute('data-theme','light');toggle.classList.add('active');}
            App.storage.saveLocal(); App.remote.saveToJSONBin();
        },
        toggleUserMenu(){document.getElementById('userDropdown').classList.toggle('show');}
    },
    auth:{
        login(email,password){
            const user=App.data.users.find(u=>u.email===email && u.password===password);
            if(user){
                user.lastActive=new Date().toISOString();
                App.data.currentUser={...user};
                App.storage.saveLocal(); App.remote.saveToJSONBin(); App.ui.showDashboard();
                return true;
            } else { App.ui.showMessage('loginMessage','Ongeldig email of wachtwoord'); return false;}
        },
        logout(){
            App.data.currentUser=null; App.storage.saveLocal(); App.remote.saveToJSONBin(); App.ui.showLogin();
            document.getElementById('userDropdown').classList.remove('show');
        },
        addUser(email,password,role){
            if(!email||!password||!role){App.ui.showMessage('addUserMessage','Alle velden zijn verplicht'); return false;}
            if(App.data.users.find(u=>u.email===email)){App.ui.showMessage('addUserMessage','Gebruiker bestaat al'); return false;}
            if(password.length<3){App.ui.showMessage('addUserMessage','Wachtwoord minimaal 3 karakters'); return false;}
            App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
            App.storage.saveLocal(); App.remote.saveToJSONBin(); App.ui.refreshUserTable();
            App.ui.showMessage('addUserMessage',`Gebruiker ${email} toegevoegd`,'success');
            document.getElementById('addUserForm').reset(); return true;
        },
        removeUser(i){
            if(i<0||i>=App.data.users.length) return;
            const user=App.data.users[i];
            App.data.users.splice(i,1);
            App.storage.saveLocal(); App.remote.saveToJSONBin(); App.ui.refreshUserTable();
            App.ui.showMessage('addUserMessage',`Gebruiker ${user.email} verwijderd`,'success');
        },
        changePassword(curr,newP,confirmP){
            if(!App.data.currentUser) return false;
            if(curr!==App.data.currentUser.password){App.ui.showMessage('passwordMessage','Huidig wachtwoord is incorrect'); return false;}
            if(newP!==confirmP){App.ui.showMessage('passwordMessage','Nieuwe wachtwoorden komen niet overeen'); return false;}
            if(newP.length<3){App.ui.showMessage('passwordMessage','Wachtwoord minimaal 3 karakters'); return false;}
            App.data.currentUser.password=newP;
            const idx=App.data.users.findIndex(u=>u.email===App.data.currentUser.email);
            if(idx!==-1) App.data.users[idx].password=newP;
            App.storage.saveLocal(); App.remote.saveToJSONBin();
            App.ui.showMessage('passwordMessage','Wachtwoord gewijzigd','success');
            document.getElementById('passwordForm').reset(); return true;
        }
    },
    init(){
        App.storage.loadLocal();

        // Voeg standaard eigenaar toe als nog niet aanwezig
        if(!App.data.users.find(u=>u.email==='meespost24@gmail.com')){
            App.data.users.push({
                email:'meespost24@gmail.com',
                password:'HDRP_02025',
                role:'eigenaar',
                lastActive:new Date().toISOString()
            });
            App.storage.saveLocal(); App.remote.saveToJSONBin();
        }

        if(!App.data.isDarkMode){document.body.setAttribute('data-theme','light');document.getElementById('themeToggle')?.classList.add('active');}

        // Event listeners
        document.getElementById('loginForm')?.addEventListener('submit',e=>{
            e.preventDefault();
            App.auth.login(document.getElementById('loginEmail').value,document.getElementById('loginPassword').value);
        });
        document.getElementById('logoutButton')?.addEventListener('click',e=>{e.preventDefault(); App.auth.logout();});
        document.querySelectorAll('.nav-tab').forEach(btn=>{
            btn.addEventListener('click',()=>App.ui.showTab(btn.getAttribute('data-tab')));
        });
        document.getElementById('addUserForm')?.addEventListener('submit',e=>{
            e.preventDefault();
            if(App.data.currentUser?.role!=='eigenaar'){App.ui.showMessage('addUserMessage','Alleen eigenaar kan accounts aanmaken'); return;}
            App.auth.addUser(
                document.getElementById('addUserEmail').value,
                document.getElementById('addUserPassword').value,
                document.getElementById('addUserRole').value
            );
        });
        document.getElementById('passwordForm')?.addEventListener('submit',e=>{
            e.preventDefault();
            App.auth.changePassword(
                document.getElementById('currentPasswordInput').value,
                document.getElementById('newPasswordInput').value,
                document.getElementById('confirmPasswordInput').value
            );
        });
        document.getElementById('themeToggle')?.addEventListener('click',()=>App.ui.toggleTheme());
        document.getElementById('userMenuButton')?.addEventListener('click',()=>App.ui.toggleUserMenu());

        if(App.data.currentUser) App.ui.showDashboard();
        else App.ui.showLogin();
    }
};

window.addEventListener('DOMContentLoaded',()=>App.init());
