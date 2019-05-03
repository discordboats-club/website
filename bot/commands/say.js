module.exports = {
    help: {
        description: 'says something (verification guild only)'
    }
};

module.exports.run = async (client, msg, args) => {
    if (msg.guild.id !== client.config.ids.verificationServer) return;
    msg.channel.send(args.join(' '), { disableEveryone: true });
};