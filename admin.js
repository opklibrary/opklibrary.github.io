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
                phone_number,
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

const container = document.getElementById("appointmentList");

container.innerHTML = "";

data.forEach((appointment) => {

    const user = appointment.user_info?.[0];
    const reason = appointment.why_appointment?.[0];

    const card = document.createElement("div");
    card.className = "appointment-card";

    card.innerHTML = `
        <h2>${appointment.date}</h2>
        <h3>${appointment.time}</h3>

        <p><strong>Name:</strong> ${user?.name || "N/A"}</p>
        <p><strong>Phone:</strong> ${user?.phone_number || "N/A"}</p>
        <p><strong>Email:</strong> ${user?.email || "N/A"}</p>

        <p><strong>Tech Help:</strong> ${user?.what_tech || "N/A"}</p>

        <hr>

        <p><strong>Why appointment:</strong></p>
        <ul>
            ${reason?.learn ? "<li>Learn something new</li>" : ""}
            ${reason?.need ? "<li>Need assistance</li>" : ""}
            ${reason?.new ? "<li>New device/setup</li>" : ""}
            ${reason?.help ? "<li>General help</li>" : ""}
            ${reason?.other ? "<li>Other</li>" : ""}
        </ul>

        <p><strong>Description:</strong><br>
        ${reason?.describe_problem || "No description provided"}
        </p>
    `;

    container.appendChild(card);
    });

}

// Run when admin page opens
loadAppointments();
