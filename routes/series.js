const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all series
router.get("/", (req, res) => {
    const sql = `
        SELECT 
            series.id,
            series.series_number,
            series.team_a_wins,
            series.team_b_wins,
            series.winner,
            series.completed,
            cups.cup_name
        FROM series
        LEFT JOIN cups ON series.cup_id = cups.id
        ORDER BY series.id DESC
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

// Get one series
router.get("/:id", (req, res) => {
    const sql = `
        SELECT 
            series.id,
            series.series_number,
            series.team_a_wins,
            series.team_b_wins,
            series.winner,
            series.completed,
            cups.cup_name
        FROM series
        LEFT JOIN cups ON series.cup_id = cups.id
        WHERE series.id = ?
    `;

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Series not found"
            });
        }

        res.json(results[0]);
    });
});

// Create a new series
router.post("/", (req, res) => {
    const {
        cup_id,
        series_number
    } = req.body;

    if (!cup_id || !series_number) {
        return res.status(400).json({
            error: "Cup ID and series number are required"
        });
    }

    const sql = `
        INSERT INTO series
        (cup_id, series_number)
        VALUES (?, ?)
    `;

    db.query(sql, [cup_id, series_number], (err, result) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            message: "Series created successfully",
            id: result.insertId
        });
    });
});

// Update series
router.put("/:id", (req, res) => {
    const {
        team_a_wins,
        team_b_wins,
        winner,
        completed
    } = req.body;

    const sql = `
        UPDATE series
        SET
            team_a_wins = ?,
            team_b_wins = ?,
            winner = ?,
            completed = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            team_a_wins || 0,
            team_b_wins || 0,
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
                message: "Series updated successfully"
            });
        }
    );
});

// Delete series
router.delete("/:id", (req, res) => {
    const sql = "DELETE FROM series WHERE id = ?";

    db.query(sql, [req.params.id], (err) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            message: "Series deleted successfully"
        });
    });
});

module.exports = router;