const sql = require("mssql");

const config = {
    server: process.env.SQL_Server,
    database: process.env.SQL_Database,
    user: process.env.SQL_User,
    password: process.env.SQL_Password,

    options: {
        encrypt: true,
        trustServerCertificate: false
    },

    connectionTimeout: 15000
};

let poolPromise = null;

async function getDatabaseConnection() {

    if (poolPromise) {
        try {
            const pool = await poolPromise;

            if (pool.connected) {
                return pool;
            }
        } catch (error) {
            poolPromise = null;
        }
    }

    for (let attempt = 1; attempt <= 3; attempt++) {

        try {
            console.log(`Database connection attempt ${attempt}/3`);

            poolPromise = sql.connect(config);

            const pool = await poolPromise;

            console.log("Database connection successful");

            return pool;

        } catch (error) {

            console.error(
                `Database connection attempt ${attempt} failed:`,
                error.code
            );

            poolPromise = null;

            if (attempt === 3) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

module.exports = {
    sql,
    getDatabaseConnection
};