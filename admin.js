// =========================
// SUPABASE CONNECTION
// =========================

const PROJECT_URL = "https://wzjlytqilsjcboqpwldz.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_Nyt-q7qFiYGd7aV25sgGuQ_yk-1gHxN";

const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
);

// =========================
// LOAD ALL APPOINTMENTS
// =========================

let allAppointments = [];
let currentView = "upcoming";

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
            cancelled,
            appointment_confirmed,
            staff_initials,
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
        .order("date")
        .order("time");

    if (error) {
        console.error("Error loading appointments:", error);
        return;
    }

    allAppointments = data;

    displayAppointments(allAppointments);
}

// =========================
// DISPLAY APPOINTMENTS
// =========================

function displayAppointments(data) {

    const container = document.getElementById("appointmentList");

    container.innerHTML = "";

    const now = new Date();

    // =========================
    // SEPARATE APPOINTMENTS
    // =========================

    const upcomingAppointments = [];
    const pastAppointments = [];
    const canceledAppointments = [];

    data.forEach((appointment) => {

        console.log("FULL APPOINTMENT:", appointment);
        console.log("USER INFO:", appointment.user_info);
        console.log("WHY APPOINTMENT:", appointment.why_appointment);

    const startTime = appointment.time.split(" - ")[0];

const appointmentDateTime = new Date(
    `${appointment.date} ${startTime}`
);

        console.log(
    "DATE CHECK:",
    appointment.date,
    appointment.time,
    "=>",
    appointmentDateTime,
    "NOW:",
    now
);

        // Canceled appointments ONLY go here
        if (appointment.cancelled === true) {

            canceledAppointments.push(appointment);

        } else if (appointmentDateTime > now) {

            upcomingAppointments.push(appointment);

        } else {

            pastAppointments.push(appointment);

        }

    });

    // =========================
    // CHOOSE CURRENT VIEW
    // =========================

    let appointmentsToDisplay = [];

    if (currentView === "upcoming") {

        appointmentsToDisplay = upcomingAppointments;

    } else if (currentView === "past") {

        appointmentsToDisplay = pastAppointments;

    } else if (currentView === "canceled") {

        appointmentsToDisplay = canceledAppointments;

    }

    console.log("CURRENT VIEW:", currentView);
    console.log("DISPLAYING:", appointmentsToDisplay);

    // =========================
    // SORT APPOINTMENTS
    // =========================

    appointmentsToDisplay.sort((a, b) => {

    const startTimeA = a.time.split(" - ")[0];
    const startTimeB = b.time.split(" - ")[0];

    const dateA = new Date(
        `${a.date} ${startTimeA}`
    );

    const dateB = new Date(
        `${b.date} ${startTimeB}`
    );

    return dateA - dateB;

});

    let currentMonth = "";

    appointmentsToDisplay.forEach((appointment) => {

        const user = appointment.user_info?.[0];
        const reason = appointment.why_appointment?.[0];

        // =========================
        // SUBMITTED TIME
        // =========================

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

        // =========================
        // APPOINTMENT DATE
        // =========================

        const appointmentDate = new Date(
            appointment.date + "T00:00:00"
        );

        const monthName = appointmentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

        // =========================
        // MONTH HEADING
        // =========================

        if (monthName !== currentMonth) {

            const monthHeading = document.createElement("h2");

            monthHeading.className = "month-heading";

            monthHeading.textContent = monthName;

            container.appendChild(monthHeading);

            currentMonth = monthName;
        }

        // =========================
        // FORMATTED DATE
        // =========================

        const formattedDate = appointmentDate.toLocaleDateString("en-US", {

            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"

        });

        // =========================
        // APPOINTMENT CARD
        // =========================

      const card = document.createElement("div");

        card.className = "appointment-card";

        if (currentView === "past") {
            card.classList.add("past-appointment");
        }

        if (currentView === "canceled") {
            card.classList.add("canceled-appointment");
        }

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

            <p class="staff-initials-display">
                <strong>Staff Initials:</strong>
                ${appointment.staff_initials || "—"}
            </p>

          ${currentView === "upcoming" ? `
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
` : ""}
       
            <hr>

            <p class="submitted-time">
                <strong>Submitted:</strong><br>
                ${submittedText}
            </p>
        `;

        // =========================
        // CONFIRM BUTTON
        // =========================

  const confirmButton =
    card.querySelector(".confirm-button");

if (confirmButton) {

    // Show saved confirmation status
    if (appointment.appointment_confirmed === true) {

        card.classList.add("confirmed");

        confirmButton.classList.add("confirmed-button");

        confirmButton.textContent = "Confirmed";
    }

    confirmButton.addEventListener("click", async () => {

        const newStatus =
            !appointment.appointment_confirmed;

        const { error } = await client
            .from("appointments")
            .update({
                appointment_confirmed: newStatus
            })
            .eq("id", appointment.id);

        if (error) {

            console.error(
                "Error updating confirmation:",
                error
            );

            alert("Unable to save confirmation.");

            return;
        }

        // Update local appointment data
        appointment.appointment_confirmed = newStatus;

        // Update the card visually
        card.classList.toggle(
            "confirmed",
            newStatus
        );

        confirmButton.classList.toggle(
            "confirmed-button",
            newStatus
        );

        confirmButton.textContent =
            newStatus ? "Confirmed" : "Confirm";

    });

}
        // =========================
// RESCHEDULE BUTTON
// =========================

const rescheduleButton =
    card.querySelector(".reschedule-button");

if (rescheduleButton) {

    rescheduleButton.addEventListener("click", async () => {

        const modal =
            document.getElementById("rescheduleModal");

        const currentAppointmentText =
            document.getElementById(
                "rescheduleCurrentAppointment"
            );

        const slotSelect =
            document.getElementById("rescheduleSlot");

        const currentDate =
            new Date(
                appointment.date + "T00:00:00"
            ).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });

        currentAppointmentText.textContent =
            `Currently scheduled for ${currentDate} at ${appointment.time}`;

        // Clear old choices
        slotSelect.innerHTML = `
            <option value="">
                Select an available appointment
            </option>
        `;

        // Get currently available appointments
        const { data: availableSlots, error } =
            await client
                .from("appointments")
                .select("id, date, time")
                .eq("booked", false)
                .eq("cancelled", false)
                .order("date")
                .order("time");

        if (error) {

            console.error(
                "Error loading available appointments:",
                error
            );

            alert(
                "Unable to load available appointments."
            );

            return;
        }

        const now = new Date();

        // Only show future appointments
        const futureSlots =
            availableSlots.filter((slot) => {

                const startTime =
                    slot.time.split(" - ")[0];

                const slotDateTime =
                    new Date(
                        `${slot.date} ${startTime}`
                    );

                return slotDateTime > now;

            });

        if (futureSlots.length === 0) {

            alert(
                "There are currently no available appointments."
            );

            return;
        }

        // Add available slots to dropdown
        futureSlots.forEach((slot) => {

            const option =
                document.createElement("option");

            const slotDate =
                new Date(
                    slot.date + "T00:00:00"
                );

            const formattedDate =
                slotDate.toLocaleDateString(
                    "en-US",
                    {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    }
                );

            option.value = slot.id;

            option.textContent =
                `${formattedDate} — ${slot.time}`;

            slotSelect.appendChild(option);

        });

        // Store which appointment we're rescheduling
        modal.dataset.appointmentId =
            appointment.id;

        modal.style.display = "flex";

    });

}
        
// =========================
// CANCEL BUTTON
// =========================

const cancelButton =
    card.querySelector(".cancel-button");

if (cancelButton) {

    cancelButton.addEventListener("click", async () => {

        const confirmed = confirm(
            "Are you sure you want to cancel this appointment?"
        );

        if (!confirmed) {
            return;
        }

        // =========================
        // CANCEL APPOINTMENT
        // =========================

        const { error } = await client
            .from("appointments")
            .update({
                cancelled: true,
                booked: false,
                appointment_confirmed: false
            })
            .eq("id", appointment.id);

        if (error) {

            console.error(
                "Error canceling appointment:",
                error
            );

            alert(
                "Unable to cancel the appointment."
            );

            return;
        }

        // Update local appointment data
        appointment.cancelled = true;
        appointment.booked = false;
        appointment.appointment_confirmed = false;

        // =========================
        // RELOAD APPOINTMENTS
        // =========================

        await loadAppointments();

        alert(
            "Appointment canceled."
        );

    });

}

        container.appendChild(card);

    });
}

// =========================
// RESCHEDULE APPOINTMENT
// =========================

const confirmReschedule =
    document.getElementById("confirmReschedule");

const cancelReschedule =
    document.getElementById("cancelReschedule");

const rescheduleModal =
    document.getElementById("rescheduleModal");

const rescheduleSlot =
    document.getElementById("rescheduleSlot");


// =========================
// CANCEL RESCHEDULE
// =========================

cancelReschedule.addEventListener("click", () => {

    rescheduleModal.style.display = "none";

    rescheduleSlot.value = "";

});


// =========================
// CONFIRM RESCHEDULE
// =========================

confirmReschedule.addEventListener("click", async () => {

    const oldAppointmentId =
        Number(rescheduleModal.dataset.appointmentId);

    const newAppointmentId =
        Number(rescheduleSlot.value);

    if (!newAppointmentId) {

        alert(
            "Please select a new appointment."
        );

        return;
    }

    if (!oldAppointmentId) {

        alert(
            "Unable to identify the appointment."
        );

        return;
    }


    // =========================
    // GET BOTH APPOINTMENTS
    // =========================

    const { data: oldAppointment, error: oldError } =
        await client
            .from("appointments")
            .select("id, date, time, booked")
            .eq("id", oldAppointmentId)
            .single();

    if (oldError || !oldAppointment) {

        console.error(
            "Error loading current appointment:",
            oldError
        );

        alert(
            "Unable to load the current appointment."
        );

        return;
    }


    const { data: newAppointment, error: newError } =
        await client
            .from("appointments")
            .select("id, date, time, booked")
            .eq("id", newAppointmentId)
            .single();

    if (newError || !newAppointment) {

        console.error(
            "Error loading new appointment:",
            newError
        );

        alert(
            "Unable to load the selected appointment."
        );

        return;
    }


    // Make absolutely sure the new slot is still available
    if (newAppointment.booked === true) {

        alert(
            "That appointment was just taken. Please choose another."
        );

        rescheduleModal.style.display = "none";

        await loadAppointments();

        return;
    }


    // =========================
    // SAVE OLD SLOT INFORMATION
    // =========================

    const oldDate = oldAppointment.date;
    const oldTime = oldAppointment.time;

    const newDate = newAppointment.date;
    const newTime = newAppointment.time;


    // =========================
    // MOVE BOOKED APPOINTMENT
    // =========================

    const { error: moveError } =
        await client
            .from("appointments")
            .update({

                date: newDate,
                time: newTime,

                // New time needs confirmation
                appointment_confirmed: false

            })
            .eq("id", oldAppointmentId);

    if (moveError) {

        console.error(
            "Error moving appointment:",
            moveError
        );

        alert(
            "Unable to reschedule the appointment."
        );

        return;
    }


    // =========================
    // RETURN OLD SLOT
    // =========================

    const { error: freeError } =
        await client
            .from("appointments")
            .update({

                date: oldDate,
                time: oldTime,
                booked: false,
                cancelled: false,
                appointment_confirmed: false,
                staff_initials: null

            })
            .eq("id", newAppointmentId);

    if (freeError) {

        console.error(
            "Error returning old appointment slot:",
            freeError
        );

        // Try to undo the first update
        await client
            .from("appointments")
            .update({

                date: oldDate,
                time: oldTime

            })
            .eq("id", oldAppointmentId);

        alert(
            "The appointment could not be fully rescheduled."
        );

        return;
    }


    // =========================
    // CLOSE MODAL
    // =========================

    rescheduleModal.style.display = "none";

    rescheduleSlot.value = "";


    // =========================
    // RELOAD APPOINTMENTS
    // =========================

    await loadAppointments();


    alert(
        "Appointment successfully rescheduled."
    );

});

// =========================
// ADMIN SEARCH
// =========================

const searchBox =
    document.getElementById("searchAppointments");

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

        ].join(" ");

        return normalize(searchableText).includes(search);

    });

    displayAppointments(filtered);

});

// =========================
// ADMIN VIEW BUTTONS
// =========================

const showUpcomingButton =
    document.getElementById("showUpcoming");

const showPastButton =
    document.getElementById("showPast");

const showCanceledButton =
    document.getElementById("showCanceled");

const adminViewTitle =
    document.getElementById("adminViewTitle");

// =========================
// CLEAR ACTIVE VIEW
// =========================

function clearActiveView() {

    showUpcomingButton.classList.remove("active-view");

    showPastButton.classList.remove("active-view");

    showCanceledButton.classList.remove("active-view");

}

// =========================
// UPCOMING
// =========================

showUpcomingButton.addEventListener("click", () => {

    currentView = "upcoming";

    clearActiveView();

    showUpcomingButton.classList.add("active-view");

    adminViewTitle.textContent =
        "Upcoming Appointments";

    displayAppointments(allAppointments);

});

// =========================
// PAST
// =========================

showPastButton.addEventListener("click", () => {

    currentView = "past";

    clearActiveView();

    showPastButton.classList.add("active-view");

    adminViewTitle.textContent =
        "Past Dates";

    displayAppointments(allAppointments);

});

// =========================
// CANCELED
// =========================

showCanceledButton.addEventListener("click", () => {

    currentView = "canceled";

    clearActiveView();

    showCanceledButton.classList.add("active-view");

    adminViewTitle.textContent =
        "Canceled Appointments";

    displayAppointments(allAppointments);

});

// =========================
// RUN WHEN ADMIN PAGE OPENS
// =========================

loadAppointments();
