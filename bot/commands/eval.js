const { inspect } = require('util');
const { r } = require('../../ConstantStore')
const Discord = require('discord.js');

module.exports = {
    help: {
        description: 'evaluate js (runs of evalUsers)'
    },
    options: {
        ownerOnly: true
    },
    aliases: ['ev']
};

module.exports.run = async (client, msg, args) => {
    const input = args.join(' ');
    if (!input) return msg.channel.send('Input is required');
    let result = null;
    let error = false;
    try {
        result = await eval(input);
    } catch (e) {
        result = e.toString();
        error = true;
    }
    const inputMessage = `Input:\`\`\`js\n${input}\n\`\`\``;
    const message = `${inputMessage} Output:\`\`\`js\n${error ? result : inspect(result)}\n\`\`\``;
    if (message.length > 2000) return msg.channel.send(`${inputMessage} Output: \`\`\`\nOver 2000 characters\n\`\`\``);
    msg.channel.send(message);
};