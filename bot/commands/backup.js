const { promisify } = require('util');
const cp = require('child_process');
const exec = promisify(cp.exec);

module.exports = {
    help: {
        description: 'backup the database'
    },
    options: {
        ownerOnly: true
    }
};

module.exports.run = async (client, msg, args) => {
    try {
        const result = await exec('cd /home/dboats/backup && rethinkdb dump -e discordboatsclubv1 && cd ../dboats/bot');
        await msg.channel.send('Successfully backed the database up.');
    } catch (e) {
        msg.channel.send(`Error backing the db up: \`\`\`\n${e}\n\`\`\``);
    }
};
