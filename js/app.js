const App = {
    data: {
        staff: [
            { email:'mees', password:'mees', role:'admin', lastActive:new Date().toISOString() },
            { email:'demo', password:'demo', role:'viewer', lastActive:new Date().toISOString() }
        ],
        currentUser:null,
        isDarkMode:true
    },
    storage:{
        save(){ try{ localStorage.setItem('StaffPanelData',JSON.stringify(App.data)); } catch(e){ console.error('Opslaan mislukt:',e); } },
        load(){ try{ const s = localStorage.getItem('StaffPanelData'); if(s) App.data = JSON.parse(s); } catch(e){ console.error('Laden mislukt:',e); } }
    },
    ui:{
        showMessage(id,msg,type='error',duration=5000){
            const el = document.getElementById(id); if(!el) return;
            el.className=`message ${type}`; el.textContent=msg; el.style.display='block';
            setTimeout(()=>el.style.display='none',duration);
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
            const target=document.getElementById(tab+'Tab'); if(target) target.classList.add('active');
            document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
            const btn=document.querySelector(`[data-tab="${tab}"]`); if(btn) btn.classList.add('active');
            if(tab==='staff') App.ui.refreshStaffTable();
        },
        updateUserDisplay(){
            const el=document.getElementById('currentUserName');
            const staffBtn=document.getElementById('staffTabBtn');
            if(App.data.currentUser){
                el.textContent=App.data.currentUser.email;
                if(App.data.currentUser.role==='admin') staffBtn.classList.remove('hidden');
                else staffBtn.classList.add('hidden');
            }
        },
        refreshStaffTable(){
            const tbody=document.getElementById('staffTableBody');
            const countEl=document.getElementById('staffCount');
            if(!tbody || !countEl) return;
            tbody.innerHTML='';
            countEl.textContent=`${App.data.staff.length} staffleden`;
            App.data.staff.forEach((user,index)=>{
                const lastActive=new Date(user.lastActive).toLocaleString('nl-NL');
                const isCurrent=App.data.currentUser && App.data.currentUser.email===user.email;
                const row=document.createElement('tr');
                row.innerHTML=`<td>${user.email}</td><td><span class="role-badge ${user.role}">${user.role==='admin'?'Administrator':'Kijker'}</span></td><td>${lastActive}</td><td><div class="user-actions">${!isCurrent?`<button class="btn btn-danger btn-small delete-user-btn" data-user-index="${index}">Verwijder</button>`:'<em>Huidige gebruiker</em>'}</div></td>`;
                tbody.appendChild(row);
            });
            document.querySelectorAll('.delete-user-btn').forEach(btn=>btn.addEventListener('click',function(){
                const idx=parseInt(this.getAttribute('data-user-index'));
                App.auth.removeStaff(idx);
            }));
        },
        toggleTheme(){
            App.data.isDarkMode=!App.data.isDarkMode;
            const toggle=document.getElementById('themeToggle');
            if(App.data.isDarkMode){ document.body.removeAttribute('data-theme'); toggle.classList.remove('active'); }
            else{ document.body.setAttribute('data-theme','light'); toggle.classList.add('active'); }
            App.storage.save();
        },
        toggleUserMenu(){ document.getElementById('userDropdown').classList.toggle('show'); }
    },
    auth:{
        login(email,password){
            const user=App.data.staff.find(u=>u.email===email && u.password===password);
            if(user){ App.data.currentUser=user; user.lastActive=new Date().toISOString(); App.storage.save(); App.ui.showDashboard(); }
            else App.ui.showMessage('loginMessage','Email of wachtwoord ongeldig','error');
        },
        logout(){ App.data.currentUser=null; App.storage.save(); App.ui.showLogin(); },
        addStaff(email,role,password){
            if(!App.data.currentUser || App.data.currentUser.role!=='admin'){ App.ui.showMessage('addStaffMessage','Alleen admin kan staff toevoegen','error'); return; }
            if(App.data.staff.find(u=>u.email===email)){ App.ui.showMessage('addStaffMessage','Deze gebruiker bestaat al','error'); return; }
            App.data.staff.push({email,password,role,lastActive:new Date().toISOString()}); App.storage.save();
            App.ui.showMessage('addStaffMessage','Stafflid toegevoegd','success'); document.getElementById('addStaffForm').reset();
            App.ui.refreshStaffTable();
        },
        removeStaff(index){
            if(!App.data.currentUser || App.data.currentUser.role!=='admin'){ App.ui.showMessage('addStaffMessage','Alleen admin kan staff verwijderen','error'); return; }
            App.data.staff.splice(index,1); App.storage.save(); App.ui.refreshStaffTable();
        },
        changePassword(current,newP,confirm){
            if(!App.data.currentUser){ App.ui.showMessage('passwordMessage','Niet ingelogd','error'); return; }
            if(App.data.currentUser.password!==current){ App.ui.showMessage('passwordMessage','Huidig wachtwoord incorrect','error'); return; }
            if(newP!==confirm){ App.ui.showMessage('passwordMessage','Wachtwoorden komen niet overeen','error'); return; }
            App.data.currentUser.password=newP; App.storage.save(); App.ui.showMessage('passwordMessage','Wachtwoord gewijzigd','success'); document.getElementById('passwordForm').reset();
        }
    },
    init(){
        App.storage.load();
        if(App.data.currentUser) App.ui.showDashboard();
        else App.ui.showLogin();

        document.getElementById('loginForm').addEventListener('submit',e=>{ e.preventDefault(); App.auth.login(document.getElementById('loginEmail').value,document.getElementById('loginPassword').value); });
        document.getElementById('logoutButton').addEventListener('click',e=>{ e.preventDefault(); App.auth.logout(); });
        document.getElementById('addStaffForm').addEventListener('submit',e=>{ e.preventDefault(); App.auth.addStaff(document.getElementById('addStaffEmail').value,document.getElementById('addStaffRole').value,document.getElementById('addStaffPassword').value); });
        document.getElementById('passwordForm').addEventListener('submit',e=>{ e.preventDefault(); App.auth.changePassword(document.getElementById('currentPasswordInput').value,document.getElementById('newPasswordInput').value,document.getElementById('confirmPasswordInput').value); });
        document.querySelectorAll('.nav-tab').forEach(btn=>btn.addEventListener('click',()=>App.ui.showTab(btn.dataset.tab)));
        document.getElementById('themeToggle').addEventListener('click',()=>App.ui.toggleTheme());
        document.getElementById('userMenuButton').addEventListener('click',()=>App.ui.toggleUserMenu());
        document.addEventListener('click',e=>{ if(!e.target.closest('.user-menu')) document.getElementById('userDropdown').classList.remove('show'); });
    }
};

document.addEventListener('DOMContentLoaded',()=>App.init());
