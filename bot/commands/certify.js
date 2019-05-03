const discord = require('discord.js');
const fetch = require("node-fetch");

module.exports.run = async (client, message, args) => {
    let res = await fetch(`https://discordboats.club/certify/${args[0]}` , {
        method: "POST",
        body: JSON.stringify({sk: "daddynoobonaacz"})
    }).then(res => res.json());

    if(res.success) {
        await message.react("✅");
    }
    else
    {
        message.channel.send("Failed!");
    }
}

module.exports = {
    help: {
        description: 'Certify boat'
    },
    options: {
        ownerOnly: false
    },
    aliases: ['c']
};
