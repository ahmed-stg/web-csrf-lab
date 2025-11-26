const http = require('http');
const app = require('./app');
const { networkInterfaces } = require('os');


const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

'use strict'; 
 
 
const nets = networkInterfaces(); 
const results = Object.create(null); // Or just '{}', an empty object 
let wlanIPv4=""; 
for (const name of Object.keys(nets)) { 
    for (const net of nets[name]) { 
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses 
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6 
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4 
        if (net.family === familyV4Value && !net.internal) { 
            if (!results[name]) { 
                results[name] = []; 
            } 
            results[name].push(net.address); 
            wlanIPv4=net.address; 
        } 
    } 
} 
console.log(wlanIPv4);


const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

server.listen(port);
