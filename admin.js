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
// LOAD ALL APPOINTMENTS 
// =========================

// Stores every appointment loaded from Supabase
let allAppointments = [];

// Remove punctuation and make text lowercase
function normalize(text) {

    return (text || "")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

}

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
                what_tech,
                submitted_at
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

    // Save all appointments for searching/filtering
    allAppointments = data;

    // Display them on the page
    displayAppointments(allAppointments);

}



function displayAppointments(data) {

    const container = document.getElementById("appointmentList");

    container.innerHTML = "";

    let currentMonth = "";
        
        data.forEach((appointment) => {
        
            console.log("FULL APPOINTMENT:", appointment);
            console.log("USER INFO:", appointment.user_info);
            console.log("WHY APPOINTMENT:", appointment.why_appointment);
        
            const user = appointment.user_info?.[0];
            const reason = appointment.why_appointment?.[0];
        
            //makes timestamp into readable values instead of raw values
            let submittedText = "Unknown";
        
            if (user?.submitted_at) {
            
                const submittedDate = new Date(user.submitted_at);
            
                submittedText = submittedDate.toLocaleString("en-US", {
            
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
            
                });
            
            }
        
            const appointmentDate = new Date(
                appointment.date + "T00:00:00"
            );
        
            // Get the month and year
            const monthName = appointmentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            });
        
            // Add a heading when the month changes
            if (monthName !== currentMonth) {
        
                const monthHeading = document.createElement("h2");
                monthHeading.className = "month-heading";
                monthHeading.textContent = monthName;
        
                container.appendChild(monthHeading);
        
                currentMonth = monthName;
            }
        
            // Format the appointment date
            const formattedDate = appointmentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        
            const card = document.createElement("div");
            card.className = "appointment-card";
        
            card.innerHTML = `
                <h2>${formattedDate}</h2>
        
                <h3>${appointment.time}</h3>
        
                <p><strong>Name:</strong> ${user?.name || "N/A"}</p>
                <p><strong>Phone:</strong> ${user?.phone_number || "N/A"}</p>
                <p><strong>Email:</strong> ${user?.email || "N/A"}</p>
        
                <p><strong>Tech Help:</strong> ${user?.what_tech || "N/A"}</p>
        
                <hr>
        
                <p><strong>Why appointment:</strong></p>
        
                <ul>
                    ${reason?.learn ? "<li>Learn something new</li>" : ""}
                    ${reason?.need ? "<li>Need assistance with something</li>" : ""}
                    ${reason?.new ? "<li>New device/setup</li>" : ""}
                    ${reason?.help ? "<li>General help</li>" : ""}
                    ${reason?.other ? "<li>Other</li>" : ""}
                </ul>
        
                <p>
                    <strong>Description:</strong><br>
                    ${reason?.describe_problem || "No description provided"}
                </p>
                
                <div class="appointment-status">

                    <button class="status-button confirm-button">
                        Confirm
                    </button>
                
                    <button class="status-button reschedule-button">
                        Reschedule
                    </button>

                    <button class="status-button cancel-button">
                        Cancel
                    </button>
                
                </div>
        
                <hr>
        
                <p class="submitted-time">
                    <strong>Submitted:</strong><br>
                    ${submittedText}
                </p>
            `;

            const confirmButton = card.querySelector(".confirm-button");

            confirmButton.addEventListener("click", () => {
                card.classList.toggle("confirmed");
            });
            
            container.appendChild(card);
        
        });
}

//make admin search work
const searchBox = document.getElementById("searchAppointments");

searchBox.addEventListener("input", () => {

    const search = normalize(searchBox.value);

    const filtered = allAppointments.filter((appointment) => {

        const user = appointment.user_info?.[0];
        const reason = appointment.why_appointment?.[0];

        if (!user) return false;

       const searchableText = [

            user?.name,
        
            user?.phone_number,
        
            user?.email,
        
            user?.what_tech,
        
            reason?.describe_problem
        
        ]
        .join(" ");

        return normalize(searchableText).includes(search);

    });

    displayAppointments(filtered);

});

// Run when admin page opens
loadAppointments();
