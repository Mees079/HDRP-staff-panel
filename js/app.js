const App = {
    data: {
        users: [],
        currentUser: null
    },
    storage: {
        save() { localStorage.setItem('HDRP_Data', JSON.stringify(App.data)); },
        load() {
            const s = localStorage.getItem('HDRP_Data');
            if (s) App.data = JSON.parse(s);
        }
    },
    ui: {
        showMessage(id, msg, type='error', time=3000) {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = msg;
            el.className = `message ${type}`;
            el.style.display = 'block';
            setTimeout(()=> el.style.display='none', time);
        },
        showScreen(login) {
            document.getElementById('loginScreen').classList.toggle('active', login);
            document.getElementById('dashboardScreen').classList.toggle('active', !login);
        },
        showTab(tab) {
            document.querySelectorAll('.main-content').forEach(c=>c.classList.remove('active'));
            document.getElementById(tab+'Tab').classList.add('active');
            document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
            document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
            if (tab==='users') App.ui.refreshUsers();
        },
        refreshUsers() {
            const tbody = document.getElementById('userTableBody');
            const count = document.getElementById('userCount');
            tbody.innerHTML = '';
            App.data.users.forEach((u,i)=>{
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>${new Date(u.lastActive).toLocaleString('nl-NL')}</td>
                    <td>${App.data.currentUser?.email===u.email
                        ? '<em>Huidige gebruiker</em>'
                        : (App.data.currentUser.role==='eigenaar'
                            ? `<button class="btn btn-small btn-danger" data-i="${i}">Verwijder</button>`
                            : '')}</td>`;
                tbody.appendChild(tr);
            });
            count.textContent = App.data.users.length;
            tbody.querySelectorAll('button').forEach(b=>{
                b.addEventListener('click',()=>App.auth.removeUser(parseInt(b.dataset.i)));
            });
        },
        updateRoleOptions(){
            const sel = document.getElementById('addUserRole');
            if (App.data.currentUser?.role === "eigenaar" &&
                !sel.querySelector('option[value="eigenaar"]')) {
                const opt = document.createElement('option');
                opt.value = 'eigenaar';
                opt.textContent = 'Eigenaar';
                sel.appendChild(opt);
            }
        },
        updateTabs(){
            const btn = document.getElementById('usersTabBtn');
            if (["eigenaar","staffco"].includes(App.data.currentUser?.role)){
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        }
    },
    auth: {
        login(email,pw){
            const u = App.data.users.find(x=>x.email===email && x.password===pw);
            if(!u) return App.ui.showMessage('loginMessage','Ongeldige inlog');
            u.lastActive = new Date().toISOString();
            App.data.currentUser = {...u};
            App.storage.save();
            App.ui.showScreen(false);
            document.getElementById('currentUserName').textContent = u.email;
            App.ui.updateRoleOptions();
            App.ui.updateTabs();
            App.ui.refreshUsers();
        },
        logout(){
            App.data.currentUser = null;
            App.storage.save();
            App.ui.showScreen(true);
        },
        addUser(email,pw,role){
            const u = App.data.currentUser;
            if (u.role !== "eigenaar")
                return App.ui.showMessage('addUserMessage','Alleen de eigenaar kan accounts aanmaken');
            if(App.data.users.find(x=>x.email===email))
                return App.ui.showMessage('addUserMessage','Gebruiker bestaat al');
            if (role === "eigenaar" && u.role !== "eigenaar")
                return App.ui.showMessage('addUserMessage','Alleen de eigenaar kan deze rol geven');
            App.data.users.push({
                email, password: pw, role,
                lastActive: new Date().toISOString()
            });
            App.storage.save();
            App.ui.refreshUsers();
            App.ui.showMessage('addUserMessage','Gebruiker toegevoegd','success');
        },
        removeUser(i){
            const u = App.data.currentUser;
            if (u.role !== "eigenaar")
                return App.ui.showMessage('addUserMessage','Alleen de eigenaar kan verwijderen');
            App.data.users.splice(i,1);
            App.storage.save();
            App.ui.refreshUsers();
            App.ui.showMessage('addUserMessage','Gebruiker verwijderd','success');
        },
        changePassword(current,newPw,confirm){
            if(current!==App.data.currentUser.password)
                return App.ui.showMessage('passwordMessage','Huidig wachtwoord onjuist');
            if(newPw!==confirm)
                return App.ui.showMessage('passwordMessage','Wachtwoorden komen niet overeen');
            const idx = App.data.users.findIndex(u=>u.email===App.data.currentUser.email);
            App.data.users[idx].password = newPw;
            App.data.currentUser.password = newPw;
            App.storage.save();
            App.ui.showMessage('passwordMessage','Wachtwoord gewijzigd','success');
        }
    },
    init(){
        App.storage.load();

        // --- vaste eigenaar initialiseren ---
        if (!App.data.users.find(u=>u.role==="eigenaar")) {
            App.data.users.push({
                email: "meespost24@gmail.com",
                password: "HDRP_02025",
                role: "eigenaar",
                lastActive: new Date().toISOString()
            });
            App.storage.save();
        }

        if(App.data.currentUser) {
            App.ui.showScreen(false);
            document.getElementById('currentUserName').textContent = App.data.currentUser.email;
            App.ui.updateRoleOptions();
            App.ui.updateTabs();
            App.ui.refreshUsers();
        } else {
            App.ui.showScreen(true);
        }

        document.getElementById('loginForm').addEventListener('submit',e=>{
            e.preventDefault();
            App.auth.login(
                document.getElementById('loginEmail').value.trim(),
                document.getElementById('loginPassword').value
            );
        });

        document.getElementById('addUserForm').addEventListener('submit',e=>{
            e.preventDefault();
            App.auth.addUser(
                document.getElementById('addUserEmail').value.trim(),
                document.getElementById('addUserPassword').value,
                document.getElementById('addUserRole').value
            );
            e.target.reset();
        });

        document.getElementById('passwordForm').addEventListener('submit',e=>{
            e.preventDefault();
            App.auth.changePassword(
                document.getElementById('currentPasswordInput').value,
                document.getElementById('newPasswordInput').value,
                document.getElementById('confirmPasswordInput').value
            );
            e.target.reset();
        });

        document.querySelectorAll('.nav-tab').forEach(btn=>{
            btn.addEventListener('click',()=>App.ui.showTab(btn.dataset.tab));
        });

        document.getElementById('logoutButton').addEventListener('click',e=>{
            e.preventDefault(); App.auth.logout();
        });
    }
};
document.addEventListener('DOMContentLoaded',App.init);
