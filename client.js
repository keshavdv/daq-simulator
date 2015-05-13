var fs = require('fs');
var net = require('net');
var p = require("node-protobuf") 

var pb = new p(fs.readFileSync("messages.desc"))

var deviceDetected = false;

var client = new net.Socket();
client.connect(5000, '127.0.0.1', function() {
	console.log('Connected');
});

var buffer = Buffer(32000)
var data_ready = false
var remaining = 0;
var start = true;


client.on('readable', function() {
  var chunk;
  while (null !== (chunk = client.read(4))) {
	var remaining = chunk.readUInt16LE();
	data = client.read(remaining);    
	if (!deviceDetected) {
		try {
			var device_ident = pb.parse(data, "DeviceInfo")
		}  catch (e) {
			console.log("Invalid device identifier")
		}
		console.log('Found device: ' + device_ident.model);
		for(var i = 0; i < device_ident.sensors.length; i++) {
			console.log('\t' + device_ident.sensors[i].name)
		}
		deviceDetected = true;
	} else {
		// Receive sensor updates
		var update = pb.parse(data, "SensorUpdate");
		console.log("Received update " + update.timestamp)
	}
  }
});
 
client.on('error', function() {
	console.log('Disconnected.');
});

client.on('close', function() {
	console.log('Connection closed.');
});

