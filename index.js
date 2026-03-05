const TH_TEST_API_URL = "https://codecyprus.org/th/test-api/"; // the test API base
const TH_API_URL = "https://codecyprus.org/th/api/"; // the API base url
function handleLeaderboard(leaderboard) {
    console.log(leaderboard);
    let options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        second: '2-digit' };
    let html = ""; // used to include HTML code for the table rows
    let leaderboardArray = leaderboard['leaderboard'];
    console.log("leaderboardArray", leaderboardArray);
    console.log("length: " + leaderboardArray.length);

    for(const entry of leaderboardArray) {
        let date = new Date(entry['completionTime']);
        let formattedDate = date.toLocaleDateString("en-UK", options);
        html += "<tr>" +
            "<td>" + entry['player'] + "</td>" +
            "<td>" + entry['score'] + "</td>" +
            "<td>" + formattedDate + "</td>" +
            "</tr>";
    }

    let leaderboardElement = document.getElementById('test-results-table'); // table
    leaderboardElement.innerHTML += html;
}
function getLeaderBoard(url) {

    fetch(url, { method: "GET" })
        .then(response => response.json())
        .then(json => handleLeaderboard(json));
}
let session = "ag9nfmNvZGVjeXBydXNvcmdyFAsSB1Nlc3Npb24YgICA4OnngggM";

function getSession() {
    let url = new URL(window.location.href);
    return url.searchParams.get("session");
}

function isTest() {
    let url = new URL(window.location.href);
    return url.searchParams.get("test") != null;
}

if(isTest()) {

    let url = TH_TEST_API_URL + "leaderboard?size=20&sorted";
    getLeaderBoard(url);
} else {

    let session = getSession();
    let url = TH_API_URL + "leaderboard?sorted&session=" + session; // form url
    getLeaderBoard(url);
}
/**
 * This is a function to access the /leaderboard at the specified URL
 */