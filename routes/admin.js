const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = require("../db");


// =====================================================
// GET ADMIN ACCOUNT
// =====================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT id, username, security_question
        FROM admin
        LIMIT 1
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

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


    if (!username || !password) {

        return res.status(400).json({
            error: "Username and password are required"
        });

    }


    try {

        const hashedPassword =
            await bcrypt.hash(password, 12);


        const sql = `
            INSERT INTO admin
            (
                username,
                password,
                security_question,
                security_answer
            )
            VALUES (?, ?, ?, ?)
        `;


        db.query(
            sql,
            [
                username,
                hashedPassword,
                security_question || null,
                security_answer || null
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }


                res.json({
                    message: "Admin account created successfully",
                    id: result.insertId
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            error: "Unable to create admin account"
        });

    }

});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", (req, res) => {

    const {
        username,
        password
    } = req.body;


    if (!username || !password) {

        return res.status(400).json({
            error: "Username and password are required"
        });

    }


    const sql = `
        SELECT *
        FROM admin
        WHERE username = ?
        LIMIT 1
    `;


    db.query(
        sql,
        [username],
        async (err, results) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            if (results.length === 0) {

                return res.status(401).json({
                    error: "Invalid username or password"
                });

            }


            const admin = results[0];


            try {

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

                res.status(500).json({
                    error: "Login failed"
                });

            }

        }
    );

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
        username: req.session.username
    });

});


// =====================================================
// LOGOUT
// =====================================================

router.post("/logout", (req, res) => {

    req.session.destroy((err) => {

        if (err) {

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


    try {

        let sql;
        let values;


        if (password) {

            const hashedPassword =
                await bcrypt.hash(password, 12);


            sql = `
                UPDATE admin
                SET
                    username = ?,
                    password = ?,
                    security_question = ?,
                    security_answer = ?
                WHERE id = ?
            `;


            values = [
                username,
                hashedPassword,
                security_question || null,
                security_answer || null,
                req.params.id
            ];

        } else {

            sql = `
                UPDATE admin
                SET
                    username = ?,
                    security_question = ?,
                    security_answer = ?
                WHERE id = ?
            `;


            values = [
                username,
                security_question || null,
                security_answer || null,
                req.params.id
            ];

        }


        db.query(
            sql,
            values,
            (err) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }


                res.json({
                    message: "Admin account updated successfully"
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            error: "Unable to update admin account"
        });

    }

});


// =====================================================
// DELETE ADMIN ACCOUNT
// =====================================================

router.delete("/:id", (req, res) => {

    const sql =
        "DELETE FROM admin WHERE id = ?";


    db.query(
        sql,
        [req.params.id],
        (err) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            res.json({
                message: "Admin account deleted successfully"
            });

        }
    );

});


module.exports = router;