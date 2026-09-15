const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = require("../db");


// =====================================================
// GET ADMIN ACCOUNT
// =====================================================

router.get("/", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT
                id,
                username,
                security_question
            FROM admin
            ORDER BY id ASC
            LIMIT 1
        `);

        res.json(result.rows);

    } catch (error) {

        console.error("Get admin error:", error);

        res.status(500).json({
            error: error.message
        });

    }

});


// =====================================================
// CREATE ADMIN ACCOUNT
// =====================================================

router.post("/", async (req, res) => {

    const {
        username,
        password,
        security_question,
        security_answer
    } = req.body;


    if (!username || !username.trim() || !password) {

        return res.status(400).json({
            error: "Username and password are required"
        });

    }


    try {

        const hashedPassword =
            await bcrypt.hash(password, 12);


        const result = await db.query(`
            INSERT INTO admin
            (
                username,
                password,
                security_question,
                security_answer
            )
            VALUES
            ($1, $2, $3, $4)
            RETURNING id
        `, [
            username.trim(),
            hashedPassword,
            security_question || null,
            security_answer || null
        ]);


        res.status(201).json({

            message:
                "Admin account created successfully",

            id:
                result.rows[0].id

        });

    } catch (error) {

        console.error("Create admin error:", error);

        res.status(500).json({
            error: error.message
        });

    }

});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    const {
        username,
        password
    } = req.body;


    if (!username || !password) {

        return res.status(400).json({
            error: "Username and password are required"
        });

    }


    try {

        const result = await db.query(`
            SELECT *
            FROM admin
            WHERE username = $1
            LIMIT 1
        `, [
            username.trim()
        ]);


        if (result.rows.length === 0) {

            return res.status(401).json({
                error: "Invalid username or password"
            });

        }


        const admin =
            result.rows[0];


        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                error: "Invalid username or password"
            });

        }


        req.session.adminId =
            admin.id;

        req.session.username =
            admin.username;


        res.json({
            message: "Login successful"
        });


    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            error: "Login failed"
        });

    }

});


// =====================================================
// CHECK LOGIN
// =====================================================

router.get("/session", (req, res) => {

    if (!req.session.adminId) {

        return res.status(401).json({
            loggedIn: false
        });

    }


    res.json({

        loggedIn: true,

        username:
            req.session.username

    });

});


// =====================================================
// LOGOUT
// =====================================================

router.post("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

            console.error(
                "Logout error:",
                err
            );

            return res.status(500).json({
                error: "Logout failed"
            });

        }


        res.json({
            message: "Logged out successfully"
        });

    });

});


// =====================================================
// UPDATE ADMIN ACCOUNT
// =====================================================

router.put("/:id", async (req, res) => {

    const {
        username,
        password,
        security_question,
        security_answer
    } = req.body;


    if (!username || !username.trim()) {

        return res.status(400).json({
            error: "Username is required"
        });

    }


    try {

        let result;


        // -------------------------------------------------
        // UPDATE WITH PASSWORD
        // -------------------------------------------------

        if (password) {

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    12
                );


            result = await db.query(`
                UPDATE admin
                SET
                    username = $1,
                    password = $2,
                    security_question = $3,
                    security_answer = $4
                WHERE id = $5
                RETURNING id, username
            `, [

                username.trim(),

                hashedPassword,

                security_question || null,

                security_answer || null,

                req.params.id

            ]);

        }


        // -------------------------------------------------
        // UPDATE WITHOUT PASSWORD
        // -------------------------------------------------

        else {

            result = await db.query(`
                UPDATE admin
                SET
                    username = $1,
                    security_question = $2,
                    security_answer = $3
                WHERE id = $4
                RETURNING id, username
            `, [

                username.trim(),

                security_question || null,

                security_answer || null,

                req.params.id

            ]);

        }


        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Admin account not found"
            });

        }


        // Keep current session username updated
        if (
            req.session.adminId &&
            Number(req.session.adminId) ===
            Number(req.params.id)
        ) {

            req.session.username =
                result.rows[0].username;

        }


        res.json({

            message:
                "Admin account updated successfully",

            admin:
                result.rows[0]

        });

    } catch (error) {

        console.error(
            "Update admin error:",
            error
        );

        res.status(500).json({
            error: error.message
        });

    }

});


// =====================================================
// DELETE ADMIN ACCOUNT
// =====================================================

router.delete("/:id", async (req, res) => {

    try {

        // Do not allow deleting the currently
        // logged-in admin account.

        if (
            req.session.adminId &&
            Number(req.session.adminId) ===
            Number(req.params.id)
        ) {

            return res.status(400).json({
                error:
                    "You cannot delete the currently logged-in admin account."
            });

        }


        const result = await db.query(`
            DELETE FROM admin
            WHERE id = $1
            RETURNING id
        `, [
            req.params.id
        ]);


        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Admin account not found"
            });

        }


        res.json({

            message:
                "Admin account deleted successfully"

        });

    } catch (error) {

        console.error(
            "Delete admin error:",
            error
        );

        res.status(500).json({
            error: error.message
        });

    }

});


module.exports = router;