const mysql = require('mysql');
const express = require('express');
var app = express();
const FlowByTDSRange = require('./MockData/FlowByTDSRange.json');
const FlowByTempRange =  require('./MockData/FlowByTempRange.json');
const DayWiseUsage =  require('./MockData/DayWiseUsage.json');
const bodyparser = require('body-parser');
const FlowByHour =  require('./MockData/FlowByHour.json');
const MySQLCredentials = require('./MySQLCredentials.json');


app.use(bodyparser.json());


var mysqlConnection = mysql.createConnection({
    host: MySQLCredentials.host,
    user: MySQLCredentials.user,
    password: MySQLCredentials.password,
    database: MySQLCredentials.database,
    multipleStatements: MySQLCredentials.multipleStatements
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('DB connection succeded.');
    else
        console.log('DB connection failed \n Error : ' + JSON.stringify(err, undefined, 2));
});


app.listen(3000, () => console.log('Express server is runnig at port no : 3000'));




//Get Solar Heater Data for all the sensors
app.get('/SolarHeaterData', (req, res) => {
    mysqlConnection.query('SELECT * FROM SolarHeaterData', (err, rows, fields) => {
        if (!err)
            res.send(rows);
        else
            console.log(err);
    })
});



//Get Flow by Temperature Range
app.get('/FlowByTempRange', (req, res) => {

    var inDate = req.query.date;
    if (inDate) {
        fromDate = inDate + 'T00:00:00.000Z'
        toDate = inDate + 'T23:59:59.000Z';
    }
    else {
        fromDate = '2018-07-07T00:00:00.000Z';
        toDate = '2018-07-07T23:59:59.000Z';
    }

    var query = "with FlowCount as ( SELECT FlowMeter , Temperature , case when  Temperature  between 0 and  20 then '0-20'" +
        " when  Temperature  between 20 and 40 then '20-40'" +
        " when  Temperature  between 40 and 60 then '40-60'" +
        " when  Temperature  > 60 then '>60'" +
        " end as 'TempRange' FROM thermotech.solarheaterdata where MeasuredAt between " + "'" + fromDate + "'" + " and " + "'" + toDate + "'" + " )" +
        " select TempRange , sum(FlowMeter) as Count from FlowCount group by TempRange";


    mysqlConnection.query(query, (err, rows, fields) => {
        var output = { Temp: undefined };
        if (!err) {
            output.Temp = rows;
            res.send(output);

        }


        else
            console.log(err);
    })
});

//Get Flow by TDS Range
app.get('/FlowByTDSRange', (req, res) => {

    var inDate = req.query.date;
    if (inDate) {
        fromDate = inDate + "T00:00:00.000Z"
        toDate = inDate + "T23:59:59.000Z";
    }
    else {
        fromDate = "2018-07-07T00:00:00.000Z";
        toDate = "2018-07-07T23:59:59.000Z";
    }

    var query = "with FlowCount as ( SELECT FlowMeter , TDS , case when  TDS  between 0 and  150 then '0-150'" +
        " when  TDS  between 150 and 300 then '150-300'" +
        " when  TDS  between 300 and 450 then '300-450'" +
        " when  TDS  > 450 then '>450'" +
        " end as 'TDSRange' FROM thermotech.solarheaterdata where MeasuredAt between " + "'" + fromDate + "'" + " and " + "'" + toDate + "'" + " )" +
        " select TDSRange , sum(FlowMeter) as Flow from FlowCount group by TDSRange";


    mysqlConnection.query(query, (err, rows, fields) => {
        var output = { TDS: undefined };
        if (!err) {
            output.TDS = rows;
            res.send(output);
            
        }


        else
            console.log(err);
    })
});

//Get Daywise Usage
app.get('/DaywiseUsage', (req, res) => {


    var fromDate = req.query.fromDate;
    var toDate = req.query.toDate;

    if (!fromDate) {

        fromDate = '2018-07-07T00:00:00.000Z';

    }
    if (!toDate) {
        toDate = '2018-07-07T23:59:59.000Z';
    }



    var query = "select sum(FlowMeter) as activeHours, CAST(Date(Measuredat) AS char) as date FROM thermotech.solarheaterdata where MeasuredAt between " + "'" + fromDate + "'" + " and " + "'" + toDate + "'" +
        " group by Date(Measuredat) order by Date(Measuredat) asc";

    mysqlConnection.query(query, (err, rows, fields) => {
        var output = { Usage: undefined };
        if (!err) {
            output.Usage = rows;
            res.send(output);

        }


        else
            console.log(err);
    })
});

