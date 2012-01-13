exports.name = 'Short test';

exports.description = 'Simple short test that shows how tests are working';

exports.path = '';

exports.init = function (ws, api) {
    ws.on('message', function (message) {
        api.checkpoint('> ' + message);

        message = message.split(':');

        if (message[0] === 'pong') {
            ws.send('concat:1:'+10000+':'+100050);
        } else if (message[0] === 'concat1') {
            ws.send('concat:2:'+10040+':'+10000);
        } else if (message[0] === 'concat2') {
            ws.send('concat:3:'+21900+':'+97000);
        } else if (message[0] === 'concat3') {
            ws.close();
        }
    });

    ws.send('ping');
};
