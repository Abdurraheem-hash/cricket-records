const express = require("express");
const router = express.Router();
const db = require("../db");

// =================================================
// GET ALL CUPS
// =================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT *
        FROM cups
        ORDER BY cup_number ASC
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


// =================================================
// GET ONE CUP
// =================================================

router.get("/:id", (req, res) => {

    const sql = `
        SELECT *
        FROM cups
        WHERE id = ?
    `;

    db.query(sql, [req.params.id], (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Cup not found"
            });
        }

        res.json(results[0]);

    });

});


// =================================================
// CREATE NEW CUP
// =================================================

router.post("/", (req, res) => {

    const { cup_name } = req.body;

    if (!cup_name || !cup_name.trim()) {

        return res.status(400).json({
            error: "Cup name is required"
        });

    }


    // Find the next cup number

    const numberSql = `
        SELECT COALESCE(MAX(cup_number), 0) + 1 AS next_number
        FROM cups
    `;


    db.query(numberSql, (err, results) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });

        }


        const cupNumber =
            results[0].next_number;


        // Insert new cup

        const insertSql = `
            INSERT INTO cups
            (cup_number, cup_name)
            VALUES (?, ?)
        `;


        db.query(
            insertSql,
            [
                cupNumber,
                cup_name.trim()
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }


                res.json({

                    message:
                        "Cup created successfully",

                    id: result.insertId,

                    cup_number: cupNumber,

                    cup_name: cup_name.trim()

                });

            }
        );

    });

});


// =================================================
// UPDATE CUP
// =================================================

router.put("/:id", (req, res) => {

    const {
        cup_name,
        team_a_series_wins,
        team_b_series_wins,
        winner,
        completed
    } = req.body;


    const sql = `
        UPDATE cups
        SET
            cup_name = ?,
            team_a_series_wins = ?,
            team_b_series_wins = ?,
            winner = ?,
            completed = ?
        WHERE id = ?
    `;


    db.query(
        sql,
        [
            cup_name,
            team_a_series_wins || 0,
            team_b_series_wins || 0,
            winner || null,
            completed || false,
            req.params.id
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            res.json({
                message:
                    "Cup updated successfully"
            });

        }
    );

});


// =================================================
// DELETE CUP
// =================================================

router.delete("/:id", (req, res) => {

    const sql =
        "DELETE FROM cups WHERE id = ?";


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
                message:
                    "Cup deleted successfully"
            });

        }
    );

});


module.exports = router;