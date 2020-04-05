module.exports = {
    help: {
        description: 'shows bot latency'
    }
};

module.exports.run = async (client, msg) => {
    const ping = await msg.channel.send(':ping_pong: Ping!');
    ping.edit(`:clock1030: Pong! ${ping.createdTimestamp - msg.createdTimestamp}ms response\n:sparkling_heart:  ${Math.round(client.ws.ping)}ms API heartbeat`);
};