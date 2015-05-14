var fs = require("fs")
var p = require("node-protobuf") 
var net = require('net');

var pb = new p(fs.readFileSync("messages.desc"))
var dev = {
	model: 'DAQ v1',
	sensors: []
}
var config = []
for (var i = 0 ; i < 24; i++) {
	dev.sensors.push({id: i, type: "DIGITAL", name: "Digital " + i})
	config.push({id: i, enabled: false, frequency: 500})
}

var device_message = pb.serialize(dev, "DeviceInfo")
var clients = [];

net.createServer(function (socket) {
	buffer = new Buffer(16000);
	socket.name = socket.remoteAddress + ":" + socket.remotePort 
	clients.push(socket);
	console.log("Sending device information to " + socket.name);
	sendBuffer(device_message, socket);

	var started = false;
	var interval;

	socket.on('data', function (data) {
		try {
			var cmd = pb.parse(data, "DeviceControl")
		}  catch (e) {
			console.log("Error parsing command.")
		}
		console.log(cmd);
		switch(cmd.action) {
			case "START":
				if (!started) {
					var time = 0;
					interval = setInterval(function() {
						var updates = {
							timestamp: time,
							messages: []
						}
						for (var i = 0 ; i < dev.sensors.length; i++) {
							if(getConfig(dev.sensors[i].id).enabled) updates.messages.push({id: dev.sensors[i].id, value: 100*Math.random()})
						}
						msg = pb.serialize(updates, "SensorUpdate")
						console.log("Sending sensor updates to " + socket.name)
						sendBuffer(msg, socket)
						time++;
					}, 1000)
					started = true;
				}
				break;
			case "STOP":
				if (started) {
					clearInterval(interval);
					started = false;
				}
				break;
			case "GET_CONFIG":
				console.log(config);
				msg = pb.serialize({sensors: config}, "DeviceConfiguration")
				console.log(msg);
				console.log("Sending config to " + socket.name)
				sendBuffer(msg, socket)
				break;
			case "SET_CONFIG":
				console.log("setting input.");
				config.forEach(function(v) {
					if(v.id == cmd.config.id) {
						v.enabled = cmd.config.enabled;
					}
				})
				break;
		}
	});

	socket.on('error', function () {
		clearInterval(interval);
	});

	socket.on('end', function () {
		clients.splice(clients.indexOf(socket), 1);
	});	

	function sendBuffer(buffer, socket) {
		msg_len = Buffer(4);
		msg_len.writeUInt16LE(buffer.length);
		console.log(Buffer.concat([msg_len, buffer]));
		socket.write(Buffer.concat([msg_len, buffer]));
	}

	function getConfig(id) {
		for (var i = 0 ; i < config.length; i++) {
			if(config[i].id == id) {
				return config[i];
			}
		}
	}

}).listen(5000);
 
function broadcast(message) {
	clients.forEach(function (client) {
		client.write(message);
	});
}

// Put a friendly message on the terminal of the server.
console.log("DAQ server running at port 5000\n");
