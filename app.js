/**
 * app.js - Team G Treasure Hunt
 * API: https://codecyprus.org/th/api/
 */

//  Cookie helpers
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') { c = c.substring(1); }
        if (c.indexOf(name) === 0) { return c.substring(name.length, c.length); }
    }
    return "";
}

function setCookie(cookieName, cookieValue, expireDays) {
    let date = new Date();
    date.setTime(date.getTime() + (expireDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + date.toUTCString();
    document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/";
}

// ── Get session – URL param first, cookie as fallback
function getSession() {
    let urlParams = new URLSearchParams(window.location.search);
    let sessionFromURL = urlParams.get("session");
    if (sessionFromURL) {
        // Save it into cookie so future calls also have it
        setCookie("SES", sessionFromURL, 20);
        return sessionFromURL;
    }
    return getCookie("SES");
}

function getNumQuestions() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("noq") || getCookie("NOQ") || "?";
}

// Countdown
let timeInterval;
let remainingTime = 30 * 60;

function updatetime() {
    let seconds = remainingTime % 60;
    let minutes = Math.floor(remainingTime / 60);
    let timer = document.querySelector('.timer');
    if (!timer) return;

    if (remainingTime <= 0) {
        clearInterval(timeInterval);
        timer.textContent = "Time's up!";
        showToast("Time's up! Redirecting to leaderboard...", "info");
        setTimeout(function() { window.location.assign("leaderboard.html"); }, 2500);
    } else {
        let mm = minutes.toString().padStart(2, '0');
        let ss = seconds.toString().padStart(2, '0');
        timer.textContent = mm + ":" + ss;
        remainingTime--;
    }
}

function startTimer() {
    if (timeInterval) { clearInterval(timeInterval); }
    remainingTime = 30 * 60;
    updatetime();
    timeInterval = setInterval(updatetime, 1000);
}

//  Toast notification
function showToast(message, type) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "toast " + (type || "info");
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() { toast.classList.remove("show"); }, 3000);
}

// Get Question
function getquestion() {
    let sessions = getSession();

    if (!sessions) {
        showToast("No session found. Please start a new game.", "info");
        setTimeout(function() { window.location.assign("Challenges.html"); }, 2000);
        return;
    }

    fetch("https://codecyprus.org/th/api/question?session=" + sessions)
        .then(function(response) { return response.json(); })
        .then(function(jsonObject) {
            console.log(jsonObject);

            if (jsonObject['status'] === "ERROR") {
                showToast((jsonObject['errorMessages'] || ["Server error."]).join(" "), "wrong");
                return;
            }

            if (jsonObject['completed'] === true) {
                window.location.assign("leaderboard.html");
                return;
            }

            // Question number
            let qNumEl = document.getElementById("question-number");
            if (qNumEl) {
                qNumEl.textContent = "Question " + (jsonObject['currentQuestion'] || "") + " of " + getNumQuestions();
            }

            // Question text
            document.getElementById("question").innerHTML = jsonObject['questionText'] || "";

            // Clear options
            let optionsEl = document.getElementById("options");
            optionsEl.innerHTML = "";

            let qt = jsonObject['questionType'];

            if (qt === "BOOLEAN") {
                optionsEl.innerHTML =
                    '<div class="bool-grid">' +
                    '<button class="bool-btn true-btn" onclick="Answer(\'True\')">✅ True</button>' +
                    '<button class="bool-btn false-btn" onclick="Answer(\'False\')">❌ False</button>' +
                    '</div>';

            } else if (qt === "MCQ") {
                let labels = ["A", "B", "C", "D"];
                for (let i = 0; i < labels.length; i++) {
                    optionsEl.innerHTML +=
                        '<button class="mcq-btn" onclick="Answer(\'' + labels[i] + '\')">' +
                        '<span class="mcq-label">' + labels[i] + '</span>' +
                        '<span>' + labels[i] + '</span>' +
                        '</button>';
                }

            } else {
                // TEXT / NUMERIC / INTEGER
                optionsEl.innerHTML =
                    '<input type="text" id="answer" class="answer-input" placeholder="Type your answer...">' +
                    '<button class="submit-btn" onclick="Answer(document.getElementById(\'answer\').value)">Submit Answer</button>';

                let input = document.getElementById("answer");
                if (input) {
                    input.addEventListener("keydown", function(e) {
                        if (e.key === "Enter") Answer(input.value);
                    });
                }
            }

            // Skip button
            let skipEl = document.getElementById("skip");
            if (jsonObject['canBeSkipped'] === true) {
                skipEl.innerHTML = '<button class="skip-btn" onclick="Skip()">⏭ Skip Question</button>';
                skipEl.style.display = "block";
            } else {
                skipEl.style.display = "none";
            }

            // Location button
            let locationEl = document.getElementById("location");
            if (jsonObject['requiresLocation'] === true) {
                locationEl.innerHTML = '<button class="location-btn" onclick="getLocation()">📍 Update My Location</button>';
                locationEl.style.display = "block";
                getLocationSilent();
            } else {
                locationEl.style.display = "none";
            }
        })
        .catch(function(err) {
            console.error("Error fetching question:", err);
            showToast("Network error. Please check your connection.", "wrong");
        });
}

