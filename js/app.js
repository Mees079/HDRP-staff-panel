// Security Dashboard Script
let users = [];
let currentUser = null;

function saveData() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", currentUser ? JSON.stringify(currentUser) : null);
}

function loadData() {
  const storedUsers = localStorage.getItem("users");
  const storedCurrentUser = localStorage.getItem("currentUser");
  if(storedUsers) users = JSON.parse(storedUsers);
  if(storedCurrentUser) currentUser = JSON.parse(storedCurrentUser);
}

document.addEventListener("DOMContentLoaded", function() {
  loadData();
  if(users.length===0){
    users.push({email:"mees", password:"mees", role:"admin", lastActive:new Date().toISOString()});
    users.push({email:"demo", password:"demo", role:"viewer", lastActive:new Date().toISOString()});
    saveData();
  }

  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginMessage = document.getElementById("loginMessage");
  const loginScreen = document.getElementById("loginScreen");
  const dashboardScreen = document.getElementById("dashboardScreen");
  const logoutButton = document.getElementById("logoutButton");
  const currentUserName = document.getElementById("currentUserName");
  const usersTabBtn = document.getElementById("usersTabBtn");
  const userTableBody = document.getElementById("userTableBody");
  const userCount = document.getElementById("userCount");
  const addUserForm = document.getElementById("addUserForm");
  const themeToggle = document.getElementById("themeToggle");
  const passwordForm = document.getElementById("passwordForm");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const passwordMessage = document.getElementById("passwordMessage");

  function showMessage(el, msg, type="error") {
    el.textContent = msg;
    el.className="message "+type;
    el.style.display="block";
    setTimeout(()=>el.style.display="none",5000);
  }

  function showTab(tabName){
    document.querySelectorAll(".main-content").forEach(t=>t.classList.remove("active"));
    document.getElementById(tabName+"Tab").classList.add("active");
    document.querySelectorAll(".nav-tab").forEach(b=>b.classList.remove("active"));
    document.querySelector(`.nav-tab[data-tab="${tabName}"]`)?.classList.add("active");
    if(tabName==="users") refreshUserTable();
  }

  function refreshUserTable(){
    userTableBody.innerHTML="";
    users.forEach(u=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${u.email}</td>
      <td><span class="role-badge ${u.role}">${u.role}</span></td>
      <td>${new Date(u.lastActive).toLocaleString()}</td>
      <td>${currentUser.email!==u.email ? `<button class="btn btn-small btn-danger" onclick="deleteUser('${u.email}')">Verwijder</button>` : "<em>Huidige gebruiker</em>"}</td>`;
      userTableBody.appendChild(tr);
    });
    userCount.textContent=`${users.length} gebruikers`;
    saveData();
  }

  function login(email,password){
    const user = users.find(u=>u.email===email && u.password===password);
    if(user){
      currentUser=user;
      loginScreen.classList.remove("active");
      dashboardScreen.classList.add("active");
      currentUserName.textContent=currentUser.email;
      if(currentUser.role==="admin") usersTabBtn.classList.remove("hidden");
      showTab("dashboard");
      currentUser.lastActive = new Date().toISOString();
      saveData();
    } else {
      showMessage(loginMessage,"Ongeldig e-mail of wachtwoord","error");
    }
  }

  function logout(){
    currentUser=null;
    loginScreen.classList.add("active");
    dashboardScreen.classList.remove("active");
    loginForm.reset();
    saveData();
  }

  function addUser(email,password,role){
    if(!email||!password||!role){ showMessage(document.getElementById("addUserMessage"),"Alle velden zijn verplicht"); return; }
    if(users.find(u=>u.email===email)){ showMessage(document.getElementById("addUserMessage"),"Gebruiker bestaat al"); return; }
    users.push({email,password,role,lastActive:new Date().toISOString()});
    addUserForm.reset();
    refreshUserTable();
    showMessage(document.getElementById("addUserMessage"),"Gebruiker toegevoegd","success");
  }

  window.deleteUser = function(email){
    if(confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")){
      const idx = users.findIndex(u=>u.email===email);
      if(idx!==-1) users.splice(idx,1);
      refreshUserTable();
    }
  }

  function changePassword(current,newP,confirmP){
    if(currentUser.password!==current){ showMessage(passwordMessage,"Huidig wachtwoord fout"); return; }
    if(newP!==confirmP){ showMessage(passwordMessage,"Wachtwoorden komen niet overeen"); return; }
    currentUser.password=newP;
    refreshUserTable();
    showMessage(passwordMessage,"Wachtwoord succesvol gewijzigd","success");
    passwordForm.reset();
    saveData();
  }

  loginForm.addEventListener("submit", e=>{e.preventDefault(); login(loginEmail.value,loginPassword.value);});
  logoutButton.addEventListener("click", e=>{e.preventDefault(); logout();});
  document.querySelectorAll(".nav-tab").forEach(btn=>btn.addEventListener("click",()=>showTab(btn.getAttribute("data-tab"))));
  addUserForm.addEventListener("submit", e=>{ e.preventDefault(); addUser(document.getElementById("addUserEmail").value, document.getElementById("addUserPassword").value, document.getElementById("addUserRole").value); });
  themeToggle.addEventListener("click", ()=>document.body.classList.toggle("light-theme"));
  passwordForm.addEventListener("submit", e=>{ e.preventDefault(); changePassword(currentPasswordInput.value,newPasswordInput.value,confirmPasswordInput.value); });

  if(currentUser){ // auto-login
    loginScreen.classList.remove("active");
    dashboardScreen.classList.add("active");
    currentUserName.textContent=currentUser.email;
    if(currentUser.role==="admin") usersTabBtn.classList.remove("hidden");
    showTab("dashboard");
  }
  refreshUserTable();
});
