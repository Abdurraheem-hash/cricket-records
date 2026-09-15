const express = require("express");
const router = express.Router();
const db = require("../db");


// ============================================================
// GET ALL MATCHES
// ============================================================

router.get("/", async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                matches.*,
                series.series_number,
                series.cup_id
            FROM matches
            JOIN series
                ON matches.series_id = series.id
            ORDER BY
                matches.series_id ASC,
                matches.match_number ASC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error("Get matches error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// ============================================================
// GET MATCHES OF ONE SERIES
// ============================================================

router.get("/series/:seriesId", async (req, res) => {

    const { seriesId } = req.params;

    try {
        const result = await db.query(`
            SELECT *
            FROM matches
            WHERE series_id = $1
            AND status = 'PLAYED'
            ORDER BY match_number ASC
        `, [seriesId]);

        res.json(result.rows);

    } catch (error) {
        console.error("Get series matches error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// ============================================================
// GET ONE MATCH
// ============================================================

router.get("/:id", async (req, res) => {

    const { id } = req.params;

    try {
        const result = await db.query(`
            SELECT *
            FROM matches
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Match not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Get match error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// ============================================================
// ADD MATCH
// ============================================================

router.post("/", async (req, res) => {

    const {
        series_id,
        match_number,
        winner,
        match_date
    } = req.body;


    // --------------------------------------------------------
    // CHECK SERIES
    // --------------------------------------------------------

    if (!series_id) {
        return res.status(400).json({
            error: "Series is required."
        });
    }


    const matchNo = Number(match_number);


    // --------------------------------------------------------
    // ONLY MATCH 1, 2 AND 3
    // --------------------------------------------------------

    if (![1, 2, 3].includes(matchNo)) {
        return res.status(400).json({
            error: "Match number must be 1, 2 or 3."
        });
    }


    try {

        // ----------------------------------------------------
        // GET CURRENT TEAM NAMES
        // ----------------------------------------------------

        const teamsResult = await db.query(`
            SELECT id, team_name
            FROM teams
            ORDER BY id ASC
            LIMIT 2
        `);


        if (teamsResult.rows.length < 2) {
            return res.status(400).json({
                error: "Two teams are required."
            });
        }


        const teamA = teamsResult.rows[0].team_name;
        const teamB = teamsResult.rows[1].team_name;


        // ----------------------------------------------------
        // CHECK WINNER
        // ----------------------------------------------------

        if (
            !winner ||
            (winner !== teamA && winner !== teamB)
        ) {
            return res.status(400).json({
                error: "Please select a valid team winner."
            });
        }


        // ----------------------------------------------------
        // GET SERIES
        // ----------------------------------------------------

        const seriesResult = await db.query(`
            SELECT *
            FROM series
            WHERE id = $1
        `, [series_id]);


        if (seriesResult.rows.length === 0) {
            return res.status(404).json({
                error: "Series not found."
            });
        }


        const series = seriesResult.rows[0];


        // ----------------------------------------------------
        // CHECK SERIES COMPLETION
        // ----------------------------------------------------

        if (series.completed === true) {
            return res.status(400).json({
                error: "This series is already completed."
            });
        }


        // ----------------------------------------------------
        // CHECK DUPLICATE MATCH
        // ----------------------------------------------------

        const duplicateResult = await db.query(`
            SELECT id
            FROM matches
            WHERE series_id = $1
            AND match_number = $2
        `, [
            series_id,
            matchNo
        ]);


        if (duplicateResult.rows.length > 0) {
            return res.status(400).json({
                error:
                    `Match ${matchNo} already exists for this series.`
            });
        }


        // ----------------------------------------------------
        // GET EXISTING PLAYED MATCHES
        // ----------------------------------------------------

        const existingResult = await db.query(`
            SELECT
                match_number,
                winner
            FROM matches
            WHERE series_id = $1
            AND status = 'PLAYED'
            ORDER BY match_number ASC
        `, [series_id]);


        const existingMatches = existingResult.rows;


        // ====================================================
        // MATCH 1
        // ====================================================

        if (matchNo === 1) {

            if (existingMatches.length > 0) {
                return res.status(400).json({
                    error: "Match 1 has already been played."
                });
            }
        }


        // ====================================================
        // MATCH 2
        // ====================================================

        if (matchNo === 2) {

            const match1 = existingMatches.find(
                match => Number(match.match_number) === 1
            );


            if (!match1) {
                return res.status(400).json({
                    error:
                        "Match 1 must be played before Match 2."
                });
            }


            // Match 2 is only needed when series is not already
            // completed. This is already checked above.
        }


        // ====================================================
        // MATCH 3
        // ====================================================

        if (matchNo === 3) {

            const match1 = existingMatches.find(
                match => Number(match.match_number) === 1
            );

            const match2 = existingMatches.find(
                match => Number(match.match_number) === 2
            );


            // Match 1 required
            if (!match1) {
                return res.status(400).json({
                    error:
                        "Match 1 must be played before Match 3."
                });
            }


            // Match 2 required
            if (!match2) {
                return res.status(400).json({
                    error:
                        "Match 2 must be played before Match 3."
                });
            }


            // Match 3 is only allowed when the first
            // two matches are split 1-1.
            if (match1.winner === match2.winner) {
                return res.status(400).json({
                    error:
                        "Match 3 is not required because the same team won Match 1 and Match 2."
                });
            }


            // If different teams won Match 1 and Match 2,
            // the series is exactly 1-1.
        }


        // ====================================================
        // INSERT MATCH
        // ====================================================

        const insertResult = await db.query(`
            INSERT INTO matches
            (
                series_id,
                match_number,
                winner,
                match_date,
                status
            )
            VALUES
            ($1, $2, $3, $4, 'PLAYED')
            RETURNING id
        `, [
            series_id,
            matchNo,
            winner,
            match_date || null
        ]);


        // ====================================================
        // RECALCULATE SERIES
        // ====================================================

        const updatedSeries = await updateSeriesAfterMatch(
            series_id,
            teamA,
            teamB
        );


        res.status(201).json({

            message: "Match saved successfully.",

            id: insertResult.rows[0].id,

            series: updatedSeries
        });


    } catch (error) {

        console.error("Add match error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// ============================================================
// UPDATE SERIES AFTER MATCH
// ============================================================

async function updateSeriesAfterMatch(
    seriesId,
    teamA,
    teamB
) {

    // --------------------------------------------------------
    // GET PLAYED MATCHES
    // --------------------------------------------------------

    const matchesResult = await db.query(`
        SELECT
            match_number,
            winner
        FROM matches
        WHERE series_id = $1
        AND status = 'PLAYED'
        ORDER BY match_number ASC
    `, [seriesId]);


    const matches = matchesResult.rows;


    let teamAWins = 0;
    let teamBWins = 0;


    // --------------------------------------------------------
    // COUNT WINS
    // --------------------------------------------------------

    matches.forEach(match => {

        if (match.winner === teamA) {
            teamAWins++;
        }

        if (match.winner === teamB) {
            teamBWins++;
        }
    });


    // --------------------------------------------------------
    // DETERMINE SERIES WINNER
    // --------------------------------------------------------

    let seriesWinner = null;
    let completed = false;


    if (teamAWins >= 2) {

        seriesWinner = teamA;
        completed = true;

    } else if (teamBWins >= 2) {

        seriesWinner = teamB;
        completed = true;
    }


    // --------------------------------------------------------
    // UPDATE SERIES
    // --------------------------------------------------------

    const updateResult = await db.query(`
        UPDATE series
        SET
            team_a_wins = $1,
            team_b_wins = $2,
            winner = $3,
            completed = $4
        WHERE id = $5
        RETURNING *
    `, [
        teamAWins,
        teamBWins,
        seriesWinner,
        completed,
        seriesId
    ]);


    if (updateResult.rows.length === 0) {
        throw new Error(
            "Series not found while updating."
        );
    }


    const updatedSeries = updateResult.rows[0];


    // --------------------------------------------------------
    // UPDATE CUP ONLY WHEN SERIES IS COMPLETED
    // --------------------------------------------------------

    if (completed) {

        await updateCupAfterSeries(
            updatedSeries.cup_id,
            teamA,
            teamB
        );
    }


    return updatedSeries;
}


// ============================================================
// UPDATE CUP AFTER SERIES
// ============================================================

async function updateCupAfterSeries(
    cupId,
    teamA,
    teamB
) {

    // --------------------------------------------------------
    // GET COMPLETED SERIES
    // --------------------------------------------------------

    const seriesResult = await db.query(`
        SELECT winner
        FROM series
        WHERE cup_id = $1
        AND completed = true
    `, [cupId]);


    let teamASeriesWins = 0;
    let teamBSeriesWins = 0;


    seriesResult.rows.forEach(series => {

        if (series.winner === teamA) {
            teamASeriesWins++;
        }

        if (series.winner === teamB) {
            teamBSeriesWins++;
        }
    });


    // --------------------------------------------------------
    // DETERMINE CUP WINNER
    // --------------------------------------------------------

    let cupWinner = null;
    let cupCompleted = false;


    if (teamASeriesWins >= 10) {

        cupWinner = teamA;
        cupCompleted = true;

    } else if (teamBSeriesWins >= 10) {

        cupWinner = teamB;
        cupCompleted = true;
    }


    // --------------------------------------------------------
    // UPDATE CUP
    // --------------------------------------------------------

    await db.query(`
        UPDATE cups
        SET
            team_a_series_wins = $1,
            team_b_series_wins = $2,
            winner = $3,
            completed = $4
        WHERE id = $5
    `, [
        teamASeriesWins,
        teamBSeriesWins,
        cupWinner,
        cupCompleted,
        cupId
    ]);
}


// ============================================================
// UPDATE MATCH
// ============================================================

router.put("/:id", async (req, res) => {

    const { id } = req.params;

    const {
        winner,
        match_date
    } = req.body;


    if (!winner) {
        return res.status(400).json({
            error: "Winner is required."
        });
    }


    try {

        // ----------------------------------------------------
        // GET MATCH
        // ----------------------------------------------------

        const matchResult = await db.query(`
            SELECT *
            FROM matches
            WHERE id = $1
        `, [id]);


        if (matchResult.rows.length === 0) {
            return res.status(404).json({
                error: "Match not found."
            });
        }


        const match = matchResult.rows[0];


        // ----------------------------------------------------
        // GET TEAM NAMES
        // ----------------------------------------------------

        const teamsResult = await db.query(`
            SELECT team_name
            FROM teams
            ORDER BY id ASC
            LIMIT 2
        `);


        if (teamsResult.rows.length < 2) {
            return res.status(400).json({
                error: "Two teams are required."
            });
        }


        const teamA = teamsResult.rows[0].team_name;
        const teamB = teamsResult.rows[1].team_name;


        // ----------------------------------------------------
        // VALIDATE WINNER
        // ----------------------------------------------------

        if (
            winner !== teamA &&
            winner !== teamB
        ) {
            return res.status(400).json({
                error: "Please select a valid team winner."
            });
        }


        // ----------------------------------------------------
        // UPDATE MATCH
        // ----------------------------------------------------

        await db.query(`
            UPDATE matches
            SET
                winner = $1,
                match_date = $2,
                status = 'PLAYED'
            WHERE id = $3
        `, [
            winner,
            match_date || null,
            id
        ]);


        // ----------------------------------------------------
        // RECALCULATE SERIES
        // ----------------------------------------------------

        await updateSeriesAfterMatch(
            match.series_id,
            teamA,
            teamB
        );


        res.json({
            message: "Match updated successfully."
        });


    } catch (error) {

        console.error("Update match error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// ============================================================
// DELETE MATCH
// ============================================================

router.delete("/:id", async (req, res) => {

    const { id } = req.params;


    try {

        // ----------------------------------------------------
        // GET MATCH BEFORE DELETE
        // ----------------------------------------------------

        const matchResult = await db.query(`
            SELECT *
            FROM matches
            WHERE id = $1
        `, [id]);


        if (matchResult.rows.length === 0) {
            return res.status(404).json({
                error: "Match not found."
            });
        }


        const match = matchResult.rows[0];


        // ----------------------------------------------------
        // GET TEAM NAMES
        // ----------------------------------------------------

        const teamsResult = await db.query(`
            SELECT team_name
            FROM teams
            ORDER BY id ASC
            LIMIT 2
        `);


        if (teamsResult.rows.length < 2) {
            return res.status(400).json({
                error: "Two teams are required."
            });
        }


        const teamA = teamsResult.rows[0].team_name;
        const teamB = teamsResult.rows[1].team_name;


        // ----------------------------------------------------
        // DELETE MATCH
        // ----------------------------------------------------

        await db.query(`
            DELETE FROM matches
            WHERE id = $1
        `, [id]);


        // ----------------------------------------------------
        // RECALCULATE SERIES
        // ----------------------------------------------------

        await updateSeriesAfterMatch(
            match.series_id,
            teamA,
            teamB
        );


        res.json({
            message: "Match deleted successfully."
        });


    } catch (error) {

        console.error("Delete match error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


module.exports = router;