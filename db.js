const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({

    connectionString: process.env.DATABASE_URL,

    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false

});


// Test PostgreSQL connection

pool.connect()

    .then((client) => {

        console.log(
            "PostgreSQL connected successfully!"
        );

        client.release();

    })

    .catch((error) => {

        console.log(
            "PostgreSQL connection failed:",
            error.message
        );

    });


module.exports = pool;