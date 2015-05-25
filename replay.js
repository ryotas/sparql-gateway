// USAGE: $ node replay.js

var request = require('request');
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

// DB CONNECTION
mongoose.connect('mongodb://localhost/sparql');

// MONGO DB SCHEMA DIFINITION FOR QUERY RESULT CACHING
var Schema = mongoose.Schema;
var QueryResultSchema = new Schema({
  strQuery: String,
  hashQuery: String,
  result: Object 
});
var QueryResult = mongoose.model('QueryResult', QueryResultSchema);

// MAIN FUNCTION THAT RUNS WHEN IT RECIEVED EACH SPARQL QUERY
QueryResult.find({}, function(err, array) {
  loop(array, 0, function() {
    mongoose.disconnect();
  });
});

function loop(array, index, callback) {
  if (array[index]) {
    console.log('---------------------------------');
    replayQuery(array[index]['strQuery'], function() {
      loop(array, index + 1, function() {});
    });
  } else {
    console.log('---------------------------------');
    console.log('DONE. Ctrl + C to exit.');
    callback();
  }
}

function replayQuery(strQuery, callback) {
  var hashQuery = getHashQuery(strQuery);
  getCache(hashQuery, function(cache) {
    // WHEN CACHE EXISTS
    if (cache.length > 0) {
      postQuery(strQuery, function(result) {
        QueryResult.remove({"hashQuery":hashQuery}, function(err) {
          createCache(strQuery, hashQuery, result, function() {
            callback();
          });
        });
      });
    // WHEN CACHE DOES NOT EXIST
    } else {
      postQuery(strQuery, function(result) {
        createCache(strQuery, hashQuery, result, function() {
          callback();
        });
      });
    }
  });
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

function postQuery(strQuery, callback) {
  var options = {
    uri: endpoint,
    json: true,
    form: {query: strQuery, format: "json"},
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/sparql-results+json',
    },
  };
  request.post(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('SPARQL responce recieved.');
      callback(body);
    } else {
      console.log('error: '+ response.statusCode);
      console.log(body);
    }
  });
}

function createCache(strQuery, hashQuery, strResult, callback) {
  var qr = new QueryResult();
  qr.strQuery = strQuery;
  qr.hashQuery = hashQuery;
  qr.result = strResult;
  qr.save(function(err) {
    if (err) { console.log(err); }
    callback();
  });
}

