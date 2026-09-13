const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;


// =========================================
// DATABASE
// =========================================

const db = require("./db");


// =========================================
// MIDDLEWARE
// =========================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =========================================
// SESSION
// =========================================

app.use(
    session({
        secret: "cricket-records-secret-key",

        resave: false,

        saveUninitialized: false,

        cookie: {
            maxAge: 30 * 60 * 1000
        }
    })
);


// =========================================
// PUBLIC FOLDER
// =========================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// =========================================
// VISITOR HOME PAGE
// =========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "index.html"
        )
    );

});


// =========================================
// ADMIN LOGIN PAGE
// =========================================

app.get("/admin-login", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "admin-login.html"
        )
    );

});


// =========================================
// ADMIN DASHBOARD
// =========================================

app.get("/admin-dashboard", (req, res) => {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin-login"
        );

    }

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "admin-dashboard.html"
        )
    );

});


// =========================================
// CUP MANAGEMENT
// =========================================

app.get("/cup-management", (req, res) => {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin-login"
        );

    }

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "cup-management.html"
        )
    );

});


// =========================================
// SERIES MANAGEMENT
// =========================================

app.get("/series-management", (req, res) => {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin-login"
        );

    }

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "series-management.html"
        )
    );

});


// =========================================
// MATCH MANAGEMENT
// =========================================

app.get("/match-management", (req, res) => {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin-login"
        );

    }

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "match-management.html"
        )
    );

});
     //----------------------------------//
     // BIODATA MANAGEMENT//
     //-----------------------------------//

    app.get("/biodata-management", (req, res) => {
    if (!req.session.adminId) {
        return res.redirect("/admin-login");
    }

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "biodata-management.html"
        )
    );
});


// =========================================
// TEAM SETTINGS
// =========================================

app.get("/team-settings", (req, res) => {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin-login"
        );

    }

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "team-settings.html"
        )
    );

});



// =========================================
// API ROUTES
// =========================================


// TEAMS

const teamsRoutes =
    require("./routes/teams");

app.use(
    "/api/teams",
    teamsRoutes
);


// CUPS

const cupsRoutes =
    require("./routes/cups");

app.use(
    "/api/cups",
    cupsRoutes
);


// SERIES

const seriesRoutes =
    require("./routes/series");

app.use(
    "/api/series",
    seriesRoutes
);


// MATCHES

const matchesRoutes =
    require("./routes/matches");

app.use(
    "/api/matches",
    matchesRoutes
);


// BIODATA

const biodataRoutes =
    require("./routes/biodata");

app.use(
    "/api/biodata",
    biodataRoutes
);


// ADMIN

const adminRoutes =
    require("./routes/admin");

app.use(
    "/api/admin",
    adminRoutes
);


// =========================================
// DATABASE TEST
// =========================================

app.get("/test-db", (req, res) => {

    db.query(
        "SELECT * FROM teams",

        (err, results) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json(results);

        }
    );

});


// =========================================
// START SERVER
// =========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Cricket Records server running at http://localhost:${PORT}`
        );

    }
);