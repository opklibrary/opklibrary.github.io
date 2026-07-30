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
// CHECK IF STAFF IS LOGGED IN
// =========================

async function checkLogin() {
    const {
        data: { session }
    } = await client.auth.getSession();

    if (!session) {
        window.location.href = "admin-login.html";
        return;
    }

    console.log("Logged in as:", session.user.email);

    // Later we'll load the appointments here.
}

checkLogin();
