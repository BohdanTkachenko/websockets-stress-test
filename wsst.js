/*
Copyright (c) 2011 Bogdan Tkachenko <bogus.weber@gmail.com>

Tool written in NodeJS that allows to make a stress test for
your application that uses WebSockets

This file is part of WebSockets Stress Test.

WebSockets Stress Test is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * WebSockets Stress Test
 *
 * Tool written in NodeJS that allows to make a stress test for
 * your application that uses WebSockets. You can create behavior
 * scenarios that tool will run on every connection in test.
 *
 * @author Bogdan Tkachenko <bogus.weber@gmail.com>
 * @version 0.1
 */

var
    cli       = require('cli'),
    WebSocket = require('ws'),
    test,
    multipleTest,
    writeJson;

/**
 * Run single test for given scenario on given URL.
 *
 * Result passed to callback
 *
 * @param webSocketUrl
 * @param scenarioName
 * @param countConnections
 * @param cli
 * @param callback
 */
test = function (webSocketUrl, scenarioName, countConnections, cli, callback) {
    var
        i,
        startTime   = (new Date()).getTime(),
        endTime     = null,
        connections = [],
        scenario    = require(scenarioName[0] === '/' ? scenarioName : './' + scenarioName),
        url         = webSocketUrl + (scenario.path ? scenario.path : '')
        countOpened = 0;

    cli.info('Scenario: ' + scenario.name);
    cli.info(scenario.description);
    cli.info('-----------------------------\n');
    cli.info('Starting test for ' + countConnections + ' connections...');

    for (i=0; i<countConnections; i++) {
        (function(index) {
            var api;

            connections[index] = {
                socket:      new WebSocket(url),
                checkpoints: []
            };

            api = {
                /**
                 * Create checkpoint in scenario
                 *
                 * @param text
                 */
                checkpoint: function (text) {
                    var time = (new Date()).getTime(), count;

                    count = connections[index].checkpoints.length;

                    if (count > 0) {
                        connections[index].checkpoints[count - 1].end = time;
                        connections[index].checkpoints[count - 1].total = time;
                        connections[index].checkpoints[count - 1].total -= connections[index].checkpoints[count - 1].start;
                    }

                    connections[index].checkpoints.push({
                        text:   text,
                        start:  time,
                        end:    time,
                        total:  0
                    });

                    cli.debug('Checkpoint: ' + text);
                }
            };

            connections[index].socket.on('open', function () {
                countOpened++;

                // Add default checkpoint when connection opens
                api.checkpoint('Connection opened');

                // And run scenario on this connection
                scenario.init(connections[index].socket, api);
            });

            connections[index].socket.on('close', function () {
                var i, j, result, connectionTime;

                // Add default checkoint when connection closed
                api.checkpoint('Connection closed');
                countOpened--;

                // If we haven't any another connections
                if (countOpened === 0) {
                    // Save test end time
                    endTime = (new Date()).getTime();

                    // Prepare result
                    result = {
                        connections:  countConnections,
                        scenarioName: scenarioName,
                        url:          url,
                        total:        (endTime - startTime),
                        avg:          0,
                        min:          null,
                        max:          null,
                        checkpoints:  []
                    };

                    for (i in connections) {
                        // Calculate total connection time
                        connectionTime = connections[i].checkpoints[connections[i].checkpoints.length-1].end - connections[i].checkpoints[0].start;

                        result.avg += connectionTime;

                        if (connectionTime < result.min || result.min === null) {
                            result.min = connectionTime;
                        }

                        if (connectionTime > result.max || result.max === null) {
                            result.max = connectionTime;
                        }

                        // And now for every checkpoint
                        for (j in connections[i].checkpoints) {
                            if (!result.checkpoints[j]) {
                                result.checkpoints[j] = {
                                    text: connections[i].checkpoints[j].text,
                                    avg:  0,
                                    min:  null,
                                    max:  null
                                };
                            }

                            result.checkpoints[j].avg += connections[i].checkpoints[j].total;

                            if (result.checkpoints[j].min > connections[i].checkpoints[j].total || result.checkpoints[j].min === null) {
                                result.checkpoints[j].min = connections[i].checkpoints[j].total;
                            }

                            if (result.checkpoints[j].max < connections[i].checkpoints[j].total || result.checkpoints[j].max === null) {
                                result.checkpoints[j].max = connections[i].checkpoints[j].total;
                            }
                        }
                    }

                    result.avg /= countConnections;
                    for (j in result.checkpoints) {
                        result.checkpoints[j].avg /= countConnections;
                    }

                    cli.ok('');
                    cli.ok('Test completed!');
                    cli.ok('--------------------------------------------------');
                    cli.ok('Total test time:             ' + result.total + ' ms.');
                    cli.ok('Average time per connection: ' + result.avg + ' ms.');
                    cli.ok('Minimum connection time:     ' + result.min + ' ms.');
                    cli.ok('Maximum connection time:     ' + result.max + ' ms.');
                    cli.ok('--------------------------------------------------\n');

                    cli.ok('Time profiler:');
                    cli.ok('----------------------------------------------------------------------------------');
                    cli.ok('| #\t| Average\t| Minimum\t| Maximum\t| Name')
                    cli.ok('----------------------------------------------------------------------------------');
                    for (j in result.checkpoints) {
                        cli.ok('| ' + j + '\t| '
                            + result.checkpoints[j].avg + '\t\t| '
                            + result.checkpoints[j].min + '\t\t| '
                            + result.checkpoints[j].max + '\t\t| '
                            + result.checkpoints[j].text);
                    }

                    cli.ok('----------------------------------------------------------------------------------');

                    if (typeof callback === 'function') {
                        callback.call(cli, result);
                    }
                }
            });
        })(i);
    }
};

/**
 * Write test results to file in JSON format
 *
 * @param fileName
 * @param data
 */
writeJson = function (fileName, data) {
    var fs = require('fs');

    // TODO: getting error on this line. don't know how to fix
    //fs.writeFile(fileName, data);
};

/**
 * Run several tests for scenario on given URL
 *
 * @param webSocketUrl
 * @param scenarioName
 * @param countConnections
 * @param cli
 * @param callback
 */
multipleTest = function (webSocketUrl, scenarioName, countConnections, cli, callback) {
    var
        i = 0, results = [];

    var singleTest = function (result) {
        if (result) {
            results.push(result);
        }

        if (countConnections[i]) {
            test(webSocketUrl, scenarioName, countConnections[i], cli, singleTest);
            i++;
        } else {
            callback.call(cli, results);
        }
    };

    singleTest();
};

cli.setUsage(
    cli.app + ' [OPTIONS] <URL> <scenario>\n\n' +
    '\x1b[1mExample\x1b[0m:\n ' +
    ' ' + cli.app + ' --connections 100 ws://localhost:8080 myScenario.js'
);

cli.parse({
    connections:     ['c', 'Single test for specified count of connections', 'int', '100'],
    connectionsList: ['l', 'Multiple tests for specified list count of connections (-l 1,10,100,1000)', 'string'],
    output:          ['o', 'File to save JSON result', 'file']
});

cli.main(function (args, options) {
    if (args.length !== 2) {
        cli.fatal('Wrong number of arguments. Must be exactly 2 arguments! See `' + cli.app + ' -h` for details');
    }

    var connections;

    if (options.connectionsList) {
        connections = options.connectionsList.split(',');

        multipleTest(args[0], args[1], connections, cli, function (result) {
            if (options.output) {
                writeJson(result);
            }
        });
    } else {
        test(args[0], args[1], options.connections, cli, function (result) {
            if (options.output) {
                writeJson([result]);
            }
        });
    }
});
