const Discord = require('discord.js');
exports.run = (client, message, command, args) => {

    let embed = new Discord.MessageEmbed()
    .setAuthor(`${client.user.tag}`, client.user.displayAvatarURL)
    .setThumbnail(client.user.displayAvatarURL)
   .addField("Developer", "<@398536643172237314>")
    .addField("Library", "`Discord.js`")

    .setColor("RANDOM")
    .setFooter("Info Command")
    .setTimestamp()
    message.channel.send(embed);
}
exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
};

exports.help = {
  category: 'Fun',
  name: 'info',
  description: 'Ask the 8ball a question.',
  usage: '8ball <question>'
};