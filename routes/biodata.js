const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all players
router.get("/", (req, res) => {
    const sql = `
        SELECT *
        FROM biodata
        ORDER BY name ASC
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

// Get one player
router.get("/:id", (req, res) => {
    const sql = `
        SELECT *
        FROM biodata
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
                error: "Player not found"
            });
        }

        res.json(results[0]);
    });
});

// Add player
router.post("/", (req, res) => {
    const {
        name,
        photo,
        role,
        biography
    } = req.body;

    if (!name || !role) {
        return res.status(400).json({
            error: "Name and role are required"
        });
    }

    const sql = `
        INSERT INTO biodata
        (name, photo, role, biography)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            photo || null,
            role,
            biography || null
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Player added successfully",
                id: result.insertId
            });
        }
    );
});

// Update player
router.put("/:id", (req, res) => {
    const {
        name,
        photo,
        role,
        biography
    } = req.body;

    if (!name || !role) {
        return res.status(400).json({
            error: "Name and role are required"
        });
    }

    const sql = `
        UPDATE biodata
        SET
            name = ?,
            photo = ?,
            role = ?,
            biography = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name,
            photo || null,
            role,
            biography || null,
            req.params.id
        ],
        (err) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Player updated successfully"
            });
        }
    );
});

// Delete player
router.delete("/:id", (req, res) => {
    const sql = "DELETE FROM biodata WHERE id = ?";

    db.query(sql, [req.params.id], (err) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json({
            message: "Player deleted successfully"
        });
    });
});

module.exports = router;