const express = require("express");
const router = express.Router();
const db = require("../db");

// =================================================
// GET ALL SERIES
// =================================================

router.get("/", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                series.id,
                series.series_number,
                series.team_a_wins,
                series.team_b_wins,
                series.winner,
                series.completed,
                series.cup_id,
                cups.cup_name
            FROM series
            LEFT JOIN cups
                ON series.cup_id = cups.id
            ORDER BY series.id DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Get series error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// GET ONE SERIES
// =================================================

router.get("/:id", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                series.id,
                series.series_number,
                series.team_a_wins,
                series.team_b_wins,
                series.winner,
                series.completed,
                series.cup_id,
                cups.cup_name
            FROM series
            LEFT JOIN cups
                ON series.cup_id = cups.id
            WHERE series.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Series not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Get series error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// CREATE NEW SERIES
// =================================================

router.post("/", async (req, res) => {

    const {
        cup_id,
        series_number
    } = req.body;

    if (!cup_id || !series_number) {
        return res.status(400).json({
            error: "Cup ID and series number are required"
        });
    }

    try {

        // Check whether cup exists
        const cupResult = await db.query(`
            SELECT id, completed
            FROM cups
            WHERE id = $1
        `, [cup_id]);

        if (cupResult.rows.length === 0) {
            return res.status(404).json({
                error: "Cup not found"
            });
        }

        // Do not allow new series in a completed cup
        if (cupResult.rows[0].completed === true) {
            return res.status(400).json({
                error: "This cup is already completed."
            });
        }

        // Create series
        const result = await db.query(`
            INSERT INTO series
            (
                cup_id,
                series_number,
                team_a_wins,
                team_b_wins,
                winner,
                completed
            )
            VALUES ($1, $2, 0, 0, NULL, false)
            RETURNING id, cup_id, series_number
        `, [
            cup_id,
            series_number
        ]);

        res.status(201).json({
            message: "Series created successfully",
            id: result.rows[0].id,
            cup_id: result.rows[0].cup_id,
            series_number: result.rows[0].series_number
        });

    } catch (error) {
        console.error("Create series error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// UPDATE SERIES
// =================================================

router.put("/:id", async (req, res) => {

    const {
        team_a_wins,
        team_b_wins,
        winner,
        completed
    } = req.body;

    try {

        const result = await db.query(`
            UPDATE series
            SET
                team_a_wins = $1,
                team_b_wins = $2,
                winner = $3,
                completed = $4
            WHERE id = $5
            RETURNING *
        `, [
            team_a_wins || 0,
            team_b_wins || 0,
            winner || null,
            completed || false,
            req.params.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Series not found"
            });
        }

        res.json({
            message: "Series updated successfully",
            series: result.rows[0]
        });

    } catch (error) {
        console.error("Update series error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// DELETE SERIES
// =================================================

router.delete("/:id", async (req, res) => {

    try {

        const result = await db.query(`
            DELETE FROM series
            WHERE id = $1
            RETURNING id
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Series not found"
            });
        }

        res.json({
            message: "Series deleted successfully"
        });

    } catch (error) {
        console.error("Delete series error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


module.exports = router;