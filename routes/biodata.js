const express = require("express");
const router = express.Router();
const db = require("../db");


// ============================================================
// GET ALL PLAYERS
// ============================================================

router.get("/", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM biodata
            ORDER BY name ASC
        `);

        res.json(result.rows);

    } catch (error) {

        console.error("Get biodata error:", error);

        res.status(500).json({
            error: error.message
        });

    }

});



// ============================================================
// GET ONE PLAYER
// ============================================================

router.get("/:id", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT *
            FROM biodata
            WHERE id = $1
        `, [
            req.params.id
        ]);


        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Player not found"
            });

        }


        res.json(result.rows[0]);

    } catch (error) {

        console.error("Get player error:", error);

        res.status(500).json({
            error: error.message
        });

    }

});



// ============================================================
// ADD PLAYER
// ============================================================

router.post("/", async (req, res) => {

    const {
        name,
        photo,
        role,
        biography
    } = req.body;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!name || !name.trim() || !role || !role.trim()) {

        return res.status(400).json({
            error: "Name and role are required"
        });

    }


    try {

        const result = await db.query(`
            INSERT INTO biodata
            (
                name,
                photo,
                role,
                biography
            )
            VALUES
            ($1, $2, $3, $4)
            RETURNING id
        `, [
            name.trim(),
            photo || null,
            role.trim(),
            biography || null
        ]);


        res.status(201).json({

            message:
                "Player added successfully",

            id:
                result.rows[0].id

        });

    } catch (error) {

        console.error("Add player error:", error);

        res.status(500).json({
            error: error.message
        });

    }

});



// ============================================================
// UPDATE PLAYER
// ============================================================

router.put("/:id", async (req, res) => {

    const {
        name,
        photo,
        role,
        biography
    } = req.body;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!name || !name.trim() || !role || !role.trim()) {

        return res.status(400).json({
            error: "Name and role are required"
        });

    }


    try {

        const result = await db.query(`
            UPDATE biodata
            SET
                name = $1,
                photo = $2,
                role = $3,
                biography = $4
            WHERE id = $5
            RETURNING id
        `, [
            name.trim(),
            photo || null,
            role.trim(),
            biography || null,
            req.params.id
        ]);


        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Player not found"
            });

        }


        res.json({

            message:
                "Player updated successfully"

        });

    } catch (error) {

        console.error("Update player error:", error);

        res.status(500).json({
            error: error.message
        });

    }

});



// ============================================================
// DELETE PLAYER
// ============================================================

router.delete("/:id", async (req, res) => {

    try {

        const result = await db.query(`
            DELETE FROM biodata
            WHERE id = $1
            RETURNING id
        `, [
            req.params.id
        ]);


        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Player not found"
            });

        }


        res.json({

            message:
                "Player deleted successfully"

        });

    } catch (error) {

        console.error("Delete player error:", error);

        res.status(500).json({
            error: error.message
        });

    }

});



module.exports = router;