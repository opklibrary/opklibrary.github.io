// =========================
// SUPABASE CONNECTION
// =========================

// 1. Connect to Supabase
const PROJECT_URL = "https://wzjlytqilsjcboqpwldz.supabase.co/";
const PUBLISHABLE_KEY = "sb_publishable_Nyt-q7qFiYGd7aV25sgGuQ_yk-1gHxN";


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
