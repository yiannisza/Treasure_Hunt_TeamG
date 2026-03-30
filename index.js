const TEST_API = "https://codecyprus.org/th/test-api/";
const MAIN_API = "https://codecyprus.org/th/api/";

// Turns data from the server into rows in our HTML table
function renderLeaderboard(data) {
    console.log("Raw leaderboard response:", data);

    let dateOpts = {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    let tableRows = "";

    let list = data['leaderboard'];
    console.log("Entries:", list);
    console.log("Total entries = " + list.length);

    // Loop through each player to build their table row
    for (let i = 0; i < list.length; i++) {
        let item = list[i];

        // Format the computer time into something people can read
        let d = new Date(item['completionTime']);
        let prettyDate = d.toLocaleDateString("en-UK", dateOpts);

        tableRows += "<tr>";
        tableRows += "<td>" + item['player'] + "</td>";
        tableRows += "<td>" + item['score'] + "</td>";
        tableRows += "<td>" + prettyDate + "</td>";
        tableRows += "</tr>";
    }

    let table = document.getElementById('test-results-table');

    // Add all the new rows to the table at once
    table.innerHTML += tableRows;
}


// Grabs the data from the API link provided
function fetchLeaderboard(apiUrl) {
    fetch(apiUrl, { method: "GET" })
        .then(res => res.json())
        .then(data => {
            renderLeaderboard(data);
        })
        .catch(err => {
            console.log("Something went wrong while fetching leaderboard:", err);
        });
}


let sessionId = "ag9nfmNvZGVjeXBydXNvcmdyFAsSB1Nlc3Npb24YgICA4OnngggM";

// Pulls the session ID from the URL bar
function readSessionFromUrl() {
    let currentUrl = new URL(window.location.href);
    return currentUrl.searchParams.get("session");
}

// Checks if we should use the test data or real data
function checkIfTestMode() {
    let currentUrl = new URL(window.location.href);
    return currentUrl.searchParams.get("test") != null;
}


// Decide which API to call based on the URL mode
if (checkIfTestMode()) {

    let endpoint = TEST_API + "leaderboard?size=20&sorted";
    fetchLeaderboard(endpoint);

} else {

    let s = readSessionFromUrl();

    let endpoint = MAIN_API + "leaderboard?sorted&session=" + s;

    if (!s) {
        console.warn("No session found in URL... leaderboard might not work properly");
    }

    fetchLeaderboard(endpoint);
}