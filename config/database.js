// database module
var mysql = require('mysql');
var config = {
    host: 'bxzhycbdttw1guyq6ewv-mysql.services.clever-cloud.com',
    user: 'u4cdqbspeona4q8l',
    password: 'Z8hgGFK2pJ6qjUX2QQkG',
    database: 'bxzhycbdttw1guyq6ewv'
};

// init database
var pool = mysql.createPool(config);

//Fetch data
function RunQuery(sql, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            ShowErrors(err);
        }
        conn.query(sql, function (err, rows, fields) {
            if (err) {
                ShowErrors(err);
            }
            conn.release();
            callback(rows);
        });
    });
}

//Throw errors
function ShowErrors(err) {
    throw err;
}

module.exports = {
    RunQuery: RunQuery
};
