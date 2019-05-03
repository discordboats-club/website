module.exports = {
    help: {
        description: 'Add a role to a person'
    }
};

module.exports.run = async (client, msg, args) => {
    if (!msg.member.permissions.has("MANAGE_SERVER")) return msg.reply("you cannot use this command!");
    let member = msg.guild.member(msg.mentions.users.first()) || msg.guild.members.get(args[0]);
    if (!member) return msg.channel.send(`<:customX:485196473441583134> Couldn't find that user`)
    let rolle = args.slice(1).join(' ');
    if (!rolle) return msg.channel.send(`<customX:485196473441583134> Please specifiy a role`);
    let gRole = msg.guild.roles.find(role => role.name === rolle) 
    if (!gRole) return msg.channel.send(`<:customX:485196473441583134> Couldn't find that role`);

    if (member.roles.has(gRole.id)) return msg.channel.send(`<:customX:485196473441583134> That user already has that role`);
    member.roles.add(gRole.id, `addrole cmd used to add ${gRole.name} to ${member.user.tag}`).then(() => {
        msg.channel.send(`<:customCheck:485196148064256019> Added role **${gRole.name}** to <@${member.id}>`)
    }).catch((e) => {
        msg.channel.send(`<:customX:485196473441583134> An unexpected error has occurred while adding the role to <@${member.id}>. The error has been logged `);
        console.log(e);
    });
};