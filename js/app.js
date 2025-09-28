// =====================
// APP STATE
// =====================
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
      console.log('Data opgeslagen:', JSON.stringify(App.data, null, 2));
    },
    load() {
      console.log('Data geladen');
    }
  },

  // =====================
  // UI METHODS
  // =====================
  ui: {
    showMessage(elId, msg, type='error', duration=5000){
      const el = document.getElementById(elId);
      if(!el) return;
      el.className = `message ${type}`;
      el.textContent = msg;
      el.style.display='block';
      setTimeout(()=> el.style.display='none', duration);
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
      document.querySelectorAll('.nav-tab').forEach(btn=>btn.classList.remove('active'));
      const activeBtn=document.querySelector(`[data-tab="${tab}"]`);
      if(activeBtn) activeBtn.classList.add('active');
      if(tab==='users') App.ui.refreshUserTable();
    },

    updateUserDisplay(){
      const uname=document.getElementById('currentUserName');
      const ubtn=document.getElementById('usersTabBtn');
      if(App.data.currentUser){
        uname.textContent=App.data.currentUser.email;
        if(App.data.currentUser.role==='admin') ubtn.classList.remove('hidden');
        else ubtn.classList.add('hidden');
      }
    },

    refreshUserTable(){
      const tbody=document.getElementById('userTableBody');
      tbody.innerHTML='';
      App.data.users.forEach(u=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`
          <td>${u.email}</td>
          <td><span class="role-badge ${u.role}">${u.role}</span></td>
          <td>${new Date(u.lastActive).toLocaleString()}</td>
          <td class="user-actions">
            <button class="btn btn-small btn-danger" onclick="App.actions.deleteUser('${u.email}')">🗑️ Verwijderen</button>
          </td>`;
        tbody.appendChild(tr);
      });
      document.getElementById('userCount').textContent=`${App.data.users.length} gebruikers`;
    }
  },

  // =====================
  // ACTIONS
  // =====================
  actions: {
    login(email,password){
      const user=App.data.users.find(u=>u.email===email && u.password===password);
      if(user){
        App.data.currentUser=user;
        App.ui.showDashboard();
      } else {
        App.ui.showMessage('loginMessage','Ongeldig email of wachtwoord','error');
      }
    },

    logout(){
      App.data.currentUser=null;
      App.ui.showLogin();
    },

    addUser(email,password,role){
      if(App.data.users.find(u=>u.email===email)){
        App.ui.showMessage('addUserMessage','Gebruiker bestaat al','error');
        return;
      }
      App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
      App.ui.showMessage('addUserMessage','Gebruiker toegevoegd','success');
      App.ui.refreshUserTable();
    },

    deleteUser(email){
      if(!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;
      App.data.users=App.data.users.filter(u=>u.email!==email);
      App.ui.refreshUserTable();
    }
  },

  // =====================
  // INIT
  // =====================
  init(){
    App.storage.load();

    // Login
    document.getElementById('loginForm').addEventListener('submit', e=>{
      e.preventDefault();
      const email=document.getElementById('loginEmail').value.trim();
      const pass=document.getElementById('loginPassword').value.trim();
      App.actions.login(email,pass);
    });

    // Logout
    document.getElementById('logoutButton').addEventListener('click', e=>{
      e.preventDefault();
      App.actions.logout();
    });

    // Add User
    document.getElementById('addUserForm').addEventListener('submit', e=>{
      e.preventDefault();
      const email=document.getElementById('addUserEmail').value.trim();
      const pass=document.getElementById('addUserPassword').value.trim();
      const role=document.getElementById('addUserRole').value;
      App.actions.addUser(email,pass,role);
      e.target.reset();
    });

    // Tabs
    document.querySelectorAll('.nav-tab').forEach(btn=>{
      btn.addEventListener('click',()=>App.ui.showTab(btn.dataset.tab));
    });

    // User menu
    const userBtn=document.getElementById('userMenuButton');
    const dropdown=document.getElementById('userDropdown');
    userBtn.addEventListener('click', ()=> dropdown.classList.toggle('show'));
    window.addEventListener('click', e=>{
      if(!userBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('show');
    });

    // Theme toggle
    const themeToggle=document.getElementById('themeToggle');
    themeToggle.addEventListener('click', ()=>{
      App.data.isDarkMode=!App.data.isDarkMode;
      document.documentElement.setAttribute('data-theme',App.data.isDarkMode?'dark':'light');
      themeToggle.classList.toggle('active',App.data.isDarkMode);
    });

    App.ui.showLogin();
  }
};

document.addEventListener('DOMContentLoaded', App.init);
