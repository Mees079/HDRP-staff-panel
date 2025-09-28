document.addEventListener("DOMContentLoaded", function() {
  // ======================
  // DATA & STORAGE
  // ======================
  let users = [
    { email: "mees", password: "mees", role: "admin", lastActive: new Date().toISOString() },
    { email: "demo", password: "demo", role: "viewer", lastActive: new Date().toISOString() }
  ];
  let currentUser = null;

  function saveData() {
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", currentUser ? JSON.stringify(currentUser) : null);
  }

  function loadData() {
    const storedUsers = localStorage.getItem("users");
    const storedUser = localStorage.getItem("currentUser");

    if(storedUsers) {
      users = JSON.parse(storedUsers);
    }

    if(storedUser) currentUser = JSON.parse(storedUser);
  }

  loadData(); // laad data bij start

  // ======================
  // ELEMENTS
  // ======================
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginMessage = document.getElementById("loginMessage");

  const dashboardScreen = document.getElementById("dashboardScreen");
  const loginScreen = document.getElementById("loginScreen");
  const logoutButton = document.getElementById("logoutButton");
  const currentUserName = document.getElementById("currentUserName");
  const usersTabBtn = document.getElementById("usersTabBtn");
  const userTableBody = document.getElementById("userTableBody");
  const userCount = document.getElementById("userCount");
  const addUserForm = document.getElementById("addUserForm");
  const themeToggle = document.getElementById("themeToggle");

  // ======================
  // HELPERS
  // ======================
  function showMessage(element, message, type="error") {
    element.textContent = message;
    element.className = "message " + type;
    element.style.display = "block";
    setTimeout(()=>{element.style.display="none"}, 5000);
  }

  function showTab(tabName) {
    document.querySelectorAll(".main-content").forEach(t=>t.classList.remove("active"));
    const tab = document.getElementById(tabName+"Tab");
    if(tab) tab.classList.add("active");
    document.querySelectorAll(".nav-tab").forEach(btn=>btn.classList.remove("active"));
    const activeBtn = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
    if(activeBtn) activeBtn.classList.add("active");
    if(tabName==="users") refreshUserTable();
  }

  function refreshUserTable() {
    userTableBody.innerHTML="";
    users.forEach(u=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`
        <td>${u.email}</td>
        <td><span class="role-badge ${u.role}">${u.role}</span></td>
        <td>${new Date(u.lastActive).toLocaleString()}</td>
        <td>
          ${currentUser.email!==u.email ? `<button class="btn btn-small btn-danger" onclick="deleteUser('${u.email}')">Verwijder</button>` : '<em>Huidige gebruiker</em>'}
        </td>`;
      userTableBody.appendChild(tr);
    });
    userCount.textContent=`${users.length} gebruikers`;
  }

  // ======================
  // AUTHENTICATION
  // ======================
  function login(email,password) {
    const user=users.find(u=>u.email===email && u.password===password);
    if(user){
      currentUser=user;
      saveData(); // opslaan van sessie
      loginScreen.classList.remove("active");
      dashboardScreen.classList.add("active");
      currentUserName.textContent=currentUser.email;
      if(currentUser.role==="admin") usersTabBtn.classList.remove("hidden");
      showTab("dashboard");
    } else {
      showMessage(loginMessage,"Ongeldig e-mail of wachtwoord","error");
    }
  }

  function logout() {
    currentUser=null;
    saveData(); // update sessie
    loginScreen.classList.add("active");
    dashboardScreen.classList.remove("active");
    loginForm.reset();
  }

  function addUser(email,password,role){
    if(!email || !password || !role){
      showMessage(document.getElementById("addUserMessage"),"Alle velden zijn verplicht");
      return;
    }
    if(users.find(u=>u.email===email)){
      showMessage(document.getElementById("addUserMessage"),"Gebruiker bestaat al");
      return;
    }
    users.push({email,password,role,lastActive:new Date().toISOString()});
    saveData(); // opslaan nieuwe gebruiker
    showMessage(document.getElementById("addUserMessage"),"Gebruiker toegevoegd","success");
    addUserForm.reset();
    refreshUserTable();
  }

  window.deleteUser=function(email){
    if(confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")){
      const idx=users.findIndex(u=>u.email===email);
      if(idx!==-1) {
        users.splice(idx,1);
        saveData(); // opslaan na verwijderen
      }
      refreshUserTable();
    }
  }

  // ======================
  // EVENT LISTENERS
  // ======================
  loginForm.addEventListener("submit", function(e){
    e.preventDefault();
    login(loginEmail.value,loginPassword.value);
  });

  logoutButton.addEventListener("click", function(e){ e.preventDefault(); logout(); });

  document.querySelectorAll(".nav-tab").forEach(btn=>{
    btn.addEventListener("click",()=>showTab(btn.getAttribute("data-tab")));
  });

  addUserForm.addEventListener("submit", function(e){
    e.preventDefault();
    addUser(document.getElementById("addUserEmail").value,
            document.getElementById("addUserPassword").value,
            document.getElementById("addUserRole").value);
  });

  themeToggle.addEventListener("click", function(){
    document.body.classList.toggle("light-theme");
  });

  // ======================
  // AUTO-LOGIN IF SESSION EXISTS
  // ======================
  if(currentUser){
    loginScreen.classList.remove("active");
    dashboardScreen.classList.add("active");
    currentUserName.textContent=currentUser.email;
    if(currentUser.role==="admin") usersTabBtn.classList.remove("hidden");
    showTab("dashboard");
  }
});
