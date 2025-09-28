const App = {
  data: {
    users: [],
    currentUser: null,
    isDarkMode: true
  },
  storage: {
    async load() {
      // JSONBin ophalen
      try {
        const res = await fetch('https://api.jsonbin.io/v3/b/YOUR_BIN_ID/latest', {
          headers: { 'X-Master-Key': 'YOUR_SECRET_KEY' }
        });
        const json = await res.json();
        if(json.record) App.data = json.record;
      } catch(e){ console.error('Data load failed', e); }
    },
    async save() {
      try {
        await fetch('https://api.jsonbin.io/v3/b/68d9759343b1c97be9534096', {
          method: 'PUT',
          headers: {
            'Content-Type':'application/json',
            'X-Master-Key':'$2a$10$DTiU3hcuglHpTy/sU3hUKuHWnX7exTTkb6/eahL2zr9cyIwo9feTK',
            'X-Bin-Versioning':'false'
          },
          body: JSON.stringify(App.data)
        });
      } catch(e){ console.error('Data save failed', e); }
    }
  },
  ui: {
    showMessage(id, msg, type='error', duration=5000){
      const el = document.getElementById(id);
      if(!el) return;
      el.className=`message ${type}`;
      el.textContent=msg;
      el.style.display='block';
      setTimeout(()=>el.style.display='none', duration);
    },
    showTab(tab){
      document.querySelectorAll('.main-content').forEach(t=>t.classList.remove('active'));
      const target = document.getElementById(tab+'Tab');
      if(target) target.classList.add('active');
      document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
      const btn = document.querySelector(`[data-tab="${tab}"]`);
      if(btn) btn.classList.add('active');
      if(tab==='staff') App.ui.renderStaff();
    },
    updateUserDisplay(){
      const userNameEl=document.getElementById('currentUserName');
      const staffBtn=document.getElementById('staffTabBtn');
      if(App.data.currentUser){
        userNameEl.textContent=App.data.currentUser.email;
        staffBtn.style.display=App.data.currentUser.role==='admin'?'inline-block':'none';
      }
    },
    renderStaff(){
      const tbody=document.getElementById('staffTableBody');
      const countEl=document.getElementById('staffCount');
      if(!tbody||!countEl) return;
      tbody.innerHTML='';
      countEl.textContent=`${App.data.users.length} staff`;
      App.data.users.forEach((user,index)=>{
        const row=document.createElement('tr');
        const lastActive = new Date(user.lastActive).toLocaleString('nl-NL');
        const isCurrent = App.data.currentUser.email===user.email;
        row.innerHTML=`
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${lastActive}</td>
          <td>
            ${!isCurrent?`<button class="btn btn-danger btn-small" data-index="${index}">Verwijder</button>`:'<em>Huidige gebruiker</em>'}
          </td>
        `;
        tbody.appendChild(row);
      });
      tbody.querySelectorAll('.btn-danger').forEach(btn=>{
        btn.onclick=()=>App.auth.removeStaff(parseInt(btn.dataset.index));
      });
    },
    toggleTheme(){
      App.data.isDarkMode=!App.data.isDarkMode;
      if(App.data.isDarkMode) document.body.removeAttribute('data-theme');
      else document.body.setAttribute('data-theme','light');
      document.getElementById('themeToggle')?.classList.toggle('active', !App.data.isDarkMode);
      App.storage.save();
    },
    toggleUserMenu(){
      document.getElementById('userDropdown').classList.toggle('show');
    }
  },
  auth:{
    login(email,password){
      const user=App.data.users.find(u=>u.email===email && u.password===password);
      if(user){
        user.lastActive=new Date().toISOString();
        App.data.currentUser={...user};
        App.storage.save();
        App.ui.showTab('dashboard');
        return true;
      } else {
        App.ui.showMessage('loginMessage','Ongeldig email of wachtwoord');
        return false;
      }
    },
    logout(){
      App.data.currentUser=null;
      App.storage.save();
      document.getElementById('loginScreen').classList.add('active');
      document.getElementById('dashboardScreen').classList.remove('active');
      document.getElementById('userDropdown')?.classList.remove('show');
    },
    addStaff(email,password,role){
      if(!email||!password||!role){ App.ui.showMessage('addStaffMessage','Alle velden verplicht'); return false; }
      if(App.data.users.find(u=>u.email===email)){ App.ui.showMessage('addStaffMessage','Email bestaat al'); return false; }
      App.data.users.push({email,password,role,lastActive:new Date().toISOString()});
      App.storage.save();
      App.ui.renderStaff();
      App.ui.showMessage('addStaffMessage',`Staff ${email} toegevoegd`,'success');
      document.getElementById('addStaffForm').reset();
      return true;
    },
    removeStaff(index){
      if(index<0 || index>=App.data.users.length) return;
      const u = App.data.users[index];
      App.data.users.splice(index,1);
      App.storage.save();
      App.ui.renderStaff();
      App.ui.showMessage('addStaffMessage',`Staff ${u.email} verwijderd`,'success');
    }
  },
  async init(){
    await App.storage.load();
    if(!App.data.isDarkMode){
      document.body.setAttribute('data-theme','light');
      document.getElementById('themeToggle')?.classList.add('active');
    }
    document.getElementById('loginForm')?.addEventListener('submit', e=>{
      e.preventDefault();
      App.auth.login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    });
    document.getElementById('addStaffForm')?.addEventListener('submit', e=>{
      e.preventDefault();
      App.auth.addStaff(
        document.getElementById('addStaffEmail').value,
        document.getElementById('addStaffPassword').value,
        document.getElementById('addStaffRole').value
      );
    });
    document.querySelectorAll('.nav-tab').forEach(btn=>{
      btn.addEventListener('click',()=>App.ui.showTab(btn.dataset.tab));
    });
    document.getElementById('userMenuButton')?.addEventListener('click', e=>{
      e.stopPropagation(); App.ui.toggleUserMenu();
    });
    document.getElementById('logoutButton')?.addEventListener('click', e=>{
      e.preventDefault(); App.auth.logout();
    });
    document.getElementById('themeToggle')?.addEventListener('click',()=>App.ui.toggleTheme());
    document.addEventListener('click',()=>document.getElementById('userDropdown')?.classList.remove('show'));
    if(App.data.currentUser){
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('dashboardScreen').classList.add('active');
      App.ui.updateUserDisplay();
      App.ui.showTab('dashboard');
    } else {
      document.getElementById('loginScreen').classList.add('active');
    }
  }
};

document.addEventListener('DOMContentLoaded',()=>App.init());
