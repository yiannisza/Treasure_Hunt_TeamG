function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

let sessions=getCookie("SES");
//code to for 30min timer
let timeInterval;
let remainingTime=30*60;

function updatetime(){
    const seconds=remainingTime%60;
    const minutes=Math.floor(remainingTime/60);
    const timer=document.querySelector('.timer');
    timer.textContent=`${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    if (remainingTime <= 0) {
        clearInterval(timeInterval);
        timer.textContent = "Time's up!";
    } else {
        remainingTime--; // Decrease time every second
    }
}

function startTimer(){
    if(timeInterval){
        clearInterval(timeInterval);
    }
    remainingTime=30*60;
    updatetime();
    timeInterval=setInterval(updatetime,1000)
}



function getquestion() {
    fetch("https://codecyprus.org/th/api/question?session=" + sessions)

        .then(response => response.json()) //Parse JSON text to JavaScript object
        .then(jsonObject => {
            console.log(jsonObject);
            document.getElementById("skip").innerHTML = '<input type="button" value="Skip" onClick="Skip()"/>';
            document.getElementById("location").innerHTML = '<p id="text">Wait 30 seconds before pressing this button again.</p>'+'<input type="button" value="Get Location" onClick="getLocation()"/>';
            if(jsonObject.completed==true){
                window.location.assign("leaderboard.html");
            }
            if (jsonObject.canBeSkipped== true) {
                document.getElementById("skip").style.display="block";

            }else{document.getElementById("skip").style.display="none";}
            if (jsonObject.requiresLocation== true) {
                document.getElementById("location").style.display="block";

            }else{document.getElementById("location").style.display="none";}

            if (jsonObject.questionType == "INTEGER") {
                document.getElementById("question").innerHTML = jsonObject.questionText;
                document.getElementById("options").innerHTML = '';
                document.getElementById("options").innerHTML += '<input type="text" id="answer">';
                document.getElementById("options").innerHTML += '<input type="button" value="Answer" onclick="Answer(answer.value)"/>';

            } else if (jsonObject.questionType == "BOOLEAN") {
                document.getElementById("question").innerHTML = jsonObject.questionText;
                document.getElementById("options").innerHTML = '';
                document.getElementById("options").innerHTML += '<input type="button" id="answer" value="True" onclick="Answer(value)"/>';
                document.getElementById("options").innerHTML += '<input type="button" id="answer" value="False" onclick="Answer(value)"/>';


            } else if (jsonObject.questionType == "NUMERIC") {
                document.getElementById("question").innerHTML = jsonObject.questionText;
                document.getElementById("options").innerHTML = '';
                document.getElementById("options").innerHTML += '<input type="text" id="answer">';
                document.getElementById("options").innerHTML += '<input type="button" value="Answer" onclick="Answer(answer.value)"/>';
            } else if (jsonObject.questionType == "MCQ") {
                document.getElementById("question").innerHTML = jsonObject.questionText;
                document.getElementById("options").innerHTML = '';
                document.getElementById("options").innerHTML += '<input type="button" id="answer" value="A" onclick="Answer(value)"/>';
                document.getElementById("options").innerHTML += '<input type="button" id="answer" value="B" onclick="Answer(value)"/>';
                document.getElementById("options").innerHTML += '<input type="button" id="answer" value="C" onclick="Answer(value)"/>';
                document.getElementById("options").innerHTML += '<input type="button" id="answer" value="D" onclick="Answer(value)"/>';


            } else if (jsonObject.questionType == "TEXT") {
                document.getElementById("question").innerHTML = jsonObject.questionText;
                document.getElementById("options").innerHTML = '';
                document.getElementById("options").innerHTML += '<input type="text" id="answer">';
                document.getElementById("options").innerHTML += '<input type="button" value="Answer" onclick="Answer(answer.value)"/>';
            }
            if(jsonObject.requiresLocation==true) {
                getLocation();
            }
        });
}
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);}
    else {
        alert("Geolocation is not supported by your browser.");}

    function showPosition(position) {
        alert("Latitude: " + position.coords.latitude + ",Longitude: " +
            position.coords.longitude);

        fetch("https://codecyprus.org/th/api/location?session="+ sessions +"&latitude="+position.coords.latitude+"&longitude="+position.coords.longitude)
            .then(response => response.json()) //Parse JSON text to JavaScript object
            .then(jsonObject => {
                console.log(jsonObject);
            });

    }



}
function Answer(ans) {
    fetch("https://codecyprus.org/th/api/answer?session=" + sessions + "&answer=" + ans)
        .then(response => response.json()) //Parse JSON text to JavaScript object
        .then(jsonObject => {
            console.log(jsonObject);
            if(ans==""){
                alert(jsonObject.errorMessages);
            }
            else if(jsonObject.correct==false){
                alert(jsonObject.message);
            }
            else if(jsonObject.correct==true){
                alert(jsonObject.message);
                getquestion();
                getscore();
            }



        })
}
function Skip(){
    fetch("https://codecyprus.org/th/api/skip?session="+sessions)
        .then(response => response.json()) //Parse JSON text to JavaScript object
        .then(jsonObject => {
            console.log(jsonObject);
            alert("Question skipped.");
            if(jsonObject.status=="OK"){

                getquestion();}


        })

}
function setCookie(cookieName, cookieValue, expireDays) {
    let date = new Date();
    date.setTime(date.getTime() + (expireDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + date.toUTCString();
    document.cookie = cookieName + "=" + cookieValue + ";" + expires + ";path=/";
}

async function getscore() {
    let sessions = getCookie("SES");
    console.log(sessions);
    try {
        const response = await fetch("https://codecyprus.org/th/api/score?session=" + sessions);
        const jsonObject = await response.json();
        console.log(jsonObject);
        if (jsonObject.status === "OK" && jsonObject.hasOwnProperty("score")) {
            document.getElementById('Displayscore').textContent = jsonObject.score;
            console.log("Score updated:", jsonObject.score);
        }
    }
    catch(error)
    {
        console.error("Error fetching the score:", error);
        document.getElementById("Displayscore").textContent = "Error";
    }

}

window.onload = function () {
    getquestion();
    getscore();
    startTimer();
};