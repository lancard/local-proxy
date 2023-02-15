var http = require('http');
var https = require('https');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({changeOrigin: true});
var urlPattern = require('url-pattern');
var fs = require('fs');


function isMatch(pattern, url) {
	var p = new urlPattern(pattern);
	return p.match(url) != null;
}

var config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

function process_routing(req, res) {
	for(var m in config.routing_table) {
		if(isMatch(m, req.url)){
			var url = req.url;
			var target_url = config.routing_table[m];

			if(target_url.indexOf("file://")==0) {
				var path = target_url.split("file://").join("") + decodeURIComponent(url.split("?")[0]);

				try
				{
					res.writeHead(200);
					res.end(fs.readFileSync(path));
					console.log("static(200): "+path);
				}
				catch (e)
				{
					res.writeHead(404);
					res.end("");
					console.log("static(404): "+path);
				}

				return;
			}
			
			if(target_url.indexOf("http")<0) {
				target_url = (req.socket.encrypted ? "https:" : "http:") + target_url;
			}

			console.log(url + " → " + target_url);
			proxy.web(req, res, { target: target_url }, function(e){ console.log(e); res.statusCode = 404; res.end("connect error: "+target_url); });
			return;
		}
	}

	res.statusCode = 404;
	res.end('no matching routes');
}



// run daemon
http.createServer(process_routing).listen(80, config.bind_ip);
option = {
	key: fs.readFileSync('TEST.co.kr.key'),
	cert: fs.readFileSync('TEST.co.kr.crt'),
}
https.createServer(option, process_routing).listen(443, config.bind_ip);
