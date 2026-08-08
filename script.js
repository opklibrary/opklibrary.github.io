// 1. Connect to Supabase
const PROJECT_URL = "https://wzjlytqilsjcboqpwldz.supabase.co/";
const PUBLISHABLE_KEY = "sb_publishable_Nyt-q7qFiYGd7aV25sgGuQ_yk-1gHxN";

const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
);


// Store selected appointment
let selectedAppointment = null;


// Format dates for display
function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}


async function loadAppointments() {

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await client
        .from("appointments")
        .select("*")
        .eq("booked", false)
        .order("date")
        .order("time");

    if (error) {
        console.error(error);
        return;
    }


    // Remove past appointments and already booked times
    const now = new Date();

    const availableAppointments = data.filter(slot => {

        // Split "12:00 AM - 1:00 AM" and only use the start time
        const startTime = slot.time.split(" - ")[0];

        const appointmentDateTime = new Date(
            `${slot.date} ${startTime}`
        );

        console.log({
            date: slot.date,
            time: slot.time,
            appointmentDateTime,
            now
        });

        return appointmentDateTime > now && slot.booked === false;

    });


    const container = document.getElementById("dates");
    container.innerHTML = "";


    // =========================
    // GROUP APPOINTMENTS BY MONTH
    // =========================

    const groupedMonths = {};

    availableAppointments.forEach(slot => {

        const dateObject = new Date(slot.date + "T00:00:00");

        const monthKey = dateObject.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

        if (!groupedMonths[monthKey]) {
            groupedMonths[monthKey] = {};
        }

        if (!groupedMonths[monthKey][slot.date]) {
            groupedMonths[monthKey][slot.date] = [];
        }

        groupedMonths[monthKey][slot.date].push(slot);

    });


    // =========================
    // CREATE EACH MONTH
    // =========================

    Object.keys(groupedMonths).forEach(month => {

        const monthSection = document.createElement("div");
        monthSection.className = "month-section";


        // Month heading
        const monthHeading = document.createElement("h2");
        monthHeading.className = "month-heading";
        monthHeading.textContent = month;

        monthSection.appendChild(monthHeading);


        // Calendar grid
        const monthGrid = document.createElement("div");
        monthGrid.className = "month-grid";


        // =========================
        // CREATE EACH DATE
        // =========================

        Object.keys(groupedMonths[month]).forEach(date => {

            const daySection = document.createElement("div");
            daySection.className = "day-section";


            // Date heading
            const dateObject = new Date(date + "T00:00:00");

            const heading = document.createElement("h3");
            heading.className = "day-heading";
            
heading.classList.add(
    dateObject.toLocaleDateString("en-US", {
        month: "long"
    }).toLowerCase()
);
            
            heading.textContent = dateObject.toLocaleDateString("en-US", {
                weekday: "short",
                month: "long",
                day: "numeric"
            });

            daySection.appendChild(heading);


            // =========================
            // ADD APPOINTMENT TIMES
            // =========================

            groupedMonths[month][date].forEach(slot => {

                const option = document.createElement("label");
                option.className = "appointment-option";


                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = "appointment";
                radio.value = slot.id;


                const labelText = document.createElement("span");
                labelText.textContent = slot.time;


                radio.addEventListener("change", () => {

                    if (radio.checked) {

                        selectedAppointment = slot.id;

                        console.log("Selected:", selectedAppointment);

                        checkFormCompletion();

                    }

                });


                option.appendChild(radio);
                option.appendChild(labelText);

                daySection.appendChild(option);

            });


            monthGrid.appendChild(daySection);

        });


        monthSection.appendChild(monthGrid);

        container.appendChild(monthSection);

    });

}

// Submit appointment
async function submitAppointment() {

    if (selectedAppointment === null) {
        alert("Please select an appointment.");
        return;
    }

    // Get user information
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const whatTech = document.getElementById("whatTech").value.trim();

    const staffInitials = document
    .getElementById("staffInitials")
    .value
    .trim()
    .toUpperCase();

      // Get reason for appointment
    const learn = document.getElementById("learn").checked;
    const need = document.getElementById("need").checked;
    const newDevice = document.getElementById("new").checked;
    const help = document.getElementById("help").checked;
    const other = document.getElementById("other").checked;
    const describeProblem = document.getElementById("describeProblem").value.trim();

    // Check required fields
    if (!name || !email || !phone) {
        alert("Please fill out your name and phone number. Please write NULL for email if you do not have one.");
        return;
    }
    
console.log("Selected appointment:", selectedAppointment);
console.log("Type:", typeof selectedAppointment);

    // Get appointment date and time
const { data: appointmentData, error: appointmentFetchError } = await client
    .from("appointments")
    .select("date, time")
    .eq("id", selectedAppointment)
    .single();

if (appointmentFetchError) {
    console.error("APPOINTMENT FETCH ERROR:", appointmentFetchError);
    alert("Unable to find the selected appointment.");
    return;
}
    
const { error } = await client
    .from("appointments")
    .update({
        booked: true,
        cancelled: false,
        appointment_confirmed: false,
        staff_initials: staffInitials || null
    })
    .eq("id", selectedAppointment);

    if (error) {
        console.error(error);
        return;
    }

    // Save user information
    const { error: userError } = await client
        .from("user_info")
        .insert([
            {
                appointment_id: selectedAppointment,
                name: name,
                phone_number: phone,
                email: email,
                what_tech: whatTech
            }
        ]);
    
   if (userError) {
    console.error("USER INFO ERROR:", userError);
    alert("Unable to save user information: " + userError.message);
    return;
}
       // Save reason for appointment
    const { error: reasonError } = await client
        .from("why_appointment")
        .insert([
            {
                appointment_id: selectedAppointment,
                learn: learn,
                need: need,
                new: newDevice,
                help: help,
                other: other,
                describe_problem: describeProblem
            }
        ]);

    if (reasonError) {
        console.error(reasonError);
        alert("Unable to save reason for appointment.");
        return;
    }
    
    // Send email notification
    const { data: emailData, error: emailError } = await client.functions.invoke(
        "clever-endpoint",
        {
            body: {
                date: appointmentData.date,
                time: appointmentData.time,
                name: name,
                email: email,
                phone: phone,
                what_tech: whatTech,
                reason: describeProblem
            }
        }
    );

    if (emailError) {
        console.error("EMAIL ERROR:", emailError);
        alert("Appointment was saved, but the email notification could not be sent.");
        return;
    }

    console.log("Appointment email sent successfully:", emailData);
    
    window.location.href = "submitted.html";

    selectedAppointment = null;

    loadAppointments();

}


// Button connection
document
    .getElementById("submitAppointment")
    .onclick = submitAppointment;

// Enable submit button only when form is complete
const submitButton = document.getElementById("submitAppointment");
const agreement = document.getElementById("agreement");

function checkFormCompletion() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (name && email && phone && selectedAppointment && agreement.checked) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

document.addEventListener("input", checkFormCompletion);
agreement.addEventListener("change", checkFormCompletion);



// Start page
loadAppointments();

// =========================
// STAFF LOGIN
// =========================

document.getElementById("adminLogin").addEventListener("click", () => {
    window.location.href = "admin-login.html";
});
