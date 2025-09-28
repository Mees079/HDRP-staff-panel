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
    save() { localStorage.setItem('AppData', JSON.stringify(App.data)); },
    load() {
      const d = localStorage.getItem('AppData');
      if (d) App.data = JSON.parse(d);
    }
  },
  ui: {
    showMessage(id, msg, type='error', time=4000) {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = `message ${type}`;
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => el.style.display = 'none', time);
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
    },
    showTab(tab) {
      document.querySelectorAll('.main-content').forEach(e => e.classList.remove('active'));
      document.getElementById(tab+'Tab').classList.add('active');
      document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('active'));
      const btn = document.querySelector(`[data-tab="${tab}"]`);
      if (btn) btn.classList.add('active');
      if (tab === 'users') App.ui.refreshUserTable();
    },
    updateUserDisplay() {
      const nameEl = document.getElementById('currentUserName');
      const usersBtn = document.getElementById('usersTabBtn');
      if (App.data.currentUser) {
        nameEl.textContent = App.data.currentUser.email;
        if (App.data.currentUser.role === 'admin') usersBtn.classList.remove('hidden');
        else usersBtn.classList.add('hidden');
      }
    },
    refreshUserTable() {
      const tbody = document.getElementById('userTableBody');
      tbody.innerHTML = '';
      document.getElementById('userCount').textContent =
        `${App.data.users.length} gebruiker${App.data.users.length !== 1 ? 's' : ''}`;
      App.data.users.forEach((u,i) => {
        const tr = document.createElement('tr');
        const last = new Date(u.lastActive).toLocaleString('nl-NL');
        const isMe = App.data.currentUser && App.data.currentUser.email === u.email;
        tr.innerHTML = `
          <td>${u.email}</td>
          <td><span class="role-badge ${u.role}">${u.role}</span></td>
          <td>${last}</td>
          <td>${isMe ? '<em>Huidige gebruiker</em>' :
            `<button class="btn btn-danger btn-small" data-i="${i}">Verwijder</button>`}</td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('button').forEach(b =>
        b.addEventListener('click', () => App.auth.removeUser(+b.dataset.i))
      );
    },
    toggleTheme() {
      App.data.isDarkMode = !App.data.isDarkMode;
      if (App.data.isDarkMode) document.body.removeAttribute('data-theme');
      else document.body.setAttribute('data-theme','light');
      App.storage.save();
    }
  },
  auth: {
    login(email, pass) {
      const u = App.data.users.find(x => x.email===email && x.password===pass);
      if (!u) return App.ui.showMessage('loginMessage','Ongeldig email of wachtwoord');
      u.lastActive = new Date().toISOString();
      App.data.currentUser = {...u};
      App.storage.save();
      App.ui.showDashboard();
    },
    logout() {
      App.data.currentUser = null;
      App.storage.save();
      App.ui.showLogin();
    },
    addUser(email, pass, role) {
      if (!email || !pass) return App.ui.showMessage('addUserMessage','Alle velden zijn verplicht');
      if (App.data.users.find(u=>u.email===email))
        return App.ui.showMessage('addUserMessage','Gebruiker bestaat al');
      App.data.users.push({ email, password: pass, role, lastActive: new Date().toISOString() });
      App.storage.save();
      App.ui.refreshUserTable();
      App.ui.showMessage('addUserMessage','Gebruiker toegevoegd','success');
    },
    removeUser(i) {
      App.data.users.splice(i,1);
      App.storage.save();
      App.ui.refreshUserTable();
      App.ui.showMessage('addUserMessage','Gebruiker verwijderd','success');
    },
    changePassword(cur,newp,conf) {
      if (cur!==App.data.currentUser.password)
        return App.ui.showMessage('passwordMessage','Huidig wachtwoord is incorrect');
      if (newp!==conf)
        return App.ui.showMessage('passwordMessage','Nieuwe wachtwoorden komen niet overeen');
      App.data.currentUser.password = newp;
      const idx = App.data.users.findIndex(u=>u.email===App.data.currentUser.email);
      if (idx>-1) App.data.users[idx].password = newp;
      App.storage.save();
      App.ui.showMessage('passwordMessage','Wachtwoord gewijzigd','success');
    }
  },
  init() {
    App.storage.load();
    if (!App.data.isDarkMode) document.body.setAttribute('data-theme','light');

    document.getElementById('loginForm').addEventListener('submit',e=>{
      e.preventDefault();
      App.auth.login(
        document.getElementById('loginEmail').value.trim(),
        document.getElementById('loginPassword').value
      );
    });

    document.querySelectorAll('.nav-tab').forEach(btn=>
      btn.addEventListener('click',()=>App.ui.showTab(btn.dataset.tab))
    );

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

    document.getElementById('logoutButton').addEventListener('click',App.auth.logout);
    document.getElementById('themeToggle').addEventListener('click',App.ui.toggleTheme);

    document.getElementById('userMenuButton').addEventListener('click',e=>{
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click',()=>document.getElementById('userDropdown').classList.remove('show'));

    if (App.data.currentUser) App.ui.showDashboard();
    else App.ui.showLogin();
  }
};

document.addEventListener('DOMContentLoaded', App.init);
