const Discord = require('discord.js');
let longify = require('nekos-longify-function');

exports.run = (client, message, args) => {
  let guild = message.guild;
  let icon = message.guild.iconURL;
  let createdAtRaw = guild.createdAt.toDateString();
  let createdAt = createdAtRaw.split(" ");
  let bots = message.guild.members.filter(m => m.user.bot).size;
  let humans = message.guild.members.filter(m => !m.user.bot).size;
  let channels = message.guild.channels.size;
  let textChannels = message.guild.channels.filter(m => m.type == "text").size;
  let voiceChannels = message.guild.channels.filter(i => i.type == "voice").size;
  let emojis = [];
  guild.emojis.forEach(emoji => {
  emojis.push(`\`${emoji}\``);
  });
  emojis.length === 0 ? emojis = "None" : emojis = emojis.join(", ");

  let roles = [];
  guild.roles.forEach(role => {
    roles.push(`\`${role.name}\``);
  });
  roles = roles.join(", ");
  const highestRole = message.guild.roles.sort((a, b) => a.position - b.position).map(role => role.toString()).slice(1).reverse()[0]
  let Embed = new Discord.MessageEmbed()
  .setTitle(`Server Info`)
  .setColor('RANDOM')
  .setThumbnail(icon)
  .addField("Guild Name", guild.name, true)
  .addField("Guild ID", guild.id, true)
  .addField("Guild Owner", `${guild.owner.user.tag}`, true)
  .addField("Region", guild.region.toUpperCase(), true)
  .addField("Total Members:", guild.memberCount, true)
  .addField("Bots:", bots, true)
  .addField("Users:", humans, true)
  .addField(`Features`, `${message.guild.features.join(', ') || 'None'}`, true)
  .addField("Online", guild.members.filter(mem => mem.presence.status != "online").size, true)
  .addField("Offline ", guild.members.filter(mem => mem.presence.status != "offline").size, true)
  .addField("Verification Level", guild.verificationLevel, true)
  .addField("Text Channels", textChannels, true)
  .addField("Voice Channels", voiceChannels, true)
  .addField("Emojis", `${guild.emojis.size}`, true)
  .addField("Roles", message.guild.roles.size,true)
  .addField('Highest Role', `${highestRole}`, true)  

.setDescription(`Created At ${longify(message.guild.createdAt)} GMT-500`)

  message.channel.send(Embed);
}


exports.help = {
  category: 'Fun',
  name: 'serverinfo',
  description: 'Ask the 8ball a question.',
  usage: '8ball <question>'
};