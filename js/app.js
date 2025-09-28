// ========================
// script.js
// ========================

// Data opslaan en laden
function saveData() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", currentUser ? JSON.stringify(currentUser) : null);
}

function loadData() {
  const storedUsers = localStorage.getItem("users");
  const storedUser = localStorage.getItem("currentUser");

  if(storedUsers) {
    const parsedUsers = JSON.parse(storedUsers);
    users.length = 0; // clear default array
    parsedUsers.forEach(u => users.push(u));
  }

  if(storedUser) currentUser = JSON.parse(storedUser);
}

document.addEventListener("DOMContentLoaded", function() {

  // ========================
  // Initial Data
  // ========================
  const users = [
    { email: "mees", password: "mees", role: "admin", lastActive: new Date().toISOString() },
    { email: "demo", password: "demo", role: "viewer", lastActive: new Date().toISOString() }
  ];
  let currentUser = null;

  // Load saved data
  loadData();

  // ========================
  // DOM Elements
  // ========================
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

  // ========================
  // Helper Functions
  // ========================
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

  // ========================
  // Auth Functions
  // ========================
  function login(email,password) {
    const user=users.find(u=>u.email===email && u.password===password);
    if(user){
      currentUser=user;
      currentUser.lastActive = new Date().toISOString();
      saveData();
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
    saveData();
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
    saveData();
    showMessage(document.getElementById("addUserMessage"),"Gebruiker toegevoegd","success");
    addUserForm.reset();
    refreshUserTable();
  }

  window.deleteUser=function(email){
    if(confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")){
      const idx=users.findIndex(u=>u.email===email);
      if(idx!==-1) users.splice(idx,1);
      saveData();
      refreshUserTable();
    }
  }

  function changePassword(currentPass,newPass){
    if(currentPass!==currentUser.password){
      showMessage(document.getElementById("passwordMessage"),"Huidig wachtwoord is incorrect");
      return;
    }
    if(newPass.length<3){
      showMessage(document.getElementById("passwordMessage"),"Wachtwoord moet minimaal 3 karakters zijn");
      return;
    }
    currentUser.password = newPass;
    const idx = users.findIndex(u=>u.email===currentUser.email);
    if(idx!==-1) users[idx].password=newPass;
    saveData();
    showMessage(document.getElementById("passwordMessage"),"Wachtwoord gewijzigd","success");
    document.getElementById("passwordForm").reset();
  }

  // ========================
  // Event Listeners
  // ========================
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

  document.getElementById("passwordForm")?.addEventListener("submit", function(e){
    e.preventDefault();
    changePassword(document.getElementById("currentPasswordInput").value,
                   document.getElementById("newPasswordInput").value);
  });

  themeToggle.addEventListener("click", function(){
    document.body.classList.toggle("light-theme");
  });

  // ========================
  // Check if already logged in
  // ========================
  if(currentUser){
    loginScreen.classList.remove("active");
    dashboardScreen.classList.add("active");
    currentUserName.textContent=currentUser.email;
    if(currentUser.role==="admin") usersTabBtn.classList.remove("hidden");
    showTab("dashboard");
  }

});
