const express = require("express");
const router = express.Router();
const db = require("../db");

// =================================================
// GET ALL CUPS
// =================================================

router.get("/", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT *
            FROM cups
            ORDER BY cup_number ASC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Get cups error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// GET ONE CUP
// =================================================

router.get("/:id", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT *
            FROM cups
            WHERE id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Cup not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Get cup error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// CREATE NEW CUP
// =================================================

router.post("/", async (req, res) => {

    const { cup_name } = req.body;

    if (!cup_name || !cup_name.trim()) {
        return res.status(400).json({
            error: "Cup name is required"
        });
    }

    try {

        // Find the next cup number
        const numberResult = await db.query(`
            SELECT COALESCE(MAX(cup_number), 0) + 1 AS next_number
            FROM cups
        `);

        const cupNumber = numberResult.rows[0].next_number;

        // Insert new cup
        const insertResult = await db.query(`
            INSERT INTO cups
            (cup_number, cup_name)
            VALUES ($1, $2)
            RETURNING id, cup_number, cup_name
        `, [
            cupNumber,
            cup_name.trim()
        ]);

        res.status(201).json({
            message: "Cup created successfully",
            ...insertResult.rows[0]
        });

    } catch (error) {

        console.error("Create cup error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// UPDATE CUP
// =================================================

router.put("/:id", async (req, res) => {

    const {
        cup_name,
        team_a_series_wins,
        team_b_series_wins,
        winner,
        completed
    } = req.body;

    try {

        const result = await db.query(`
            UPDATE cups
            SET
                cup_name = $1,
                team_a_series_wins = $2,
                team_b_series_wins = $3,
                winner = $4,
                completed = $5
            WHERE id = $6
            RETURNING *
        `, [
            cup_name,
            team_a_series_wins || 0,
            team_b_series_wins || 0,
            winner || null,
            completed || false,
            req.params.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Cup not found"
            });
        }

        res.json({
            message: "Cup updated successfully",
            cup: result.rows[0]
        });

    } catch (error) {

        console.error("Update cup error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// =================================================
// DELETE CUP
// =================================================

router.delete("/:id", async (req, res) => {

    try {

        const result = await db.query(`
            DELETE FROM cups
            WHERE id = $1
            RETURNING id
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Cup not found"
            });
        }

        res.json({
            message: "Cup deleted successfully"
        });

    } catch (error) {

        console.error("Delete cup error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


module.exports = router;