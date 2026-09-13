const express = require("express");
const router = express.Router();
const db = require("../db");


// ============================================
// GET ALL MATCHES
// ============================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            matches.*,
            series.series_number
        FROM matches
        JOIN series
            ON matches.series_id = series.id
        ORDER BY
            matches.series_id,
            matches.match_number
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


// ============================================
// GET MATCHES OF ONE SERIES
// ============================================

router.get("/series/:seriesId", (req, res) => {

    const { seriesId } = req.params;

    const sql = `
        SELECT *
        FROM matches
        WHERE series_id = ?
        ORDER BY match_number
    `;

    db.query(sql, [seriesId], (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});


// ============================================
// GET ONE MATCH
// ============================================

router.get("/:id", (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT *
        FROM matches
        WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Match not found"
            });
        }

        res.json(results[0]);

    });

});


// ============================================
// ADD MATCH
// ============================================

router.post("/", (req, res) => {

    const {
        series_id,
        match_number,
        winner,
        match_date
    } = req.body;


    if (!series_id) {

        return res.status(400).json({
            error: "Series is required."
        });

    }


    const matchNo = Number(match_number);


    if (![1, 2, 3].includes(matchNo)) {

        return res.status(400).json({
            error: "Match number must be 1, 2 or 3."
        });

    }


    // ----------------------------------------
    // GET CURRENT TEAM NAMES
    // ----------------------------------------

    const teamsSql = `
        SELECT *
        FROM teams
        ORDER BY id
        LIMIT 2
    `;


    db.query(teamsSql, (err, teams) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });

        }


        if (teams.length < 2) {

            return res.status(400).json({
                error: "Two teams are required."
            });

        }


        const teamA = teams[0].team_name;
        const teamB = teams[1].team_name;


        // ----------------------------------------
        // CHECK SERIES
        // ----------------------------------------

        const checkSeriesSql = `
            SELECT *
            FROM series
            WHERE id = ?
        `;


        db.query(
            checkSeriesSql,
            [series_id],
            (err, seriesResults) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }


                if (seriesResults.length === 0) {

                    return res.status(404).json({
                        error: "Series not found."
                    });

                }


                const series = seriesResults[0];


                if (series.completed) {

                    return res.status(400).json({
                        error:
                            "This series is already completed."
                    });

                }


                // ----------------------------------------
                // CHECK WINNER
                // ----------------------------------------

                if (
                    !winner ||
                    (winner !== teamA && winner !== teamB)
                ) {

                    return res.status(400).json({
                        error:
                            "Please select a valid team winner."
                    });

                }


                // ----------------------------------------
                // CHECK DUPLICATE MATCH
                // ----------------------------------------

                const checkMatchSql = `
                    SELECT *
                    FROM matches
                    WHERE series_id = ?
                    AND match_number = ?
                `;


                db.query(
                    checkMatchSql,
                    [series_id, matchNo],
                    (err, existingMatches) => {

                        if (err) {

                            return res.status(500).json({
                                error: err.message
                            });

                        }


                        if (existingMatches.length > 0) {

                            return res.status(400).json({
                                error:
                                    `Match ${matchNo} already exists for this series.`
                            });

                        }


                        // ----------------------------------------
                        // MATCH 3
                        // ----------------------------------------

                        if (matchNo === 3) {

                            const firstTwoSql = `
                                SELECT
                                    match_number,
                                    winner,
                                    status
                                FROM matches
                                WHERE series_id = ?
                                AND match_number IN (1, 2)
                                ORDER BY match_number
                            `;


                            db.query(
                                firstTwoSql,
                                [series_id],
                                (err, firstTwo) => {

                                    if (err) {

                                        return res.status(500).json({
                                            error: err.message
                                        });

                                    }


                                    if (firstTwo.length !== 2) {

                                        return res.status(400).json({
                                            error:
                                                "Match 1 and Match 2 must be played before Match 3."
                                        });

                                    }


                                    // Same team won first two
                                    if (
                                        firstTwo[0].winner ===
                                        firstTwo[1].winner
                                    ) {

                                        return res.status(400).json({
                                            error:
                                                "Match 3 was not played because one team won Match 1 and Match 2."
                                        });

                                    }


                                    insertMatch();

                                }
                            );

                            return;

                        }


                        // ----------------------------------------
                        // MATCH 1 OR MATCH 2
                        // ----------------------------------------

                        insertMatch();


                        // ----------------------------------------
                        // INSERT PLAYED MATCH
                        // ----------------------------------------

                        function insertMatch() {

                            const insertSql = `
                                INSERT INTO matches
                                (
                                    series_id,
                                    match_number,
                                    winner,
                                    match_date,
                                    status
                                )
                                VALUES
                                (?, ?, ?, ?, 'PLAYED')
                            `;


                            db.query(
                                insertSql,
                                [
                                    series_id,
                                    matchNo,
                                    winner,
                                    match_date || null
                                ],
                                (err, result) => {

                                    if (err) {

                                        return res.status(500).json({
                                            error: err.message
                                        });

                                    }


                                    updateSeriesAfterMatch(
                                        series_id,
                                        teamA,
                                        teamB,
                                        () => {

                                            res.json({

                                                message:
                                                    "Match saved successfully.",

                                                id:
                                                    result.insertId

                                            });

                                        }
                                    );

                                }
                            );

                        }

                    }
                );

            }
        );

    });

});


