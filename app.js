var config = require('./config');
var request = require('request');

var currentIp = '';
var IpCheckTimer;
var updateTimer;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; //Allow https requests with expired certificate

function getRandom(max) {
	return Math.floor(Math.random() * (max - 1));
}

function update(){
	var updateUrl = config.update_url+'?hostname=';
	for(var i = 0; i < config.hosts.length; i++){
		updateUrl += config.hosts[i]+',';
	}
	updateUrl = updateUrl.slice(0, - 1); //Remove last , from list of hosts
	request({
		url: updateUrl,
		auth : {
			'user': config.username,
			'pass': config.password,
		}
	},function(error, response, data) {
		if(!error){
			console.log("Tried to update ip address(es). Got response: "+data);
		}else{
			console.log("Error while updating ip: "+error);
		}
		clearTimeout(updateTimer);
		var milliseconds = config.max_update_interval + getRandom(config.update_random);
		updateTimer = setTimeout(function(){update();}, milliseconds);
	});
}

function getNewIp() {
	request(config.ip_check_url, function(error, response, data) {
		var milliseconds = config.ip_check_interval + getRandom(config.ip_check_random);
		IpCheckTimer = setTimeout(function(){getNewIp();}, milliseconds);
		if(!error){
			var pattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
			var ip = pattern.exec(data)[0];
			console.log("Got ip address: "+ip+" Checking ip next time after "+milliseconds+" ms");
			if(ip !== currentIp){
				currentIp = ip;
				update();
			}
		}else{
			console.log("Error while checking ip");
		}
	});
}

getNewIp(); //Start update cycle

