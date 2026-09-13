// =====================================================
// CRICKET RECORDS - MAIN FRONTEND JAVASCRIPT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    loadWebsiteData();
});


// =====================================================
// MAIN FUNCTION
// =====================================================

async function loadWebsiteData() {
    try {
        const [
            teamsResponse,
            cupsResponse,
            seriesResponse,
            matchesResponse,
            biodataResponse
        ] = await Promise.all([
            fetch("/api/teams"),
            fetch("/api/cups"),
            fetch("/api/series"),
            fetch("/api/matches"),
            fetch("/api/biodata")
        ]);

        const teams = await teamsResponse.json();
        const cups = await cupsResponse.json();
        const series = await seriesResponse.json();
        const matches = await matchesResponse.json();
        const biodata = await biodataResponse.json();

        console.log("Teams:", teams);
        console.log("Cups:", cups);
        console.log("Series:", series);
        console.log("Matches:", matches);
        console.log("Biodata:", biodata);

        updateTeamNames(teams);
        updateOverallRecord(teams, matches);
        updateCurrentCup(teams, cups);
        updateRecentSeries(teams, series);
        updateCupHistory(teams, cups);
        updateMatchRecords(teams, cups, series, matches);
        updateBiodata(biodata);

    } catch (error) {
        console.error("Error loading website data:", error);
    }
}


// =====================================================
// TEAM NAMES
// =====================================================

function updateTeamNames(teams) {

    if (!teams || teams.length < 2) {
        return;
    }

    const teamA = teams[0].team_name;
    const teamB = teams[1].team_name;

    // Replace normal TEAM A / TEAM B text
    document.querySelectorAll(".team-a-name").forEach(element => {
        element.textContent = teamA;
    });

    document.querySelectorAll(".team-b-name").forEach(element => {
        element.textContent = teamB;
    });

    // Hero team names
    const heroTeams = document.querySelector(".teams");

    if (heroTeams) {
        const spans = heroTeams.querySelectorAll("span");

        if (spans.length >= 4) {
            spans[1].textContent = teamA;
            spans[3].textContent = teamB;
        }
    }

    // Replace TEAM A / TEAM B everywhere else
    replaceTeamText(teamA, teamB);
}


// =====================================================
// REPLACE TEAM TEXT
// =====================================================

function replaceTeamText(teamA, teamB) {

    const elements = document.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, span, strong, a, div"
    );

    elements.forEach(element => {

        // Don't touch script elements
        if (element.closest("script")) {
            return;
        }

        if (
            element.children.length === 0 &&
            element.textContent.trim()
        ) {

            const text = element.textContent;

            if (text.includes("TEAM A")) {
                element.textContent =
                    text.replaceAll("TEAM A", teamA);
            }

            if (element.textContent.includes("Team A")) {
                element.textContent =
                    element.textContent.replaceAll("Team A", teamA);
            }

            if (element.textContent.includes("TEAM B")) {
                element.textContent =
                    element.textContent.replaceAll("TEAM B", teamB);
            }

            if (element.textContent.includes("Team B")) {
                element.textContent =
                    element.textContent.replaceAll("Team B", teamB);
            }
        }
    });
}


// =====================================================
// OVERALL RECORD
// =====================================================

function updateOverallRecord(teams, matches) {

    if (!teams || teams.length < 2) {
        return;
    }

    const teamA = teams[0].team_name;
    const teamB = teams[1].team_name;

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

    const totalMatches = matches.length;
    const lead = Math.abs(teamAWins - teamBWins);

    const recordCards =
        document.querySelectorAll(".record-card");

    if (recordCards.length >= 4) {

        // Total matches
        recordCards[0]
            .querySelector(".record-number")
            .textContent = totalMatches;

        // Team A wins
        recordCards[1]
            .querySelector(".record-number")
            .textContent = teamAWins;

        recordCards[1]
            .querySelector(".record-label")
            .textContent = `${teamA} WINS`;

        // Team B wins
        recordCards[2]
            .querySelector(".record-number")
            .textContent = teamBWins;

        recordCards[2]
            .querySelector(".record-label")
            .textContent = `${teamB} WINS`;

        // Lead
        recordCards[3]
            .querySelector(".record-number")
            .textContent = `+${lead}`;

        const leadLabel =
            recordCards[3].querySelector(".record-label");

        if (teamAWins > teamBWins) {

            leadLabel.textContent =
                `${teamA} LEADS`;

        } else if (teamBWins > teamAWins) {

            leadLabel.textContent =
                `${teamB} LEADS`;

        } else {

            recordCards[3]
                .querySelector(".record-number")
                .textContent = "0";

            leadLabel.textContent = "LEVEL";
        }
    }
}


