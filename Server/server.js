var http = require('http');

function serverCallback(req, res){
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hello World\n');
}

var server = http.createServer(serverCallback);

server.listen(8000);

console.log('Server running at http://127.0.0.1:8000');

