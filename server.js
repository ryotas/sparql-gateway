// USAGE: $ node server.js OR $ sh server-restart.sh

var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require("crypto");
var mongoose = require('mongoose');
var config = require('config');

// ENDPOINT
var endpoint;
if (config.endpoint) {
  console.log('Endpoint is ' + config.endpoint);
  endpoint = config.endpoint;
} else {
  console.log('Please set endpoint URL in ./config/default.yaml!');
}

// UNSAFE STRING
var strReject;
if (config.strReject) {
  console.log('String to be rejected is ' + config.strReject);
  strReject = config.strReject;
} else {
  console.log('Please set string to be rejected in ./config/default.yaml!');
}
var regexpReject = new RegExp(strReject, "i"); // i FOR CAPITAL UNSENSITIVE

// PORT
var port;
if (config.port) {
  console.log('Listening port is ' + config.port);
  port = config.port;
} else {
  console.log('Please set listening port in ./config/default.yaml!');
}

// CACHING
var caching;
caching = config.caching;
if (config.caching) {
  console.log('Caching is on');
} else {
  console.log('Caching is off');
} 

// WEB SERVER
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.listen(port);

// DB CONNECTION
if (caching) {
  mongoose.connect('mongodb://localhost/sparql');
}

// MONGO DB SCHEMA DIFINITION FOR QUERY RESULT CACHING
var Schema = mongoose.Schema;
var QueryResultSchema = new Schema({
  strQuery: String,
  hashQuery: String,
  result: Object 
});
var QueryResult = mongoose.model('QueryResult', QueryResultSchema);

// MAIN FUNCTION THAT RUNS WHEN IT RECIEVED EACH SPARQL QUERY
app.get('/sparql', function(req, res){
  console.log('---------------------------------');
  if (isValidRequest(req)) {
    var strQuery = req.query.query; 
    if (isSafeQuery(strQuery)) {
      // WHEN CACHING IS OFF
      if (!caching) {
        postQuery(res, strQuery, function(result) {});
      // WHEN CACHING IS ON
      } else {
        var hashQuery = getHashQuery(strQuery);
        getCache(hashQuery, function(cache) {
          // WHEN CACHE EXISTS
          if (cache.length > 0) {
            returnResult(res, cache[0].result);
          // WHEN CACHE DOES NOT EXIST
          } else {
            postQuery(res, strQuery, function(result) {
              createCache(strQuery, hashQuery, result);
            });
          }
        });
      }
    }
  }
});

function isValidRequest(req) {
  if (req.query.query) {
    return true;
  } else {
    console.log('This is NOT valid SPARQL request.');
    return false;
  }
}

function isSafeQuery(strQuery) {
  if (strQuery.match(regexpReject)) { 
    console.log('SPARQL request rejected.');
    return false;
  } else {
    return true;
  }
}

function getHashQuery(strQuery) {
  var objHash = crypto.createHash('sha512');
  objHash.update(strQuery);
  hashQuery = objHash.digest('hex');
  return hashQuery;
}

function getCache(hashQuery, callback) {
  QueryResult.find({"hashQuery":hashQuery}, function(err, cache) {
    if (cache.length == 0) {
      console.log('This query is NOT cached.');
    } else {
      console.log('This query is cached.');
    }
    callback(cache);
  });
}

function returnResult(res, body) {
  res.set('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*")
  res.json(body);
}

function postQuery(res, strQuery, callback) {
  var options = {
    uri: endpoint,
    json: true,
    form: {query: strQuery}, // DEFAULT SHOULD BE format: "json" SO THIS IS UNNECESSARY (SOMETIMES THIS CAUSES PROBLEMS)
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
    },
  };
  request.post(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('SPARQL responce recieved.');
      returnResult(res, body);
      callback(body);
    } else {
      console.log('error: '+ response.statusCode);
      console.log(body);
    }
  });
}

function createCache(strQuery, hashQuery, strResult) {
  var qr = new QueryResult();
  qr.strQuery = strQuery;
  qr.hashQuery = hashQuery;
  qr.result = strResult;
  qr.save(function(err) {
    if (err) { console.log(err); }
  });
}

