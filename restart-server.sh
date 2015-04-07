./node_modules/forever/bin/forever stop server.js
./node_modules/forever/bin/forever start -o server.log server.js
sleep 1
tail -f server.log
