const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const app = express();


// =====================================================
// BASIC SETTINGS
// =====================================================

const PORT = process.env.PORT || 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =====================================================
// SESSION
// =====================================================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "cricket-records-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            maxAge: 30 * 60 * 1000
        }
    })
);


// =====================================================
// STATIC FILES
// =====================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// =====================================================
// ROUTES
// =====================================================

const teamsRouter =
    require("./routes/teams");

const cupsRouter =
    require("./routes/cups");

const seriesRouter =
    require("./routes/series");

const matchesRouter =
    require("./routes/matches");

const biodataRouter =
    require("./routes/biodata");

const adminRouter =
    require("./routes/admin");


// =====================================================
// API ROUTES
// =====================================================

app.use(
    "/api/teams",
    teamsRouter
);

app.use(
    "/api/cups",
    cupsRouter
);

app.use(
    "/api/series",
    seriesRouter
);

app.use(
    "/api/matches",
    matchesRouter
);

app.use(
    "/api/biodata",
    biodataRouter
);

app.use(
    "/api/admin",
    adminRouter
);


// =====================================================
// ADMIN LOGIN CHECK
// =====================================================

function requireAdmin(req, res, next) {

    if (!req.session.adminId) {

        return res.redirect(
            "/admin-login"
        );

    }

    next();

}


// =====================================================
// HOME PAGE
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "views",
            "index.html"
        )
    );

});


// =====================================================
// ADMIN LOGIN PAGE
// =====================================================

app.get(
    "/admin-login",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "admin-login.html"
            )
        );

    }
);


// =====================================================
// ADMIN DASHBOARD
// =====================================================

app.get(
    "/admin-dashboard",
    requireAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "admin-dashboard.html"
            )
        );

    }
);


// =====================================================
// CUP MANAGEMENT
// =====================================================

app.get(
    "/cup-management",
    requireAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "cup-management.html"
            )
        );

    }
);


// =====================================================
// SERIES MANAGEMENT
// =====================================================

app.get(
    "/series-management",
    requireAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "series-management.html"
            )
        );

    }
);


// =====================================================
// MATCH MANAGEMENT
// =====================================================

app.get(
    "/match-management",
    requireAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "match-management.html"
            )
        );

    }
);


// =====================================================
// BIODATA MANAGEMENT
// =====================================================

app.get(
    "/biodata-management",
    requireAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "biodata-management.html"
            )
        );

    }
);


// =====================================================
// ADMIN ACCOUNT
// =====================================================

app.get(
    "/admin-account",
    requireAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "admin-account.html"
            )
        );

    }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Cricket Records server running at http://localhost:${PORT}`
        );

    }
);