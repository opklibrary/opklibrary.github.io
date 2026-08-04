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


// Load appointments
async function loadAppointments() {

    // Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];
    
  const { data: updatedAppointment, error } = await client
    .from("appointments")
    .update({ booked: true })
    .eq("id", selectedAppointment)
    .select();

console.log("Updated appointment:", updatedAppointment);
console.log("Update error:", error);

if (error) {
    console.error("BOOKED UPDATE ERROR:", error);
    alert("Unable to mark appointment as booked: " + error.message);
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

    // Group appointments by date
    const groupedDates = {};

 availableAppointments.forEach(slot => {

        if (!groupedDates[slot.date]) {
            groupedDates[slot.date] = [];
        }

        groupedDates[slot.date].push(slot);

    });


    // Create each day's section
    Object.keys(groupedDates).forEach(date => {

        const daySection = document.createElement("div");
        daySection.className = "day-section";

        const heading = document.createElement("h3");
        heading.textContent = formatDate(date);

        daySection.appendChild(heading);


        groupedDates[date].forEach(slot => {

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

        container.appendChild(daySection);

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
    
    const { error } = await client
        .from("appointments")
        .update({ booked: true })
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
    
    //window.location.href = "submitted.html";

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
