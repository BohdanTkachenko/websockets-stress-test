function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

var
    wsio = require('websocket.io'),
    ws = wsio.listen(8080, function () {
        console.error('\033[96m ∞ listening on http://127.0.0.1:8080 \033[39m');
    }),
    send = function (client, message) {
        client.send(message);
        console.log('\033[32m < ' + message + ' \033[0m');
    };

ws.on('connection', function (client) {
    client.on('message', function (message) {
        console.log('\033[35;1m > ' + message + ' \033[0m');

        message = message.split(':');

        if (message[0] === 'ping') {
            send(client, 'pong');
        } else if (message[0] === 'concat') {
            var str1, str2, str3;

            str1 = randomString(message[2]);
            str2 = randomString(message[3]);

            str3 = str1 + str2;

            send(client, 'concat' + message[1] + ':' + str3.length);
        }
    });
});
