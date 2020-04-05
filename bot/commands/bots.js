const { resolveUser } = require('../../Util.js');
const { r } = require('../../ConstantStore.js');

module.exports = {
    help: {
        description: 'what bots a user owns'
    }
};

module.exports.run = async (client, msg, args) => {
    const user = (await resolveUser(msg, args, client)) || msg.author;
    if (user.bot) return msg.channel.send("A bot can't own bots!");
    const you = user.id === msg.author.id;
    const userBots = await r.table('bots').filter({ ownerID: user.id });
    if (!userBots.length) return msg.channel.send(`${you ? 'You' : 'That user'} ${you ? 'have' : 'has'} no bots`);
    const botsEmbed = {
        title: `${you ? 'Your' : `${user.username}'s`} bot${userBots.length === 1 ? '' : 's'}`,
        color: client.config.embedColor,
        thumbnail: {
            url: user.displayAvatarURL()
        },
        description: userBots.map(b => `<@${b.id}>`).join('\n'),
        footer: {
            text: `User Bots | Requested by ${msg.author.username}`,
            icon_url: client.user.displayAvatarURL()
        }
    };
    msg.channel.send({ embed: botsEmbed });

};