// =====================================================
// CURRENT CUP
// =====================================================

function updateCurrentCup(teams, cups) {

    if (!cups || cups.length === 0) {
        return;
    }

    const teamA = teams[0].team_name;
    const teamB = teams[1].team_name;

    // Find current unfinished cup
    let currentCup =
        cups.find(cup => !cup.completed);

    // If no unfinished cup exists, use latest cup
    if (!currentCup) {
        currentCup = cups[cups.length - 1];
    }

    const currentCupSection =
        document.querySelector(".current-cup");

    if (!currentCupSection) {
        return;
    }

    const title =
        currentCupSection.querySelector(".cup-title h3");

    const description =
        currentCupSection.querySelector(".cup-title p");

    if (title) {
        title.textContent =
            currentCup.cup_name;
    }

    if (description) {
        description.textContent =
            `Series championship between ${teamA} and ${teamB}`;
    }

    const cupTeams =
        currentCupSection.querySelectorAll(".cup-team");

    if (cupTeams.length >= 2) {

        // Team A
        cupTeams[0].querySelector("h4").textContent =
            teamA;

        cupTeams[0].querySelector(".cup-score").textContent =
            currentCup.team_a_series_wins || 0;

        // Team B
        cupTeams[1].querySelector("h4").textContent =
            teamB;

        cupTeams[1].querySelector(".cup-score").textContent =
            currentCup.team_b_series_wins || 0;
    }

    // Progress bars
    const progressA =
        currentCupSection.querySelector(".team-a-progress");

    const progressB =
        currentCupSection.querySelector(".team-b-progress");

    const winsA =
        currentCup.team_a_series_wins || 0;

    const winsB =
        currentCup.team_b_series_wins || 0;

    if (progressA) {
        progressA.style.width =
            `${Math.min(winsA * 10, 100)}%`;
    }

    if (progressB) {
        progressB.style.width =
            `${Math.min(winsB * 10, 100)}%`;
    }

    // Progress numbers
    const progressInfo =
        currentCupSection.querySelectorAll(".progress-info");

    if (progressInfo.length >= 2) {

        progressInfo[0].innerHTML =
            `<span>${teamA}</span>
             <strong>${winsA} / 10</strong>`;

        progressInfo[1].innerHTML =
            `<span>${teamB}</span>
             <strong>${winsB} / 10</strong>`;
    }
}


// =====================================================
// RECENT SERIES
// =====================================================

function updateRecentSeries(teams, series) {

    const seriesList =
        document.querySelector(".series-list");

    if (!seriesList) {
        return;
    }

    const teamA = teams[0].team_name;
    const teamB = teams[1].team_name;

    seriesList.innerHTML = "";

    if (!series || series.length === 0) {

        seriesList.innerHTML = `
            <div class="series-card">
                <div class="series-info">
                    <h3>No series records yet</h3>
                    <p>Create a series from the admin panel.</p>
                </div>
            </div>
        `;

        return;
    }

    // Show latest 3
    const recentSeries =
        series.slice(0, 3);

    recentSeries.forEach(item => {

        const winner =
            item.winner || "In Progress";

        const score =
            `${item.team_a_wins || 0}-${item.team_b_wins || 0}`;

        const winnerBadge =
            item.winner
                ? `🏆 ${item.winner}`
                : "IN PROGRESS";

        const card = document.createElement("div");

        card.className = "series-card";

        card.innerHTML = `
            <div class="series-number">
                <span>SERIES</span>
                <strong>${item.series_number}</strong>
            </div>

            <div class="series-info">

                <div class="series-top">

                    <span class="best-of">
                        BEST OF 3
                    </span>

                    <span class="winner-badge">
                        ${winnerBadge}
                    </span>

                </div>

                <h3>
                    Series ${item.series_number}
                </h3>

                <p>
                    ${item.winner
                        ? `Series Winner: ${winner}`
                        : "Series In Progress"}
                </p>

                <span class="series-result">
                    Result: ${score}
                </span>

            </div>

            <a href="#" class="series-view">
                VIEW
                <span>→</span>
            </a>
        `;

        seriesList.appendChild(card);
    });
}


// =====================================================
// CUP HISTORY
// =====================================================

