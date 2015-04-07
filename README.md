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
    $ cp default.yaml.sample default.yaml
    $ vi default.yaml
    endpoint: http://endpoint:8890/sparql
    strReject: create|drop|insert|delete
    port: 9001
    caching: false

Start the server:

    $ cd ~/sparql-gateway
    $ node server.js

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
    
    $ vi ~/config/default.yaml
    caching: true

To remove all cache:

    $ mongo sparql
    > db.queryresults.drop()
    > db.queryresults.ensureIndex({query: 1}, {unique: true, dropDups: true})
    > exit
