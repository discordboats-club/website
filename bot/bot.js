const { Client } = require('discord.js');
const { r } = require('../ConstantStore');
const { readdir } = require('fs').promises;
const client = module.exports = new Client({ disableEveryone: true });
const config = require('../config.json');

client.config = config;
client.commands = new Map();

client.login(client.config.token);

(async () => {
    try {

        const commands = (await readdir(`${__dirname}/commands`)).filter(e => e.endsWith('.js')).map(e => e.slice(0, -3));
        for (const c of commands) {
            const lCommand = c.toLowerCase();
            let { help, options, aliases, run } = require(`./commands/${c}`);
            
            if (typeof help !== 'object') help = {};
            if (typeof help.usage !== 'string' || !help.usage) help.usage = '';
            if (typeof help.description !== 'string' || !help.description) help.description = 'No description';
            if (typeof options !== 'object') options = {};
            if (typeof options.ownerOnly !== 'boolean') options.ownerOnly = false;
            if (!Array.isArray(aliases)) aliases = [];

            aliases = aliases.filter(a => a && typeof a === 'string');
            const commandObject = { name: c, help, options, aliases, run };
            client.commands.set(lCommand, commandObject);
            aliases.forEach(a => client.commands.set(a.toLowerCase(), commandObject));

    }} catch (e) {

        console.error('Error while loading events/commands:');
        console.error(e);
        process.exit();

    }
})();

client.on('message', async msg => {
        if (msg.author.bot) return;

        const prefixes = [client.config.botPrefix, `<@${client.user.id}>`, `<@!${client.user.id}>`];
        const prefix = prefixes.filter(p => msg.content.toLowerCase().startsWith(p.toLowerCase()))[0];
        if (!prefix) return;

        const args = msg.content.slice(prefix.length).trim().split(/ +/g);
        const command = client.commands.get(args.shift().toLowerCase());
        if (!command) return;

        const owner = client.config.evalUsers.indexOf(msg.author.id) !== -1;
        if (command.options.ownerOnly && !owner) return;

        try {
            await command.run(client, msg, args);

        } catch (e) {
            console.error(`Error while running the ${command.name} command:`);
            console.error(e);
        }
});

client.on('ready', () => {
    console.log(`[Discord] logged in as ${client.user.tag}`);
    client.user.setActivity('over discordboats.club', { type: 'WATCHING' });
});

client.on('guildMemberAdd', async member => {
    if (member.guild.id !== config.ids.mainServer) return;
    const bot = await r.table('bots').get(member.id);
    if (!bot || !bot.verified) return;
    member.roles.add(config.ids.botRole).catch(() => { });
});

client.on('guildMemberRemove', async member => {
    if (member.guild.id !== config.ids.mainServer) return;
    const staffChannel = client.channels.get(config.ids.staffChannel);
    if (member.user.bot) {
        const bot = await r.table('bots').get(member.user.id);
        if (!bot) return;
        const owner = await client.users.fetch(bot.ownerID);
        staffChannel.send(`**${member.user.tag}** (\`${member.user.id}\`) left the main server, but is currently listed. Its owner is **${owner.tag}** (\`${owner.id}\`>)\nDelete it at: <${config.baseURL}/dashboard/bot/${member.user.id}/manage>`);
    }
    else {
        const bots = await r.table('bots').filter({ ownerID: member.user.id });
        if (!bots.length) return;
        staffChannel.send(`**${member.user.tag}** (\`${member.user.id}\`) left the main server, but they have **${bots.length}** bot${bots.length === 1 ? '' : 's'} on the list. They are:\n${bots.map(b => ` - ${b.name} (Deletion URL: <${config.baseURL}/dashboard/bot/${b.id}/manage>)`).join('\n')}`);
    }
});
