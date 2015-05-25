#!/bin/sh
mongo sparql --eval "db.queryresults.drop()"
mongo sparql --eval "db.queryresults.ensureIndex({hashQuery: 1}, {unique: true, dropDups: true})"
