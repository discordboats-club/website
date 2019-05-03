module.exports = {
    help: {
        description: 'help'
    },
    aliases: ['commands', 'cmds']
};

module.exports.run = async (client, msg) => {
    msg.channel.send({
        embed: {
            title: 'Help',
            color: client.config.embedColor,
            footer: {
                text: `Help | Requested by ${msg.author.username}`,
                icon_url: client.user.displayAvatarURL()
            },
            fields: [
                {
                    name: 'Help',
                    value: `Lists all bot commands\n\n**Usage:**\n\`${client.config.botPrefix}[help|cmds|commands]\``
                },
                {
                    name: 'Botinfo',
                    value: `Supplies info for a bot\n\n**Usage:**\n\`${client.config.botPrefix}botinfo <bot>\``
                },
                {
                    name: 'Say',
                    value: `Makes the bot say something\n\n**Usage:**\n\`${client.config.botPrefix}say <message>\``
                },
                {
                    name: 'Addrole',
                    value: `Gives a role to a person\n\n**Usage:**\n\`${client.config.botPrefix}addrole <user> <role>\``
                },
                {
                    name: 'Remrole',
                    value: `Removes a role from a person\n\n**Usage:**\n\`${client.config.botPrefix}remrole <user> <role>\``
                },
                {
                    name: 'Eval',
                    value: `Evaluate some code with the bot\n\n**Usage:**\n\`${client.config.botPrefix}eval <code>\``
                },
                {
						name: 'roleinfo',
					value: `Responds With role infomation\n\n**Usage:**\n\`${client.config.botPrefix}roleinfo <role>\``
				},
                {
					name: 'userinfo',
					value: `Responds With user infomation\n\n**Usage:**\n\`${client.config.botPrefix}userinfo <user>\``
                },
                {
                    name: 'Uptime',
                    value: `Responds with the site\'s uptime`
				},
                {
					name: 'stats',
					value: `Responds with bot and vps information`
				},
                {
					name: 'serverinfo',
					value: `Responds With server infomation`
				},
                {
				
					name: 'emojis',
					value: `Responds With server emojis`
                }
            ]
        }
    });
};