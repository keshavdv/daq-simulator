var fs = require("fs")
var p = require("node-protobuf") 
var net = require('net');

var pb = new p(fs.readFileSync("messages.desc"))
var dev = {
	model: 'DAQ v1',
	sensors: []
}
for (var i = 0 ; i < 32; i++) {
	dev.sensors.push({id: i, type: "DIGITAL", name: "Digital " + i})
}

var device_message = pb.serialize(dev, "DeviceInfo")
var clients = [];

net.createServer(function (socket) {
	buffer = new Buffer(16000);
	socket.name = socket.remoteAddress + ":" + socket.remotePort 
	clients.push(socket);
	console.log("Sending device information to " + socket.name);
	sendBuffer(device_message, socket);

	socket.on('data', function (data) {
		console.log(data)
		// TODO: handle config messages
	});

	socket.on('end', function () {
		clients.splice(clients.indexOf(socket), 1);
	});

	var time = 0;
	setInterval(function() {
		var updates = {
			timestamp: time,
			messages: []
		}
		for (var i = 0 ; i < dev.sensors.length; i++) {
			updates.messages.push({id: dev.sensors[i].id, value: 100*Math.random()})
		}
		msg = pb.serialize(updates, "SensorUpdate")
		console.log("Sending sensor updates to " + socket.name)
		sendBuffer(msg, socket)
		time++;
	}, 1)

	function sendBuffer(buffer, socket) {
		msg_len = Buffer(4);
		msg_len.writeUInt16LE(buffer.length);
		socket.write(Buffer.concat([msg_len, buffer]));
	}

}).listen(5000);
 
function broadcast(message) {
	clients.forEach(function (client) {
		client.write(message);
	});
}

// Put a friendly message on the terminal of the server.
console.log("DAQ server running at port 5000\n");
