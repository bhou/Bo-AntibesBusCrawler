/**
 * define all the util functions, program runs at the bottom
 */
var schedule = require('node-schedule');
var http = require('http');


// http server to provide the data access
function serverCallback(req, res){
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hello World\n');
}



function scheduleJob(hour, minute, jobCb, args){
	var rule = new schedule.RecurrenceRule();
	rule.hour = hour;
	rule.minute = minute;

	var job = schedule.scheduleJob(rule, function(){
		jobCb(args);
	});
}

// function to crawl bus map
function startBusMapCrawl(args){
	var url = args['url'];
	var cmd = 'scrapy crawl RealTimeScheduleSpider -a start_url="';
	var output = 'stopMap_valbonne.json'
	var options = '" -o ' + output + ' -t json';

	console.log('start bus map crawling job <' + url +'>');
	cmd = cmd + url + options;
	console.log('cmd: ' + cmd);
	var exec = require('child_process').exec;
	exec(cmd, 
		{
			cwd: '/media/Seconde/share/python/Bo-AntibesBusCrawler/AntibesBusCrawler/AntibesBusCrawler'
		},
		function(error, stdout, stderr){
			console.log('stdout: ' + stdout);
    		console.log('stderr: ' + stderr);
			if (error !== null){
				console.log('exec error: ' + error);
			}

			console.log('finish retrieving data from <' + url + '>');
		});
}

function startBusMapCrawlEx(args){
	var url = args['url'];
	var output = args['output'];

	console.log('start bus map crawling job <' + url +'>');

	var fs = require('fs'),
		out = fs.openSync('./out.log', 'a'),
		err = fs.openSync('./err.log', 'a');

	var spawn = require('child_process').spawn;
	var child = spawn('scrapy',
		[
			'crawl', 'RealTimeScheduleSpider',
			'-a', 'start_url=' + url,
			'-o', output,
			'-t', 'json'
		], 
		{
			cwd: '/media/Seconde/share/python/Bo-AntibesBusCrawler/AntibesBusCrawler/AntibesBusCrawler',
			detached: true,
			stdio: ['ignore', out, err]
		});

	child.unref();
}

function mergeBusMap(args){
	console.log('start merge job');
}




/**
 * start from here 
 */

var server = http.createServer(serverCallback);
server.listen(8000);
console.log('Server running at http://127.0.0.1:8000');


var minute = 31;
// job to access the Valbonne bus map, scheduled every day morning at 2:00 am
scheduleJob(18, minute, startBusMapCrawlEx, 
	{'url':'http://tempsreel.envibus.fr/list/?com_id=3&letter=*', 'output':'valbonne.json'});

// job to access the Antibes bus map, scheduled every day morning at 3:00 am
scheduleJob(18, minute+1, startBusMapCrawlEx, 
	{'url':'http://tempsreel.envibus.fr/list/?com_id=1&letter=*', 'output':'antibes.json'});

// job to merge all the bus map to one map, scheduled every day morning at 5:00 am
scheduleJob(19, minute+2, mergeBusMap, {});
