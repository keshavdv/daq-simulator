var fs = require("fs")
var p = require("node-protobuf") 
var net = require('net');

var pb = new p(fs.readFileSync("messages.desc"))
var dev = {
	model: 'DAQ v1',
	sensors: [
		{
			id: 1, 
			type: "DIGITAL",
			name: "Digital 1"
		},
		{
			id: 2, 
			type: "DIGITAL",
			name: "Digital 2"
		}
	]
}
var device_message = pb.serialize(dev, "DeviceInfo")
var clients = [];

net.createServer(function (socket) {
  socket.name = socket.remoteAddress + ":" + socket.remotePort 
  clients.push(socket);
  console.log("Sending device information to " + socket.name);
  socket.write(device_message);

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
  	socket.write(msg);
  	time++;
  }, 1000)

}).listen(5000);
 
function broadcast(message) {
	clients.forEach(function (client) {
	  client.write(message);
	});
}

// Put a friendly message on the terminal of the server.
console.log("DAQ server running at port 5000\n");
