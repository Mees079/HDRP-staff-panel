const App = {
    data: {
        users: [], // wordt geladen van JSONBin
        currentUser: null,
        isDarkMode: true
    },
    jsonbin: {
        binId: "YOUR_BIN_ID", // vervang dit door je JSONBin bin ID
        secretKey: "YOUR_SECRET_KEY", // vervang dit door je JSONBin secret
        async load() {
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${this.binId}/latest`, {
                    headers: { "X-Master-Key": this.secretKey }
                });
                const json = await res.json();
                if (json && json.record) App.data.users = json.record.users || [];
            } catch (e) { console.error("JSONBin laden mislukt:", e); }
        },
        async save() {
            try {
                await fetch(`https://api.jsonbin.io/v3/b/${this.binId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Master-Key": this.secretKey,
                        "X-Bin-Versioning": "false"
                    },
                    body: JSON.stringify({ users: App.data.users })
                });
            } catch (e) { console.error("JSONBin opslaan mislukt:", e); }
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
            if (tab === 'staff') App.ui.refreshStaffTable();
        },
        updateUserDisplay() {
            const userNameEl = document.getElementById('currentUserName');
            const staffTabBtn = document.getElementById('staffTabBtn');
            if (App.data.currentUser) {
                userNameEl.textContent = App.data.currentUser.email;
                if (App.data.currentUser.role === 'admin') staffTabBtn.classList.remove('hidden');
                else staffTabBtn.classList.add('hidden');
            }
        },
        refreshStaffTable() {
            const tbody = document.getElementById('staffTableBody');
            const countEl = document.getElementById('staffCount');
            if (!tbody || !countEl) return;
            tbody.innerHTML = '';
            countEl.textContent = `${App.data.users.length} staff`;
            App.data.users.forEach((user, index) => {
                const row = document.createElement('tr');
                const lastActive = new Date(user.lastActive).toLocaleString('nl-NL');
                const isCurrentUser = App.data.currentUser && App.data.currentUser.email === user.email;
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td>${user.role === 'admin' ? 'Administrator' : 'Kijker'}</td>
                    <td>${lastActive}</td>
                    <td>
                        ${!isCurrentUser ? `<button class="btn btn-danger btn-small delete-staff-btn" data-index="${index}">Verwijder</button>` : '<em>Huidige gebruiker</em>'}
                    </td>
                `;
                tbody.appendChild(row);
            });
            document.querySelectorAll('.delete-staff-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.getAttribute('data-index'));
                    App.auth.removeStaff(idx);
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
            App.jsonbin.save();
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
                App.jsonbin.save();
                App.ui.showDashboard();
                return true;
            } else {
                App.ui.showMessage('loginMessage','Ongeldig email adres of wachtwoord');
                return false;
            }
        },
        logout() {
            App.data.currentUser = null;
            App.ui.showLogin();
        },
        addStaff(email, password, role) {
            if (!email || !password || !role) {
                App.ui.showMessage('addStaffMessage','Alle velden zijn verplicht');
                return false;
            }
            if (App.data.users.find(u => u.email === email)) {
                App.ui.showMessage('addStaffMessage','Staff met dit email bestaat al');
                return false;
            }
            App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
            App.jsonbin.save();
            App.ui.refreshStaffTable();
            App.ui.showMessage('addStaffMessage',`Staff ${email} toegevoegd`,'success');
            document.getElementById('addStaffForm').reset();
            return true;
        },
        removeStaff(index) {
            if (index < 0 || index >= App.data.users.length) return;
            const user = App.data.users[index];
            App.data.users.splice(index,1);
            App.jsonbin.save();
            App.ui.refreshStaffTable();
            App.ui.showMessage('addStaffMessage',`Staff ${user.email} verwijderd`,'success');
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
            App.data.currentUser.password = newPassword;
            const idx = App.data.users.findIndex(u => u.email === App.data.currentUser.email);
            if (idx !== -1) App.data.users[idx].password = newPassword;
            App.jsonbin.save();
            App.ui.showMessage('passwordMessage','Wachtwoord succesvol gewijzigd','success');
            document.getElementById('passwordForm').reset();
            return true;
        }
    },
    init: async function() {
        await App.jsonbin.load();

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

        document.getElementById('addStaffForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('addStaffEmail').value.trim();
            const password = document.getElementById('addStaffPassword').value;
            const role = document.getElementById('addStaffRole').value;
            App.auth.addStaff(email,password,role);
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
