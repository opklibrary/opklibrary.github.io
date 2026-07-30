// =========================
// SUPABASE CONNECTION
// =========================

const PROJECT_URL = "https://YOUR_PROJECT.supabase.co";
const PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY";

const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
);


// =========================
// LOGIN
// =========================

async function login() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        document.getElementById("errorMessage").textContent = error.message;
        return;
    }

    window.location.href = "admin.html";
}
