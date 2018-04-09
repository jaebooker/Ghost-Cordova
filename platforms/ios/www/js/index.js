const express = require("express");
const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;
const http = require('http');
const fs = require('fs');
// creating a server using http module:
var server = http.createServer(function (request, response){
    // see what url the clients are requesting:
    console.log('client request URL: ', request.url);
    // routing:
    if(request.url === '/') {
        fs.readFile('index.html', 'utf8', function (errors, contents){
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(contents);
            response.end();
        });
    }
    // request didn't match anything:
    else {
        response.end('URL not found!!!');
    }
});
// tell your server which port to run on
server.listen(8000);
// print to terminal window
console.log("Running in localhost at port 8000!");

// Connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('Mongo connected');

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(1000).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let age = data.age;
            let location = data.location;
            let gender = data.gender;
            let looking = data.looking;
            let message = data.message;

            // Check for name and message
            if(name == '' || age == '' || location == '' || gender == '' || looking == ''){
                // Send error status
                sendStatus('Please enter name, age, location, gender you identify with, and what you are looking for');
            } else {
                // Insert message
                chat.insert({name: name, age: age, location: location, gender: gender, looking: looking, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});
