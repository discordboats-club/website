const { r } = require('../../ConstantStore.js');

module.exports = {
    help: {
        description: 'fixes bot stuff'
    },
    options: {
        ownerOnly: true
    }
};

module.exports.run = async (client, msg, args) => {
    const bots = await r.table('bots');
    bots.forEach(async(bot) => {
        const user = await client.users.fetch(bot.id);
        if (!user || !user.id) return;
        await r.table('bots').get(bot.id).update({ name: user.username });
    });
    msg.channel.send('Ok, I tried my best to fix the bots.');
};
