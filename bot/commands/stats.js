const Discord = require('discord.js');
const osu = require('os-utils');
const os = require('os');
const cpu = require('windows-cpu')
 cpu.cpuInfo().then(cpus => {        })
        let cpus = cpu.cpuInfo();
const getUT = function(ms) {
    var s = Math.floor(ms/1000); ms %= 1000;
    var m = Math.floor(s/60); s %= 60;
    var h = Math.floor(m/60); m %= 60;
    var d = Math.floor(h/24); h %= 24;
    var w = Math.floor(d/7); d %= 7;
    return `${d}d : ${h}h : ${m} min : ${s} sec`;
};
let totmem = ((process.memoryUsage().heapTotal) + (process.memoryUsage().rss) + (process.memoryUsage().external));
const used = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
let total = `${(totmem / 1024 / 1024).toFixed(2)} MB`;

exports.run = (client, message, args) => {

	let botembed = new Discord.MessageEmbed()
		.setColor('RANDOM')
		.setAuthor('Bot Stats')
     		.setThumbnail(message.guild.iconURL, true)
                .addField('**<:tools:554713650707824642> VPS**', `**Hostname** - ${os.hostname()}\n **VPS Uptime** - ${os.uptime()} hours\n **CPU** - ${os.cpus().map(i => `${i.model}`)[0]}\n **CPU Cores** - ${os.cpus().length}\n **CPU Usage** - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} %\n  **Platform** - ${os.type}\n **Memory Total** - ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB\n **Memory Used** - ${used}\n  `, true)
                .addField("**<:tools:554713650707824642> Bot Misc Stats**", `**Commands** - ${client.commands.size}\n **Node Version** - ${process.version}`)
		.setFooter(`Requested by: ${message.author.username}`, message.author.avatarURL)
		
	message.channel.send(botembed);

}
exports.help = {
  name: 'stats',
};
