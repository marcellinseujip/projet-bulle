require("dotenv").config();

//console.log("SESSION_SECRET existe :", !!process.env.SESSION_SECRET);

const express = require("express");

const {Pool} = require("pg");

const bcrypt = require("bcrypt");

const session = require("express-session");


// on ajoute le hash
/*bcrypt.hash("1234", 10, function (error, hash) {

    if (error) {
        console.log("Erreur bcrypt :", error);
        return;
    }

    pool.query(
        "UPDATE users SET password = $1 WHERE username = $2",
        [hash, "testuser"],
        function (error, result) {

            if (error) {
                console.log("Erreur SQL :", error);
            } else {
                console.log("Mot de passe sécurisé enregistré");
            }

        }
    );

});*/

const app = express();

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});
pool.query("SELECT NOW()", function (error, result) {

    if (error) {
        console.log("Erreur de connexion à PostgreSQL :", error);
    } else {
        console.log("Connexion à PostgreSQL réussie");
        console.log(result.rows);
    }

});

app.get("/bulles.html", function (req, res) {

    if (!req.session.userId) {
        return res.redirect("/");
    }

    res.sendFile(__dirname + "/bulles.html");
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

app.get("/", function (req, res) {
   // res.sendFile(__dirname + "/index.html");

   app.use(express.static(__dirname, {
    index: false,
    extensions: false
}));
});

app.post("/login", function (req, res) {

    //console.log("BODY REÇU :", req.body);

    const username = req.body.username;
    const password = req.body.password;

    pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username],
        function (error, result) {

            if (error) {
                console.log("Erreur SQL :", error);
                return;
            }

            //console.log(result.rows);
            if (result.rows.length === 0) {
                return res.json({
                    success: false,
                    message: "Nom d'utilisateur ou mot de passe incorrect"
                });
            }

        const user = result.rows[0];

        bcrypt.compare(password, user.password, function (error, passwordCorrect) {

            if (error) {
                console.log("Erreur bcrypt :", error);
                return;
            }

            if (passwordCorrect) {

                req.session.userId = user.id;
                req.session.username = user.username;

                res.json({
                    success: true,
                    message: "Connexion réussie"
                });

            } else {
                res.json({
                    success: false,
                    message: "Nom d'utilisateur ou mot de passe incorrect"
                });
            }

        });
        }
    );

});

app.get("/session", function (req, res) {

     console.log("ROUTE SESSION APPELÉE");

    res.json({
        userId: req.session.userId,
        username: req.session.username
    });

});

app.post("/logout", function (req, res) {

    req.session.destroy(function (error) {

        if (error) {
            return res.json({
                success: false,
                message: "Erreur lors de la déconnexion"
            });
        }

        res.json({
            success: true
        });

    });

});

app.listen(PORT, function () {
    console.log("Serveur démarré sur le port " + PORT);
});