//Get Hourly Flow Data 
app.get('/FlowByHour', (req, res) => {


    var inDate = req.query.date;
    if (inDate) {
        fromDate = inDate + 'T00:00:00.000Z'
        toDate = inDate + 'T23:59:59.000Z';
    }
    else {
        fromDate = '2018-07-07T00:00:00.000Z';
        toDate = '2018-07-07T23:59:59.000Z';
    }


    var query = " with flow as ( select FlowMeter , Hour(MeasuredAt) as MeasuredHour, case when  Temperature  between 0 and  20 then '0-20'" +
        " when  Temperature  between 20 and 40 then '20-40' " +
        " when  Temperature  between 40 and 60 then '40-60' " +
        " when  Temperature  > 60 then '>60'  end as 'TempRange' from thermotech.solarheaterdata where MeasuredAt between " + "'" + fromDate + "'" + " and " + "'" + toDate + "'" + " )" +
        " select sum(FlowMeter) as Flow, MeasuredHour , Temprange from flow group by MeasuredHour , Temprange";


    mysqlConnection.query(query, (err, rows, fields) => {
        var output = {"HourlyFlowData":[]};
        if (!err) {


            for (var i = 0; i < 24; i++) {

                var match = rows.find(function (obj) { return obj.MeasuredHour === i; });
                var Hour = new Date(fromDate.substring(0,10));
                Hour.setUTCHours(i);

                if (match) {

                    switch (match.TempRange)
                    {
                        case "0-20"  : output.HourlyFlowData.push({ "Hour": Hour.toJSON(), "Flow1": match.Flow , "Flow2" : 0 ,"Flow3" : 0 ,"Flow4" : 0  }); break; 
                        case "20-40" : output.HourlyFlowData.push({ "Hour": Hour.toJSON(), "Flow2": match.Flow , "Flow1" : 0 ,"Flow3" : 0 ,"Flow2" : 0  }); break;
                        case "40-60" : output.HourlyFlowData.push({ "Hour": Hour.toJSON(), "Flow3": match.Flow , "Flow1" : 0 ,"Flow3" : 0 ,"Flow2" : 0  }); break;
                        case ">60"   : output.HourlyFlowData.push({ "Hour": Hour.toJSON(), "Flow4": match.Flow , "Flow2" : 0 ,"Flow3" : 0 ,"Flow1" : 0  }); break;
                    }

                }

                else {
                    output.HourlyFlowData.push({ "Hour": Hour.toJSON(), "Flow1": 0 ,"Flow4": 0 , "Flow2" : 0 ,"Flow3" : 0 });
                }

            }

            res.send(output);

        }


        else
            console.log(err);
    })
});




//Get Solar Heater Data for a given sensors
app.get('/SolarHeaterData/:SensorID', (req, res) => {

    if (req.query.aggr) {
        switch (req.query.aggr) {

            case "day":

                mysqlConnection.query('SELECT SensorID, date(MeasuredAt) as "Date", Sum(FlowMeter) as "Usage in Litrs" FROM SolarHeaterData WHERE SensorID = ? GROUP BY SensorID , date(MeasuredAt)  ', [req.params.SensorID], (err, rows, fields) => {
                    if (!err)
                        res.send(rows);
                    else
                        console.log(err);
                })
                break;


            case "month":
                mysqlConnection.query('SELECT SensorID, month(MeasuredAt) as "Month", Sum(FlowMeter) as "Usage in Litrs" FROM SolarHeaterData WHERE SensorID = ? GROUP BY SensorID , month(MeasuredAt)', [req.params.SensorID], (err, rows, fields) => {
                    if (!err)
                        res.send(rows);
                    else
                        console.log(err);
                })
                break;


            case "year":
                mysqlConnection.query('SELECT SensorID, year(MeasuredAt) as "Year", Sum(FlowMeter) as "Usage in Litrs" FROM SolarHeaterData WHERE SensorID = ? GROUP BY SensorID , year(MeasuredAt)', [req.params.SensorID], (err, rows, fields) => {
                    if (!err)
                        res.send(rows);
                    else
                        console.log(err);
                })

                break;


            default:
                res.send('Invalid Aggregation');
                break;
        }

    }

    else {

        mysqlConnection.query('SELECT * FROM SolarHeaterData WHERE SensorID = ?', [req.params.SensorID], (err, rows, fields) => {
            if (!err)
                res.send(rows);
            else
                console.log(err);
        })

    }

});

//Insert Solar Heater Data
app.post('/SolarHeaterData', (req, res) => {
    let SolarHeaterData = req.body;
    var sql = "SET @SensorID = ?;SET @MeasuredAt = ?;SET @FlowMeter = ?;SET @Temperature = ?;SET @TDS = ?; \
    CALL AddSolarHeaterData(@SensorID,@MeasuredAt,@FlowMeter,@Temperature,@TDS);";
    mysqlConnection.query(sql, [SolarHeaterData.SensorID, SolarHeaterData.MeasuredAt, SolarHeaterData.FlowMeter, SolarHeaterData.Temperature,SolarHeaterData.TDS], (err, rows, fields) => {
        if (!err)

            res.send(JSON.stringify('Success'));

        else
            res.send(err);
    })
});

