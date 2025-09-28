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
        save() {
            try {
                localStorage.setItem('AppData', JSON.stringify(App.data));
            } catch (e) {
                console.error('Opslaan mislukt:', e);
            }
        },
        load() {
            try {
                const storedData = localStorage.getItem('AppData');
                if (storedData) App.data = JSON.parse(storedData);
            } catch (e) {
                console.error('Laden mislukt:', e);
            }
        }
    },
    ui: {
        showMessage(id, msg, type='error', duration=5000) {
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
            if (tab === 'users') App.ui.refreshUserTable();
        },
        updateUserDisplay() {
            const userNameEl = document.getElementById('currentUserName');
            const usersTabBtn = document.getElementById('usersTabBtn');
            if (App.data.currentUser) {
                userNameEl.textContent = App.data.currentUser.email;
                if (App.data.currentUser.role === 'admin') usersTabBtn.classList.remove('hidden');
                else usersTabBtn.classList.add('hidden');
            }
        },
        refreshUserTable() {
            const tbody = document.getElementById('userTableBody');
            const countEl = document.getElementById('userCount');
            if (!tbody || !countEl) return;
            tbody.innerHTML = '';
            countEl.textContent = `${App.data.users.length} gebruiker${App.data.users.length !== 1 ? 's' : ''}`;
            App.data.users.forEach((user, index) => {
                const row = document.createElement('tr');
                const lastActive = new Date(user.lastActive).toLocaleString('nl-NL');
                const isCurrentUser = App.data.currentUser && App.data.currentUser.email === user.email;
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td><span class="role-badge ${user.role}">${user.role === 'admin' ? 'Administrator' : 'Kijker'}</span></td>
                    <td>${lastActive}</td>
                    <td>
                        <div class="user-actions">
                        ${!isCurrentUser ? `<button class="btn btn-danger btn-small delete-user-btn" data-user-index="${index}">Verwijder</button>` : '<em>Huidige gebruiker</em>'}
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            document.querySelectorAll('.delete-user-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const userIndex = parseInt(this.getAttribute('data-user-index'));
                    App.auth.removeUser(userIndex);
                });
            });
        },
        toggleTheme() {
            App.data.isDarkMode = !App.data.isDarkMode;
            const toggle = document.getElementById('themeToggle');
            if (App.data.isDarkMode) {
                document.body.removeAttribute('data-theme');
                toggle.classList.remove('active');
            } else {
                document.body.setAttribute('data-theme', 'light');
                toggle.classList.add('active');
            }
            App.storage.save();
        },
        toggleUserMenu() {
            document.getElementById('userDropdown').classList.toggle('show');
        }
    },
    auth: {
        login(email, password) {
            const user = App.data.users.find(u => u.email === email && u.password === password);
            if (user) {
                user.lastActive = new Date().toISOString();
                App.data.currentUser = {...user};
                App.storage.save();
                App.ui.showDashboard();
                return true;
            } else {
                App.ui.showMessage('loginMessage','Ongeldig email adres of wachtwoord');
                return false;
            }
        },
        logout() {
            App.data.currentUser = null;
            App.storage.save();
            App.ui.showLogin();
            document.getElementById('userDropdown').classList.remove('show');
        },
        addUser(email, password, role) {
            if (!email || !password || !role) {
                App.ui.showMessage('addUserMessage','Alle velden zijn verplicht');
                return false;
            }
            if (App.data.users.find(u => u.email === email)) {
                App.ui.showMessage('addUserMessage','Gebruiker met dit email bestaat al');
                return false;
            }
            if (password.length < 3) {
                App.ui.showMessage('addUserMessage','Wachtwoord moet minimaal 3 karakters lang zijn');
                return false;
            }
            App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
            App.storage.save();
            App.ui.refreshUserTable();
            App.ui.showMessage('addUserMessage',`Gebruiker ${email} succesvol toegevoegd`,'success');
            document.getElementById('addUserForm').reset();
            return true;
        },
        removeUser(index) {
            if (index < 0 || index >= App.data.users.length) return;
            const user = App.data.users[index];
            App.data.users.splice(index,1);
            App.storage.save();
            App.ui.refreshUserTable();
            App.ui.showMessage('addUserMessage',`Gebruiker ${user.email} verwijderd`,'success');
        },
        changePassword(currentPassword, newPassword, confirmPassword) {
            if (!App.data.currentUser) return false;
            if (currentPassword !== App.data.currentUser.password) {
                App.ui.showMessage('passwordMessage','Huidig wachtwoord is incorrect');
                return false;
            }
            if (newPassword !== confirmPassword) {
                App.ui.showMessage('passwordMessage','Nieuwe wachtwoorden komen niet overeen');
                return false;
            }
            if (newPassword.length < 3) {
                App.ui.showMessage('passwordMessage','Wachtwoord moet minimaal 3 karakters lang zijn');
                return false;
            }
            App.data.currentUser.password = newPassword;
            const userIndex = App.data.users.findIndex(u => u.email === App.data.currentUser.email);
            if (userIndex !== -1) App.data.users[userIndex].password = newPassword;
            App.storage.save();
            App.ui.showMessage('passwordMessage','Wachtwoord succesvol gewijzigd','success');
            document.getElementById('passwordForm').reset();
            return true;
        }
    },
    init() {
        App.storage.load();

        if (!App.data.isDarkMode) {
            document.body.setAttribute('data-theme', 'light');
            document.getElementById('themeToggle')?.classList.add('active');
        }

        document.getElementById('loginForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            App.auth.login(email,password);
        });

        document.getElementById('addUserForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('addUserEmail').value.trim();
            const password = document.getElementById('addUserPassword').value;
            const role = document.getElementById('addUserRole').value;
            App.auth.addUser(email,password,role);
        });

        document.getElementById('passwordForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const current = document.getElementById('currentPasswordInput').value;
            const newPass = document.getElementById('newPasswordInput').value;
            const confirm = document.getElementById('confirmPasswordInput').value;
            App.auth.changePassword(current,newPass,confirm);
        });

        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', function() {
                App.ui.showTab(this.getAttribute('data-tab'));
            });
        });

        document.getElementById('userMenuButton')?.addEventListener('click', e => {
            e.stopPropagation();
            App.ui.toggleUserMenu();
        });

        document.getElementById('logoutButton')?.addEventListener('click', e => {
            e.preventDefault();
            App.auth.logout();
        });

        document.getElementById('themeToggle')?.addEventListener('click', () => {
            App.ui.toggleTheme();
        });

        document.addEventListener('click', () => {
            document.getElementById('userDropdown')?.classList.remove('show');
        });

        if (App.data.currentUser) App.ui.showDashboard();
        else App.ui.showLogin();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
