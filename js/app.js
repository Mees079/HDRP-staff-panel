const App = {
    data: {
        users: [],                 // Gebruikerslijst
        currentUser: null,         // Ingelogde gebruiker
        isDarkMode: true           // Dark/Light theme toggle
    },

    config: {
        JSONBIN_ID: "68d9759343b1c97be9534096",   // <--- jouw bin ID
        JSONBIN_KEY: "$2a$10$DTiU3hcuglHpTy/sU3hUKuHWnX7exTTkb6/eahL2zr9cyIwo9feTK"
    },

    /* ----------  OPSLAG  ---------- */
    storage: {
        saveLocal() {
            localStorage.setItem("HDRPStaffPanel", JSON.stringify(App.data));
        },
        loadLocal() {
            const saved = localStorage.getItem("HDRPStaffPanel");
            if (saved) App.data = JSON.parse(saved);
        }
    },

    remote: {
        async load() {
            try {
                const res = await fetch(`https://api.jsonbin.io/v3/b/${App.config.JSONBIN_ID}/latest`, {
                    headers: { "X-Master-Key": App.config.JSONBIN_KEY }
                });
                const json = await res.json();
                if (json.record) App.data = json.record;
            } catch (err) {
                console.warn("⚠️ Kon JSONBin niet laden:", err);
            }
        },
        async save() {
            try {
                await fetch(`https://api.jsonbin.io/v3/b/${App.config.JSONBIN_ID}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Master-Key": App.config.JSONBIN_KEY
                    },
                    body: JSON.stringify(App.data)
                });
            } catch (err) {
                console.warn("⚠️ Kon JSONBin niet opslaan:", err);
            }
        }
    },

    /* ----------  UI FUNCTIES  ---------- */
    ui: {
        showMessage(id, text, type = "error", duration = 4000) {
            const el = document.getElementById(id);
            if (!el) return;
            el.className = `message ${type}`;
            el.textContent = text;
            el.style.display = "block";
            setTimeout(() => el.style.display = "none", duration);
        },

        showLogin() {
            document.getElementById("loginScreen").classList.add("active");
            document.getElementById("dashboardScreen").classList.remove("active");
            document.getElementById("loginForm").reset();
        },

        showDashboard() {
            document.getElementById("loginScreen").classList.remove("active");
            document.getElementById("dashboardScreen").classList.add("active");
            App.ui.updateUserDisplay();
            App.ui.showTab("dashboard");
        },

        showTab(tab) {
            document.querySelectorAll(".main-content").forEach(t => t.classList.remove("active"));
            document.getElementById(tab + "Tab").classList.add("active");

            document.querySelectorAll(".nav-tab").forEach(b => b.classList.remove("active"));
            const btn = document.querySelector(`[data-tab="${tab}"]`);
            if (btn) btn.classList.add("active");

            if (tab === "users") App.ui.refreshUserTable();
        },

        updateUserDisplay() {
            const nameEl = document.getElementById("currentUserName");
            const usersBtn = document.getElementById("usersTabBtn");

            if (!App.data.currentUser) return;

            nameEl.textContent = App.data.currentUser.email;
            if (App.data.currentUser.role === "admin") {
                usersBtn.classList.remove("hidden");
            } else {
                usersBtn.classList.add("hidden");
            }
        },

        refreshUserTable() {
            const tbody = document.getElementById("userTableBody");
            const count = document.getElementById("userCount");
            if (!tbody) return;

            tbody.innerHTML = "";
            count.textContent = `${App.data.users.length} staff lid${App.data.users.length !== 1 ? "den" : ""}`;

            App.data.users.forEach((u, i) => {
                const row = document.createElement("tr");
                const lastActive = new Date(u.lastActive || Date.now()).toLocaleString("nl-NL");
                const isCurrent = App.data.currentUser && App.data.currentUser.email === u.email;

                row.innerHTML = `
                    <td>${u.email}</td>
                    <td><span class="role-badge ${u.role}">${u.role === "admin" ? "Administrator" : "Kijker"}</span></td>
                    <td>${lastActive}</td>
                    <td>
                        <div class="user-actions">
                            ${!isCurrent ? `<button class="btn btn-danger btn-small" onclick="App.ui.deleteUser(${i})">Verwijderen</button>` : ""}
                        </div>
                    </td>`;
                tbody.appendChild(row);
            });
        },

        deleteUser(index) {
            if (confirm("Weet je zeker dat je deze staff gebruiker wilt verwijderen?")) {
                App.data.users.splice(index, 1);
                App.storage.saveLocal();
                App.remote.save();
                App.ui.refreshUserTable();
            }
        }
    },

    /* ----------  AUTH  ---------- */
    auth: {
        login(email, password) {
            const user = App.data.users.find(u => u.email === email && u.password === password);
            if (!user) return App.ui.showMessage("loginMessage", "Onjuist e-mail of wachtwoord!", "error");

            user.lastActive = new Date().toISOString();
            App.data.currentUser = user;
            App.storage.saveLocal();
            App.remote.save();
            App.ui.showDashboard();
        },

        logout() {
            App.data.currentUser = null;
            App.storage.saveLocal();
            App.ui.showLogin();
        }
    },

    /* ----------  THEMA  ---------- */
    theme: {
        toggle() {
            App.data.isDarkMode = !App.data.isDarkMode;
            document.body.dataset.theme = App.data.isDarkMode ? "dark" : "light";
            document.getElementById("themeToggle").classList.toggle("active", App.data.isDarkMode);
            App.storage.saveLocal();
        }
    }
};

/* ----------  INIT  ---------- */
document.addEventListener("DOMContentLoaded", () => {
    App.storage.loadLocal();
    if (App.data.isDarkMode === undefined) App.data.isDarkMode = true;

    document.body.dataset.theme = App.data.isDarkMode ? "dark" : "light";
    document.getElementById("themeToggle").classList.toggle("active", App.data.isDarkMode);

    if (App.data.currentUser) App.ui.showDashboard();
    else App.ui.showLogin();

    // ---- Form & Button Events ----
    document.getElementById("loginForm").addEventListener("submit", e => {
        e.preventDefault();
        App.auth.login(
            document.getElementById("loginEmail").value.trim(),
            document.getElementById("loginPassword").value.trim()
        );
    });

    document.getElementById("logoutButton").addEventListener("click", e => {
        e.preventDefault();
        App.auth.logout();
    });

    document.querySelectorAll(".nav-tab").forEach(btn =>
        btn.addEventListener("click", () => App.ui.showTab(btn.dataset.tab))
    );

    document.getElementById("themeToggle").addEventListener("click", App.theme.toggle);

    // Nieuwe staff gebruiker toevoegen
    document.getElementById("addUserForm").addEventListener("submit", e => {
        e.preventDefault();
        const email = document.getElementById("addUserEmail").value.trim();
        const role = document.getElementById("addUserRole").value;
        const pass = document.getElementById("addUserPassword").value.trim();

        if (!email || !role || !pass)
            return App.ui.showMessage("addUserMessage", "Vul alle velden in!", "error");

        if (App.data.users.some(u => u.email === email))
            return App.ui.showMessage("addUserMessage", "Gebruiker bestaat al!", "error");

        App.data.users.push({
            email,
            password: pass,
            role,
            lastActive: new Date().toISOString()
        });

        App.storage.saveLocal();
        App.remote.save();
        App.ui.refreshUserTable();
        App.ui.showMessage("addUserMessage", "✅ Staff gebruiker toegevoegd!", "success");
        e.target.reset();
    });

    // Wachtwoord wijzigen
    document.getElementById("passwordForm").addEventListener("submit", e => {
        e.preventDefault();
        const current = document.getElementById("currentPasswordInput").value;
        const newPass = document.getElementById("newPasswordInput").value;
        const confirm = document.getElementById("confirmPasswordInput").value;

        if (newPass !== confirm)
            return App.ui.showMessage("passwordMessage", "Nieuw wachtwoord komt niet overeen!", "error");

        const user = App.data.users.find(u => u.email === App.data.currentUser.email);
        if (!user || user.password !== current)
            return App.ui.showMessage("passwordMessage", "Huidig wachtwoord onjuist!", "error");

        user.password = newPass;
        App.data.currentUser.password = newPass;
        App.storage.saveLocal();
        App.remote.save();
        App.ui.showMessage("passwordMessage", "✅ Wachtwoord gewijzigd!", "success");
        e.target.reset();
    });
});
