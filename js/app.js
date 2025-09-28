const App = {
    data: {
        users: [], // wordt geladen vanaf JSONBin
        currentUser: null,
        isDarkMode: true
    },
    jsonbin: {
        binId: "68d9759343b1c97be9534096",      // vervang door jouw JSONBin bin ID
        apiKey: "$2a$10$DTiU3hcuglHpTy/sU3hUKuHWnX7exTTkb6/eahL2zr9cyIwo9feTK", // vervang door jouw JSONBin secret key
        async load() {
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
                    headers: { "X-Master-Key": this.apiKey }
                });
                const data = await res.json();
                if (data.record) {
                    App.data.users = data.record.users || [];
                    App.data.currentUser = data.record.currentUser || null;
                    App.data.isDarkMode = data.record.isDarkMode ?? true;
                }
            } catch (e) { console.error("Kan JSONBin niet laden:", e); }
        },
        async save() {
            try {
                await fetch(`https://api.jsonbin.io/v3/b/${this.binId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Master-Key": this.apiKey,
                        "X-Bin-Versioning": "false"
                    },
                    body: JSON.stringify(App.data)
                });
            } catch (e) { console.error("Kan JSONBin niet opslaan:", e); }
        }
    },
    ui: {
        showMessage(id, msg, type = 'error', duration = 5000) {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = `message ${type}`;
            el.textContent = msg;
            el.style.display = 'block';
            setTimeout(() => el.style.display = 'none', duration);
        },
        showLogin() {
            document.getElementById('loginScreen').classList.add('active');
            document.getElementById('dashboardScreen').classList.remove('active');
            document.getElementById('loginForm').reset();
        },
        showDashboard() {
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('dashboardScreen').classList.add('active');
            App.ui.updateUserDisplay();
            App.ui.showTab('dashboard');
        },
        showTab(tab) {
            document.querySelectorAll('.main-content').forEach(t => t.classList.remove('active'));
            const target = document.getElementById(tab+'Tab');
            if (target) target.classList.add('active');
            document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
            const btn = document.querySelector(`[data-tab="${tab}"]`);
            if (btn) btn.classList.add('active');

            if(tab === 'staff') App.ui.refreshStaffTable();
            if(tab === 'users') App.ui.refreshUserTable();
        },
        updateUserDisplay() {
            const userNameEl = document.getElementById('currentUserName');
            const staffTabBtn = document.getElementById('staffTabBtn');
            if(App.data.currentUser){
                userNameEl.textContent = App.data.currentUser.email;
                if(App.data.currentUser.role === 'admin') staffTabBtn.classList.remove('hidden');
                else staffTabBtn.classList.add('hidden');
            }
        },
        refreshUserTable() {
            const tbody = document.getElementById('userTableBody');
            const countEl = document.getElementById('userCount');
            if(!tbody || !countEl) return;
            tbody.innerHTML = '';
            countEl.textContent = `${App.data.users.length} gebruiker${App.data.users.length !== 1 ? 's' : ''}`;
            App.data.users.forEach((user, index)=>{
                const row = document.createElement('tr');
                const lastActive = new Date(user.lastActive).toLocaleString('nl-NL');
                const isCurrent = App.data.currentUser?.email === user.email;
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td><span class="role-badge ${user.role}">${user.role==='admin'?'Administrator':'Kijker'}</span></td>
                    <td>${lastActive}</td>
                    <td>
                        <div class="user-actions">
                            ${!isCurrent?`<button class="btn btn-danger btn-small delete-user-btn" data-user-index="${index}">Verwijder</button>`:'<em>Huidige gebruiker</em>'}
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            document.querySelectorAll('.delete-user-btn').forEach(btn=>{
                btn.addEventListener('click', function(){
                    const idx = parseInt(this.getAttribute('data-user-index'));
                    App.auth.removeUser(idx);
                });
            });
        },
        refreshStaffTable() {
            // zelfde layout als user table, maar noem header "Staff beheren"
            const tbody = document.getElementById('staffTableBody');
            const countEl = document.getElementById('staffCount');
            if(!tbody || !countEl) return;
            tbody.innerHTML = '';
            countEl.textContent = `${App.data.users.length} stafflid${App.data.users.length!==1?'s':''}`;
            App.data.users.forEach((user,index)=>{
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td><span class="role-badge ${user.role}">${user.role==='admin'?'Administrator':'Kijker'}</span></td>
                    <td>${new Date(user.lastActive).toLocaleString('nl-NL')}</td>
                `;
                tbody.appendChild(row);
            });
        },
        toggleTheme(){
            App.data.isDarkMode = !App.data.isDarkMode;
            const toggle = document.getElementById('themeToggle');
            if(App.data.isDarkMode){
                document.body.removeAttribute('data-theme');
                toggle.classList.remove('active');
            }else{
                document.body.setAttribute('data-theme','light');
                toggle.classList.add('active');
            }
            App.jsonbin.save();
        },
        toggleUserMenu(){
            document.getElementById('userDropdown').classList.toggle('show');
        }
    },
    auth: {
        login(email,password){
            const user = App.data.users.find(u=>u.email===email && u.password===password);
            if(user){
                user.lastActive = new Date().toISOString();
                App.data.currentUser = {...user};
                App.jsonbin.save();
                App.ui.showDashboard();
                return true;
            } else{
                App.ui.showMessage('loginMessage','Ongeldig email adres of wachtwoord');
                return false;
            }
        },
        logout(){
            App.data.currentUser = null;
            App.jsonbin.save();
            App.ui.showLogin();
            document.getElementById('userDropdown')?.classList.remove('show');
        },
        addUser(email,password,role){
            if(!email || !password || !role){
                App.ui.showMessage('addUserMessage','Alle velden zijn verplicht');
                return false;
            }
            if(App.data.users.find(u=>u.email===email)){
                App.ui.showMessage('addUserMessage','Gebruiker bestaat al');
                return false;
            }
            App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
            App.jsonbin.save();
            App.ui.refreshUserTable();
            App.ui.showMessage('addUserMessage',`Gebruiker ${email} toegevoegd`,'success');
            document.getElementById('addUserForm').reset();
            return true;
        },
        removeUser(index){
            if(index<0 || index>=App.data.users.length) return;
            const user = App.data.users.splice(index,1)[0];
            App.jsonbin.save();
            App.ui.refreshUserTable();
            App.ui.showMessage('addUserMessage',`Gebruiker ${user.email} verwijderd`,'success');
        },
        changePassword(current,newPass,confirm){
            if(!App.data.currentUser) return false;
            if(current!==App.data.currentUser.password){
                App.ui.showMessage('passwordMessage','Huidig wachtwoord is incorrect');
                return false;
            }
            if(newPass!==confirm){
                App.ui.showMessage('passwordMessage','Nieuwe wachtwoorden komen niet overeen');
                return false;
            }
            if(newPass.length<3){
                App.ui.showMessage('passwordMessage','Wachtwoord moet minimaal 3 karakters zijn');
                return false;
            }
            App.data.currentUser.password = newPass;
            const idx = App.data.users.findIndex(u=>u.email===App.data.currentUser.email);
            if(idx!==-1) App.data.users[idx].password = newPass;
            App.jsonbin.save();
            App.ui.showMessage('passwordMessage','Wachtwoord gewijzigd','success');
            document.getElementById('passwordForm').reset();
            return true;
        }
    },
    init: async function(){
        await this.jsonbin.load();

        if(!this.data.isDarkMode){
            document.body.setAttribute('data-theme','light');
            document.getElementById('themeToggle')?.classList.add('active');
        }

        document.getElementById('loginForm')?.addEventListener('submit', e=>{
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            App.auth.login(email,password);
        });

        document.getElementById('addUserForm')?.addEventListener('submit', e=>{
            e.preventDefault();
            const email = document.getElementById('addUserEmail').value.trim();
            const password = document.getElementById('addUserPassword').value;
            const role = document.getElementById('addUserRole').value;
            App.auth.addUser(email,password,role);
        });

        document.getElementById('passwordForm')?.addEventListener('submit', e=>{
            e.preventDefault();
            const current = document.getElementById('currentPasswordInput').value;
            const newPass = document.getElementById('newPasswordInput').value;
            const confirm = document.getElementById('confirmPasswordInput').value;
            App.auth.changePassword(current,newPass,confirm);
        });

        document.querySelectorAll('.nav-tab').forEach(btn=>{
            btn.addEventListener('click', function(){
                App.ui.showTab(this.getAttribute('data-tab'));
            });
        });

        document.getElementById('userMenuButton')?.addEventListener('click', e=>{
            e.stopPropagation();
            App.ui.toggleUserMenu();
        });

        document.getElementById('logoutButton')?.addEventListener('click', e=>{
            e.preventDefault();
            App.auth.logout();
        });

        document.getElementById('themeToggle')?.addEventListener('click', ()=>{
            App.ui.toggleTheme();
        });

        document.addEventListener('click', ()=>{
            document.getElementById('userDropdown')?.classList.remove('show');
        });

        if(this.data.currentUser) this.ui.showDashboard();
        else this.ui.showLogin();
    }
};

document.addEventListener('DOMContentLoaded',()=>App.init());
