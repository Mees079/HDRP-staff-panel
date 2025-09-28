// ----------------- Data -----------------
let users = [];
let currentUser = null;

// ----------------- Storage -----------------
function saveData() {
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", currentUser ? JSON.stringify(currentUser) : null);
}

function loadData() {
    const storedUsers = localStorage.getItem("users");
    const storedUser = localStorage.getItem("currentUser");
    if(storedUsers) users = JSON.parse(storedUsers);
    if(storedUser) currentUser = JSON.parse(storedUser);
}

// ----------------- UI -----------------
function showMessage(elementId, message, type="error") {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = "message " + type;
    el.style.display = "block";
    setTimeout(()=>{el.style.display="none"}, 5000);
}

function showTab(tabName) {
    document.querySelectorAll(".main-content").forEach(t=>t.classList.remove("active"));
    document.getElementById(tabName+"Tab").classList.add("active");
    document.querySelectorAll(".nav-tab").forEach(b=>b.classList.remove("active"));
    document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add("active");
    if(tabName==="users") refreshUserTable();
}

function refreshUserTable() {
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";
    users.forEach((u,idx)=>{
        const tr = document.createElement("tr");
        tr.innerHTML=`
            <td>${u.email}</td>
            <td><span class="role-badge ${u.role}">${u.role}</span></td>
            <td>${new Date(u.lastActive).toLocaleString()}</td>
            <td>
                ${currentUser.email!==u.email ? `<button class="btn btn-danger btn-small" onclick="deleteUser(${idx})">Verwijder</button>` : '<em>Huidige gebruiker</em>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById("userCount").textContent=`${users.length} gebruikers`;
}

// ----------------- Auth -----------------
function login(email,password) {
    const user = users.find(u=>u.email===email && u.password===password);
    if(user){
        currentUser=user;
        currentUser.lastActive=new Date().toISOString();
        saveData();
        document.getElementById("loginScreen").classList.remove("active");
        document.getElementById("dashboardScreen").classList.add("active");
        document.getElementById("currentUserName").textContent=currentUser.email;
        if(currentUser.role==="admin") document.getElementById("usersTabBtn").classList.remove("hidden");
        showTab("dashboard");
    } else showMessage("loginMessage","Ongeldig email of wachtwoord");
}

function logout() {
    currentUser=null;
    saveData();
    document.getElementById("loginScreen").classList.add("active");
    document.getElementById("dashboardScreen").classList.remove("active");
    document.getElementById("loginForm").reset();
}

function addUser(email,password,role) {
    if(!email || !password || !role){ showMessage("addUserMessage","Alle velden zijn verplicht"); return; }
    if(users.find(u=>u.email===email)){ showMessage("addUserMessage","Gebruiker bestaat al"); return; }
    users.push({email,password,role,lastActive:new Date().toISOString()});
    saveData();
    refreshUserTable();
    showMessage("addUserMessage","Gebruiker toegevoegd","success");
    document.getElementById("addUserForm").reset();
}

window.deleteUser = function(idx){
    if(confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")){
        users.splice(idx,1);
        saveData();
        refreshUserTable();
    }
}

// ----------------- Password Change -----------------
function changePassword(current,newP,confirmP){
    if(currentUser.password!==current){ showMessage("passwordMessage","Huidig wachtwoord incorrect"); return; }
    if(newP!==confirmP){ showMessage("passwordMessage","Wachtwoorden komen niet overeen"); return; }
    currentUser.password=newP;
    saveData();
    showMessage("passwordMessage","Wachtwoord gewijzigd","success");
    document.getElementById("passwordForm").reset();
}

// ----------------- Theme -----------------
function toggleTheme(){
    document.body.classList.toggle("light-theme");
}

// ----------------- Init -----------------
document.addEventListener("DOMContentLoaded",()=>{
    // defaults
    if(!localStorage.getItem("users")){
        users=[
            {email:"mees",password:"mees",role:"admin",lastActive:new Date().toISOString()},
            {email:"demo",password:"demo",role:"viewer",lastActive:new Date().toISOString()}
        ];
        saveData();
    }
    loadData();

    // show login if no user logged in
    if(currentUser){
        document.getElementById("loginScreen").classList.remove("active");
        document.getElementById("dashboardScreen").classList.add("active");
        document.getElementById("currentUserName").textContent=currentUser.email;
        if(currentUser.role==="admin") document.getElementById("usersTabBtn").classList.remove("hidden");
    }

    // login form
    document.getElementById("loginForm").addEventListener("submit",e=>{
        e.preventDefault();
        login(document.getElementById("loginEmail").value,
              document.getElementById("loginPassword").value);
    });

    document.getElementById("logoutButton").addEventListener("click",e=>{
        e.preventDefault();
        logout();
    });

    // nav tabs
    document.querySelectorAll(".nav-tab").forEach(btn=>{
        btn.addEventListener("click",()=>showTab(btn.getAttribute("data-tab")));
    });

    // add user
    document.getElementById("addUserForm").addEventListener("submit",e=>{
        e.preventDefault();
        addUser(
            document.getElementById("addUserEmail").value,
            document.getElementById("addUserPassword").value,
            document.getElementById("addUserRole").value
        );
    });

    // password change
    document.getElementById("passwordForm").addEventListener("submit",e=>{
        e.preventDefault();
        changePassword(
            document.getElementById("currentPasswordInput").value,
            document.getElementById("newPasswordInput").value,
            document.getElementById("confirmPasswordInput").value
        );
    });

    // theme toggle
    document.getElementById("themeToggle").addEventListener("click",toggleTheme);

    refreshUserTable();
});