// ============================================
// UPDATE SERIES AFTER MATCH
// ============================================

function updateSeriesAfterMatch(
    seriesId,
    teamA,
    teamB,
    callback
) {

    const matchesSql = `
        SELECT winner
        FROM matches
        WHERE series_id = ?
        AND status = 'PLAYED'
    `;


    db.query(
        matchesSql,
        [seriesId],
        (err, matches) => {

            if (err) {
                return callback();
            }


            let teamAWins = 0;
            let teamBWins = 0;


            matches.forEach(match => {

                if (match.winner === teamA) {
                    teamAWins++;
                }

                if (match.winner === teamB) {
                    teamBWins++;
                }

            });


            let winner = null;
            let completed = false;


            // ----------------------------------------
            // TEAM A WINS SERIES
            // ----------------------------------------

            if (teamAWins >= 2) {

                winner = teamA;
                completed = true;

            }


            // ----------------------------------------
            // TEAM B WINS SERIES
            // ----------------------------------------

            else if (teamBWins >= 2) {

                winner = teamB;
                completed = true;

            }


            const updateSql = `
                UPDATE series
                SET
                    team_a_wins = ?,
                    team_b_wins = ?,
                    winner = ?,
                    completed = ?
                WHERE id = ?
            `;


            db.query(
                updateSql,
                [
                    teamAWins,
                    teamBWins,
                    winner,
                    completed,
                    seriesId
                ],
                (err) => {

                    if (err) {
                        return callback();
                    }


                    // ----------------------------------------
                    // IF SERIES IS 2-0
                    // CREATE MATCH 3 AS NOT PLAYED
                    // ----------------------------------------

                    if (
                        completed &&
                        (
                            teamAWins === 2 ||
                            teamBWins === 2
                        )
                    ) {

                        createNotPlayedMatch3(
                            seriesId,
                            callback
                        );

                    } else {

                        callback();

                    }

                }
            );

        }
    );

}


// ============================================
// CREATE MATCH 3 AS NOT PLAYED
// ============================================

function createNotPlayedMatch3(
    seriesId,
    callback
) {

    const checkSql = `
        SELECT id
        FROM matches
        WHERE series_id = ?
        AND match_number = 3
    `;


    db.query(
        checkSql,
        [seriesId],
        (err, results) => {

            if (err) {
                return callback();
            }


            if (results.length > 0) {
                return callback();
            }


            const insertSql = `
                INSERT INTO matches
                (
                    series_id,
                    match_number,
                    winner,
                    match_date,
                    status
                )
                VALUES
                (?, 3, NULL, NULL, 'NOT PLAYED')
            `;


            db.query(
                insertSql,
                [seriesId],
                () => {

                    callback();

                }
            );

        }
    );

}


// ============================================
// UPDATE MATCH
// ============================================

router.put("/:id", (req, res) => {

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


    const sql = `
        UPDATE matches
        SET
            winner = ?,
            match_date = ?,
            status = 'PLAYED'
        WHERE id = ?
    `;


    db.query(
        sql,
        [
            winner,
            match_date || null,
            id
        ],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    error: "Match not found."
                });

            }


            res.json({
                message:
                    "Match updated successfully."
            });

        }
    );

});


// ============================================
// DELETE MATCH
// ============================================

router.delete("/:id", (req, res) => {

    const { id } = req.params;


    const sql = `
        DELETE FROM matches
        WHERE id = ?
    `;


    db.query(
        sql,
        [id],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            res.json({
                message:
                    "Match deleted successfully."
            });

        }
    );

});


module.exports = router;