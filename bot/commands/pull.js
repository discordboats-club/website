const { promisify } = require('util');
const cp = require('child_process');
const exec = promisify(cp.exec);

module.exports = {
    help: {
        description: 'pulls from the github origin `old` branch'
    },
    options: {
        ownerOnly: false
    },
    aliases: ['git']
};

module.exports.run = async (client, msg, args) => {
    try {
        const result = await exec('git pull origin 2.0');
        await msg.channel.send(`Pulled successfully! Restarting... \`\`\`\n${result.stderr + result.stdout}\n\`\`\``);
        process.exit();
    } catch (e) {
        msg.channel.send(`Error pulling: \`\`\`\n${e}\n\`\`\``);
    }
};
