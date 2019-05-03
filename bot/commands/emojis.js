const Discord = require('discord.js')
module.exports.run = async (client, message, args) => {
const List = message.guild.emojis.map(e => e.toString()).join(" ");
 message.channel.send('Server Emoji\'s') //Titl
message.channel.send(List)
        //------------------------------------------------------------------------------
        //If You pefer not to send in an Embed
        //Try
}
exports.help = {
  name: 'emojis',
  };