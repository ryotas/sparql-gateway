# sparql-gateway

This SPARQL gateway server can filter queries and cache query results.

### Setup

Install Git, then:

    $ cd
    $ git clone https://github.com/ryotas/sparql-gateway.git

Install Node.js, then:

    $ cd ~/sparql-gateway
    $ npm install request express body-parser forever crypto mongoose config

Configure the setting file:

    $ cd ~/sparql-gateway/config
    $ cp default.json.sample default.json
    $ vi default.json
    {
      "endpoint"  : "http://localhost:8890/sparql"
    , "strReject" : "create|drop|insert|delete"
    , "port"      : 9001
    , "caching"   : true
    }

Start the server:

    $ cd ~/sparql-gateway
    $ node server.js

Check firewall if port 9001 is accessible.

Now this gateway can GET queries at http://gateway:9001/sparql

### Daemon

Start the server:

    $ sh restart-server.sh

Stop showing the log with Control + C

### Caching

If you use caching function, install MongoDB, then:

    $ mongo sparql
    > db.queryresults.ensureIndex({query: 1}, {unique: true, dropDups: true})
    > exit
    
    $ vi ~/sparql-gateway/config/default.yaml
    caching: true

    $ sh restart-server.sh

To remove all cache:

    $ sh remove-cache.sh

To update all cache when the database changed:

    $ node replay.js
