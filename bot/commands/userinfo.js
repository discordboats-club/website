const moment = require("moment");
const Discord =require("discord.js");
let longify = require('nekos-longify-function');

exports.run = (client, message, args) => {
 let user = message.mentions.users.first()||message.author; // Get User from mention
let member = message.guild.member(user);
 let roles= message.guild.members.find(m => m.id == message.author.id).roles.array();
  let roleMsg = "";
  let embed = new Discord.MessageEmbed() // Embed constructor
  .setThumbnail(user.displayAvatarURL)
  .setColor('RANDOM') // Generates random color
  .addField('Username', ` ${user.username}`)
  .addField("Bot", user.bot ? 'Yes' : 'No', true) // Username
  .addField('ID', `${user.id}`, true) // User ID
  .addField('Status:', user.presence.status, true) // User status (online, idle, do not disturb, invisible/offline)
 .addField('Server Join Date', moment.utc(member.joinedAt).format('MM/DD/YYYY h:mm A'), true)
 .addField('Created At', `${longify(member.user.createdAt)} GMT-500`, true) //The time the user was created || .createdTimestamp - The timestamp the user was created at
  .addField('Server Nickname', message.guild.member(user).displayName, true)
  .addField('Playing', `${user.presence.game ? user.presence.game.name : 'None'}`,true)
  .addField('Voice Channel', `${message.guild.member(user).voiceChannel ? message.guild.member(user).voiceChannel.name : 'None'}`, true)
.addField("Server Highest Role", member.highestRole, true)
   .addField("Roles", member.roles.array().slice(1).sort((a, b) => b.position - a.position).join(' '), true)
  message.channel.send(embed) // Sends the embed in the channel
}


exports.help = {
  category: 'Moderation',
  name: 'userinfo',
  alias: "whois",
  description: 'Check Infomation About A User',
  usage: 'user <user>'
};