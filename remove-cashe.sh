#!/bin/sh

mongo sparql --eval "db.queryresults.drop()"
mongo sparql --eval "db.queryresults.ensureIndex({query: 1}, {unique: true, dropDups: true})"

