const Discord = require('discord.js');
exports.run = (client, message, args) => {
  let name = message.content.split(" ").splice(1).join(" ");
  let role = message.guild.roles.find(x => x.name === name)||message.mentions.roles.first()||message.guild.roles.get(name);
    if (!role) role = message.member.highestRole;


    // Define our embed
    const embed = new Discord.MessageEmbed()
        .setColor("RANDOM")
        .setTitle(`Role: ${role.name}`)
        .addField('Members', role.members.size, true)
        .addField('Hex', role.hexColor, true)
        .addField('Creation Date', role.createdAt.toDateString(), true)
        .addField('Editable', role.editable.toString(), true)
        .addField('Managed', role.managed.toString(), true)
 .addField('ID', role.id, true)

.addField('Permissions', `\`\`\`${message.channel.permissionsFor(role).toArray().map(p => p).join('\n')}\`\`\``);     
    return message.channel.send({
        embed: embed
    });
};
exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
};

exports.help = {
  category: 'Fun',
  name: 'roleinfo',
  description: 'Ask the 8ball a question.',
  usage: '8ball <question>'
};