const express = require("express");
const router = express.Router();
const db = require("../db");

// =========================================
// GET ALL TEAMS
// =========================================

router.get("/", (req, res) => {

    const sql = "SELECT * FROM teams";

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(results);

    });

});


// =========================================
// ADD NEW TEAM
// =========================================

router.post("/", (req, res) => {

    const { team_name } = req.body;

    if (!team_name) {

        return res.status(400).json({
            error: "Team name is required"
        });

    }

    const sql =
        "INSERT INTO teams (team_name) VALUES (?)";

    db.query(
        sql,
        [team_name],
        (err, result) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                message: "Team added successfully",
                id: result.insertId
            });

        }
    );

});


// =========================================
// UPDATE TEAM
// =========================================

router.put("/:id", (req, res) => {

    const { team_name } = req.body;
    const { id } = req.params;

    if (!team_name) {

        return res.status(400).json({
            error: "Team name is required"
        });

    }


    // First get the old team name
    const getOldTeamSql =
        "SELECT team_name FROM teams WHERE id = ?";


    db.query(
        getOldTeamSql,
        [id],
        (err, results) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    error: "Team not found"
                });

            }


            const oldTeamName =
                results[0].team_name;


            // Update team name
            const updateTeamSql =
                "UPDATE teams SET team_name = ? WHERE id = ?";


            db.query(
                updateTeamSql,
                [team_name, id],
                (err) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }


                    // Update old match winners
                    const updateMatchesSql = `
                        UPDATE matches
                        SET winner = ?
                        WHERE winner = ?
                    `;


                    db.query(
                        updateMatchesSql,
                        [
                            team_name,
                            oldTeamName
                        ],
                        (err) => {

                            if (err) {

                                return res.status(500).json({
                                    error: err.message
                                });

                            }


                            // Update old series winners
                            const updateSeriesSql = `
                                UPDATE series
                                SET winner = ?
                                WHERE winner = ?
                            `;


                            db.query(
                                updateSeriesSql,
                                [
                                    team_name,
                                    oldTeamName
                                ],
                                (err) => {

                                    if (err) {

                                        return res.status(500).json({
                                            error: err.message
                                        });

                                    }


                                    // Update old cup winners
                                    const updateCupsSql = `
                                        UPDATE cups
                                        SET winner = ?
                                        WHERE winner = ?
                                    `;


                                    db.query(
                                        updateCupsSql,
                                        [
                                            team_name,
                                            oldTeamName
                                        ],
                                        (err) => {

                                            if (err) {

                                                return res.status(500).json({
                                                    error: err.message
                                                });

                                            }


                                            res.json({
                                                message:
                                                    "Team name and historical records updated successfully"
                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});


// =========================================
// DELETE TEAM
// =========================================

router.delete("/:id", (req, res) => {

    const { id } = req.params;

    const sql =
        "DELETE FROM teams WHERE id = ?";

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
                message: "Team deleted successfully"
            });

        }
    );

});


module.exports = router;