function updateCupHistory(teams, cups) {

    const grid =
        document.querySelector(".cup-history-grid");

    if (!grid) {
        return;
    }

    if (!cups || cups.length === 0) {
        grid.innerHTML = `
            <div class="history-card">
                <h3>No cup records yet</h3>
                <p>Create the first cup from the admin panel.</p>
            </div>
        `;

        return;
    }

    grid.innerHTML = "";

    cups.forEach(cup => {

        const status =
            cup.completed
                ? "COMPLETED"
                : "CURRENT";

        const winnerText =
            cup.winner
                ? `Winner: <strong>${cup.winner}</strong>`
                : "In Progress";

        const card = document.createElement("div");

        card.className =
            cup.completed
                ? "history-card"
                : "history-card current-history-card";

        card.innerHTML = `
            <div class="history-icon">
                🏆
            </div>

            <span class="history-status ${cup.completed ? "" : "current-status"}">
                ${status}
            </span>

            <h3>
                ${cup.cup_name}
            </h3>

            <p class="history-winner">
                ${winnerText}
            </p>

            <div class="history-score">

                <div>
                    <strong>${cup.team_a_series_wins || 0}</strong>
                    <span>${teams[0].team_name}</span>
                </div>

                <div class="history-vs">
                    -
                </div>

                <div>
                    <strong>${cup.team_b_series_wins || 0}</strong>
                    <span>${teams[1].team_name}</span>
                </div>

            </div>

            <a href="#" class="history-button">
                VIEW CUP →
            </a>
        `;

        grid.appendChild(card);
    });
}


// =====================================================
// MATCH RECORDS
// =====================================================

function updateMatchRecords(teams, cups, series, matches) {

    const container =
        document.querySelector(".match-record-container");

    if (!container) {
        return;
    }

    const teamA = teams[0].team_name;
    const teamB = teams[1].team_name;

    // Remove old series
    const oldSeries =
        container.querySelectorAll(".match-series");

    oldSeries.forEach(element => {
        element.remove();
    });

    if (!series || series.length === 0) {
        return;
    }

    series.forEach(item => {

        const seriesMatches =
            matches.filter(
                match => match.series_id === item.id
            );

        if (seriesMatches.length === 0) {
            return;
        }

        const teamAWins =
            seriesMatches.filter(
                match => match.winner === teamA
            ).length;

        const teamBWins =
            seriesMatches.filter(
                match => match.winner === teamB
            ).length;

        const winner =
            teamAWins > teamBWins
                ? teamA
                : teamB;

        const seriesElement =
            document.createElement("div");

        seriesElement.className =
            "match-series";

        seriesElement.innerHTML = `
            <div class="match-series-heading">

                <h3>
                    SERIES ${item.series_number}
                </h3>

                <span>
                    ${winner} WON • ${teamAWins}-${teamBWins}
                </span>

            </div>
        `;

        // Add only matches that actually exist
        seriesMatches
            .sort(
                (a, b) =>
                    a.match_number - b.match_number
            )
            .forEach(match => {

                const row =
                    document.createElement("div");

                row.className =
                    "match-row";

                const date =
                    match.match_date
                        ? formatDate(match.match_date)
                        : "Date not available";

                row.innerHTML = `
                    <span>
                        Match ${match.match_number}
                    </span>

                    <span>
                        ${date}
                    </span>

                    <strong>
                        ${match.winner}
                    </strong>
                `;

                seriesElement.appendChild(row);
            });

        container.appendChild(seriesElement);
    });
}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "Date not available";
    }

    const date =
        new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    const day =
        String(date.getDate()).padStart(2, "0");

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const year =
        date.getFullYear();

    return `${day}/${month}/${year}`;
}


// =====================================================
// BIODATA
// =====================================================

function updateBiodata(players) {

    const grid =
        document.querySelector(".biodata-grid");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    if (!players || players.length === 0) {

        grid.innerHTML = `
            <div class="player-card">
                <div class="player-details">
                    <h3>No player biodata yet</h3>
                    <p>
                        Player information will appear here
                        after it is added by the admin.
                    </p>
                </div>
            </div>
        `;

        return;
    }

    players.forEach(player => {

        const card =
            document.createElement("div");

        card.className =
            "player-card";

        const photo =
            player.photo
                ? `<img src="${player.photo}" alt="${player.name}">`
                : "👤";

        card.innerHTML = `
            <div class="player-photo">
                ${photo}
            </div>

            <div class="player-details">

                <h3>
                    ${player.name}
                </h3>

                <span class="player-role">
                    ${player.role}
                </span>

                <p>
                    ${player.biography || "No biography available."}
                </p>

            </div>
        `;

        grid.appendChild(card);
    });
}