exports.name = 'Long test';

exports.description = 'Simple long test that shows how tests are working';

exports.path = '';

exports.init = function (ws, api) {
    ws.on('message', function (message) {
        api.checkpoint('> ' + message);

        message = message.split(':');

        if (message[0] === 'pong') {
            ws.send('concat:1:'+10000000+':'+1005000);
        } else if (message[0] === 'concat1') {
            ws.send('concat:2:'+10406070+':'+1005010);
        } else if (message[0] === 'concat2') {
            ws.send('concat:3:'+10446219+':'+9705111);
        } else if (message[0] === 'concat3') {
            ws.close();
        }
    });

    ws.send('ping');
};
