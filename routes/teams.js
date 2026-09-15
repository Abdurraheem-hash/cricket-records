const express = require("express");

const router = express.Router();

const db = require("../db");


// =====================================================
// GET ALL TEAMS
// =====================================================

router.get("/", async (req, res) => {

    try {

        const result = await db.query(`
            SELECT id, team_name
            FROM teams
            ORDER BY id ASC
        `);

        res.json(result.rows);

    } catch (error) {

        console.error("Get teams error:", error);

        res.status(500).json({
            error: "Unable to load teams."
        });

    }

});


// =====================================================
// UPDATE TEAM NAME
// =====================================================

router.put("/:id", async (req, res) => {

    const teamId = req.params.id;

    const { team_name } = req.body;


    if (!team_name || !team_name.trim()) {

        return res.status(400).json({
            error: "Team name is required."
        });

    }


    const newTeamName = team_name.trim();


    try {

        // ---------------------------------------------
        // Get old team name
        // ---------------------------------------------

        const oldTeamResult = await db.query(
            `
            SELECT team_name
            FROM teams
            WHERE id = $1
            `,
            [teamId]
        );


        if (oldTeamResult.rows.length === 0) {

            return res.status(404).json({
                error: "Team not found."
            });

        }


        const oldTeamName =
            oldTeamResult.rows[0].team_name;


        // ---------------------------------------------
        // Check duplicate team name
        // ---------------------------------------------

        const duplicateResult = await db.query(
            `
            SELECT id
            FROM teams
            WHERE LOWER(team_name) = LOWER($1)
            AND id <> $2
            `,
            [
                newTeamName,
                teamId
            ]
        );


        if (duplicateResult.rows.length > 0) {

            return res.status(400).json({
                error: "That team name is already being used."
            });

        }


        // ---------------------------------------------
        // Update team
        // ---------------------------------------------

        await db.query(
            `
            UPDATE teams
            SET team_name = $1
            WHERE id = $2
            `,
            [
                newTeamName,
                teamId
            ]
        );


        // ---------------------------------------------
        // Update old records
        //
        // This is important because your existing
        // tables store winner names as text.
        // ---------------------------------------------

        await db.query(
            `
            UPDATE matches
            SET winner = $1
            WHERE winner = $2
            `,
            [
                newTeamName,
                oldTeamName
            ]
        );


        await db.query(
            `
            UPDATE series
            SET winner = $1
            WHERE winner = $2
            `,
            [
                newTeamName,
                oldTeamName
            ]
        );


        await db.query(
            `
            UPDATE cups
            SET winner = $1
            WHERE winner = $2
            `,
            [
                newTeamName,
                oldTeamName
            ]
        );


        // ---------------------------------------------
        // Success
        // ---------------------------------------------

        res.json({

            message:
                "Team name updated successfully.",

            oldName:
                oldTeamName,

            newName:
                newTeamName

        });


    } catch (error) {

        console.error(
            "Update team error:",
            error
        );


        res.status(500).json({
            error: "Unable to update team name."
        });

    }

});


// =====================================================
// ADD TEAM
// =====================================================

router.post("/", async (req, res) => {

    const { team_name } = req.body;


    if (!team_name || !team_name.trim()) {

        return res.status(400).json({
            error: "Team name is required."
        });

    }


    try {

        const result = await db.query(
            `
            INSERT INTO teams (team_name)
            VALUES ($1)
            RETURNING id, team_name
            `,
            [
                team_name.trim()
            ]
        );


        res.status(201).json({

            message:
                "Team added successfully.",

            team:
                result.rows[0]

        });


    } catch (error) {

        console.error(
            "Add team error:",
            error
        );


        res.status(500).json({
            error: "Unable to add team."
        });

    }

});


// =====================================================
// DELETE TEAM
// =====================================================

router.delete("/:id", async (req, res) => {

    const teamId = req.params.id;


    try {

        const result = await db.query(
            `
            DELETE FROM teams
            WHERE id = $1
            RETURNING id
            `,
            [
                teamId
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "Team not found."
            });

        }


        res.json({

            message:
                "Team deleted successfully."

        });


    } catch (error) {

        console.error(
            "Delete team error:",
            error
        );


        res.status(500).json({
            error: "Unable to delete team."
        });

    }

});


module.exports = router;