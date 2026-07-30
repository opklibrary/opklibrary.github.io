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

// =========================
// LOAD BOOKED APPOINTMENTS
// =========================

async function loadAppointments() {

    const { data, error } = await client
        .from("appointments")
        .select(`
            id,
            date,
            time,
            booked,
            user_info (
                name,
                phone,
                email,
                what_tech
            ),
            why_appointment (
                learn,
                need,
                new,
                help,
                other,
                describe_problem
            )
        `)
        .eq("booked", true)
        .order("date")
        .order("time");

    if (error) {
        console.error("Error loading appointments:", error);
        return;
    }

    console.log(data);
}


// Run when admin page opens
loadAppointments();
