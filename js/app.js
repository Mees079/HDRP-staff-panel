const App = {
    data: {
        users: [],
        currentUser: null,
        isDarkMode: true
    },
    storage: {
        save() { localStorage.setItem('AppData', JSON.stringify(App.data)); },
        load() {
            const s = localStorage.getItem('AppData');
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
            const label = document.getElementById('userCountLabel');
            tbody.innerHTML = '';
            App.data.users.forEach((u,i)=>{
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.email}</td>
                    <td>${u.role}</td>
                    <td>${new Date(u.lastActive).toLocaleString('nl-NL')}</td>
                    <td>${App.data.currentUser?.email===u.email
                        ? '<em>Huidige gebruiker</em>'
                        : `<button class="btn btn-small btn-danger" data-i="${i}">Verwijder</button>`}</td>`;
                tbody.appendChild(tr);
            });
            count.textContent = App.data.users.length;
            label.textContent = `${App.data.users.length} gebruiker${App.data.users.length!==1?'s':''}`;
            tbody.querySelectorAll('button').forEach(b=>{
                b.addEventListener('click',()=>App.auth.removeUser(parseInt(b.dataset.i)));
            });
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
            App.ui.refreshUsers();
        },
        logout(){
            App.data.currentUser = null;
            App.storage.save();
            App.ui.showScreen(true);
        },
        addUser(email,pw,role){
            if(App.data.users.find(u=>u.email===email))
                return App.ui.showMessage('addUserMessage','Gebruiker bestaat al');
            App.data.users.push({email,password:pw,role,lastActive:new Date().toISOString()});
            App.storage.save();
            App.ui.refreshUsers();
            App.ui.showMessage('addUserMessage','Gebruiker toegevoegd','success');
        },
        removeUser(i){
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
        if(App.data.currentUser) App.ui.showScreen(false);
        else App.ui.showScreen(true);

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
