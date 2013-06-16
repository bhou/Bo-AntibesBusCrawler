/**
 * define all the util functions, program runs at the bottom
 */
var schedule = require('node-schedule');
var http = require('http');
var fs = require('fs');
var urlHelper = require('url');

var SCRAPY_ROOT = '/home/bhou/git_repo/Bo-AntibesBusCrawler/AntibesBusCrawler/AntibesBusCrawler';


var _mergedStopCache = null;
var _linePdfCache = null;

// http server to provide the data access
function serverCallback(req, res){
	var urlPath = urlHelper.parse(req.url).pathname;

	if (urlPath == '/') {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('Hello World\n');
	} else if (urlPath == '/stopMap') {
		res.writeHead(200, {'Content-Type': 'application/json'});
		if (_mergedStopCache == null) {
			if (fs.existsSync(SCRAPY_ROOT + '/mergedStop.json')) {
				// var output = require(SCRAPY_ROOT + '/mergedStop.json');
				// _mergedStopCache = JSON.stringify(output, null, 2);
				_mergedStopCache = fs.readFileSync(SCRAPY_ROOT + '/mergedStop.json', 'utf8');
				console.log('updated the merged stop cache')
			} 
		}
		res.end(_mergedStopCache);
	} else if (urlPath == '/linePdf') {
		res.writeHead(200, {'Content-Type': 'application/json'});
		if (_linePdfCache == null) {
			if (fs.existsSync(SCRAPY_ROOT + '/busLinePdf.json')) {
				_linePdfCache = fs.readFileSync(SCRAPY_ROOT + '/busLinePdf.json', 'utf8');
				console.log('updated the line pdf cache')
			} 
		}
		res.end(_linePdfCache);
	}
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
			cwd: SCRAPY_ROOT
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

  	if (fs.existsSync(SCRAPY_ROOT + '/' + output)) {
  		fs.unlink(SCRAPY_ROOT + '/' + output, function (err) {
	  		if (err) throw err;
	  		console.log('successfully deleted ' + SCRAPY_ROOT + '/' + output);
		});
  	}

	var spawn = require('child_process').spawn;
	var child = spawn('scrapy',
		[
			'crawl', 'RealTimeScheduleSpider',
			'-a', 'start_url=' + url,
			'-o', output,
			'-t', 'json'
		], 
		{
			cwd: SCRAPY_ROOT,
			detached: true,
			stdio: ['ignore', out, err]
		});

	child.unref();
}

function startBusLinePdfCrawl(args) {
	var output = args['output'];

	console.log('start bus line pdf crawling job');

	var fs = require('fs'),
		out = fs.openSync('./out.log', 'a'),
		err = fs.openSync('./err.log', 'a');

  	if (fs.existsSync(SCRAPY_ROOT + '/' + output)) {
  		fs.unlink(SCRAPY_ROOT + '/' + output, function (err) {
	  		if (err) throw err;
	  		console.log('successfully deleted ' + SCRAPY_ROOT + '/' + output);
		});
  	}

  	var spawn = require('child_process').spawn;
	var child = spawn('scrapy',
		[
			'crawl', 'LinePDFSpider',
			'-o', output,
			'-t', 'json'
		], 
		{
			cwd: SCRAPY_ROOT,
			detached: true,
			stdio: ['ignore', out, err]
		});

	child.unref();
}

// merge the src list to the dest list
function merge(src, dest) {
	var len = src.length;

	var existed = false;
	var directionExisted = false;

	var destDirections = null;
	var srcDirections = null;

	for (var i = 0; i < len; i++) {
		existed = false;
		// check if dest contains the stop
		for (var j = 0; j < dest.length; j++) {
			if (src[i].code == dest[j].code) {
				existed = true;

				// merge the directions
				srcDirects = src[i].directions == null ? [] : src[i].directions;
				destDirects = dest[j].directions == null ? [] : dest[j].directions;
				for (var u = 0; u < srcDirects.length; u++) {
					directionExisted = false;
					for (var v = 0; v < destDirects.length; v++) {
						if (srcDirects[u].code == destDirects[v].code && 
							srcDirects[u].lineNo == destDirects[v].lineNo &&
							srcDirects[u].name == destDirects[v].name) {
							directionExisted = true;
							break;
						}
					}
					if (!directionExisted) {
						destDirects.push(srcDirects[u]);
					}
				}

				break;
			}
		}
		if (!existed) {
			dest.push(src[i]);
		}
	}
}

function mergeBusMap(args){
	console.log('start merge job');
	var list = args['list'];
	var len = list.length;

	// load all the files
	var files = [];
	var content = null;
	var data = null;
	for (var i = 0; i < len; i++) {
		if (fs.existsSync(SCRAPY_ROOT + '/' + list[i])) {
			content = fs.readFileSync(SCRAPY_ROOT + '/' + list[i], 'utf8');
			data = JSON.parse(content);
			files.push(data);
		}
	}

	// merge them
	var ret = files[0];
	for (var i = 1; i < len; i++) {
		merge(files[i], ret);
	}

	// write to file
	fs.writeFile(SCRAPY_ROOT + '/mergedStop.json', JSON.stringify(ret, null, 2), function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("save merge result to: " + SCRAPY_ROOT + '/mergedStop.json');
			_mergedStopCache = null;
		}
	});
}


/**
 * start from here 
 */

var server = http.createServer(serverCallback);
server.listen(80, '0.0.0.0');
console.log('Server running at http://0.0.0.0:8000');


var minute = 0;
var hour = 8;
// job to access the Valbonne bus map, scheduled every day morning at 7:00 am
scheduleJob(hour, minute, startBusMapCrawlEx, 
	{'url':'http://tempsreel.envibus.fr/list/?com_id=3&letter=*', 'output':'valbonne.json'});

// job to access the Antibes bus map, scheduled every day morning at 7:10 am
scheduleJob(hour+1, minute, startBusMapCrawlEx, 
	{'url':'http://tempsreel.envibus.fr/list/?com_id=1&letter=*', 'output':'antibes.json'});

// job to access the Antibes bus map, scheduled every day morning at 7:20 am
scheduleJob(hour+2, minute, startBusMapCrawlEx, 
	{'url':'http://tempsreel.envibus.fr/list/?com_id=4&letter=*', 'output':'biot.json'});

// job to merge all the bus map to one map, scheduled every day morning at 7:30 am
scheduleJob(hour+3, minute, mergeBusMap, {'list':['antibes.json', 'valbonne.json', 'biot.json']});

// job to access the bus line
scheduleJob(hour+4, minute, startBusLinePdfCrawl, {'output':'busLinePdf.json'});

