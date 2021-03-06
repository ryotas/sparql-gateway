// USAGE: $ node client.js <query_file> <result_file>

var request = require('request');
var fs = require('fs');
var config = require('config');

var inFile = process.argv[2]; // Query
var outFile = process.argv[3]; // Result

// ENDPOINT
var endpoint;
if (config.endpoint) {
  console.log('Endpoint is ' + config.endpoint);
  endpoint = config.endpoint;
} else {
  console.log('Please set endpoint URL in ./config/default.yaml!');
}

// QUERY
var query = '';
function get_query(callback) {
  fs.readFile(inFile, 'utf8', function (err, text) {
    if (err == null) {
      console.log('SPARQL:\n' + text);
      query = text;
      callback();
    } else {
      console.log(err);
      console.log('Please provide SPARQL file!');
    }
  });
}

// MAIN FUNCTION TO EXECUTE QUERY
get_query(function(){
  var options = {
    uri: endpoint,
    form: {query: query, format: "text/plain"},
  };
  request.post(options, function(error, response, body){
    if (!error && response.statusCode == 200) {
      console.log('Writing file ...');
      fs.writeFile(outFile, body, 'utf8', function (err) {
        if (err == null) {
          console.log('Done.');
        } else {
          console.log(err);
        }
      });
    } else {
      console.log('error: '+ response.statusCode);
      console.log(body);
    }
  });
});
