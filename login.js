console.log("login.js est chargé");


const loginForm = document.getElementById("loginForm");



function login(event) {

    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("/login", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {

        if (data.success) {
            window.location.href = "/bulles.html";
        } else {
            alert(data.message);
        }

    });
    }

loginForm.addEventListener("submit", login);
