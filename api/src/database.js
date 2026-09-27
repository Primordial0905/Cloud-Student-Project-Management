const sql = require ("mssql")

const config = {
    server : process.env.SQL_Server,
    database : process.env.SQL_Database,
    user : process.env.SQL_User,
    password : process.env.SQL_Password,

    options: {
        encrypt : true,
        trustServerCertificate: false
    }

};

let poolPromise;

function getDatabaseConnection() {
    if(!poolPromise){
        poolPromise = sql.connect(config);
    }

    return poolPromise;
}

module.exports = {
    sql,
    getDatabaseConnection
};