// Location
function getLocationSilent() {
    let sessions = getSession();
    if (!navigator.geolocation || !sessions) return;
    navigator.geolocation.getCurrentPosition(function(pos) {
        fetch("https://codecyprus.org/th/api/location?session=" + sessions +
            "&latitude=" + pos.coords.latitude +
            "&longitude=" + pos.coords.longitude)
            .then(function(r) { return r.json(); })
            .then(function(d) { console.log("Location updated:", d); });
    });
}

function getLocation() {
    if (!navigator.geolocation) {
        showToast("Geolocation not supported by your browser.", "wrong");
        return;
    }
    showToast("Getting your location...", "info");
    navigator.geolocation.getCurrentPosition(
        function(position) {
            let lat = position.coords.latitude.toFixed(5);
            let lng = position.coords.longitude.toFixed(5);
            showToast("Location: " + lat + ", " + lng, "info");
            let sessions = getSession();
            fetch("https://codecyprus.org/th/api/location?session=" + sessions +
                "&latitude=" + position.coords.latitude +
                "&longitude=" + position.coords.longitude)
                .then(function(r) { return r.json(); })
                .then(function(d) { console.log("Location updated:", d); });
        },
        function(err) {
            console.error("Geolocation error:", err);
            showToast("Could not get location. Check permissions.", "wrong");
        }
    );
}

// Answer
function Answer(ans) {
    let sessions = getSession();

    if (ans === "" || ans === undefined || ans === null) {
        showToast("Please enter an answer first.", "info");
        return;
    }

    fetch("https://codecyprus.org/th/api/answer?session=" + sessions + "&answer=" + ans)
        .then(function(response) { return response.json(); })
        .then(function(jsonObject) {
            console.log(jsonObject);
            if (jsonObject['correct'] === false) {
                showToast("❌ " + (jsonObject['message'] || "Wrong answer. Try again!"), "wrong");
            } else if (jsonObject['correct'] === true) {
                showToast("✅ " + (jsonObject['message'] || "Correct!"), "correct");
                getscore();
                setTimeout(getquestion, 800);
            } else if (jsonObject['status'] === "ERROR") {
                showToast((jsonObject['errorMessages'] || ["Error."]).join(" "), "wrong");
            }
        })
        .catch(function(err) {
            console.error("Answer error:", err);
            showToast("Network error submitting answer.", "wrong");
        });
}

// Skip button
function Skip() {
    let sessions = getSession();
    fetch("https://codecyprus.org/th/api/skip?session=" + sessions)
        .then(function(response) { return response.json(); })
        .then(function(jsonObject) {
            console.log(jsonObject);
            showToast("Question skipped.", "info");
            if (jsonObject['status'] === "OK") {
                getquestion();
            }
        })
        .catch(function(err) {
            console.error("Skip error:", err);
            showToast("Network error skipping question.", "wrong");
        });
}

// Score
function getscore() {
    let sessions = getSession();
    fetch("https://codecyprus.org/th/api/score?session=" + sessions)
        .then(function(response) { return response.json(); })
        .then(function(jsonObject) {
            console.log("Score:", jsonObject);
            if (jsonObject['status'] === "OK" && jsonObject.hasOwnProperty("score")) {
                let el = document.getElementById("Displayscore");
                if (el) el.textContent = jsonObject['score'];
            }
        })
        .catch(function(err) {
            console.error("Error fetching score:", err);
        });
}

// Periodic location update every 2 minute
setInterval(function() {
    if (getSession()) getLocationSilent();
}, 2 * 60 * 1000);

// Init
window.onload = function () {
    getquestion();
    getscore();
    startTimer();
};