// =========================
// SUPABASE CONNECTION
// =========================

const PROJECT_URL = "https://wzjlytqilsjcboqpwldz.supabase.co";
const PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY";

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
