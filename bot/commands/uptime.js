module.exports = {
    help: {
        description: 'dboats uptime'
    }
};

module.exports.run = async (client, msg) => {
    let s;
    s = Math.round(client.uptime / 1000);
    let d = Math.round(Math.floor(s / 86400))
    s %= 86400;
    let h = Math.round(Math.floor(s / 3600));
    s %= 3600;
    let m = Math.round(Math.floor(s / 60));
    s = s % 60;
    let up;
    if (s && !m && !h && !d) up = `${s} seconds`;
    if (s && m && !h && !d) up = `${m} minutes, ${s} seconds`;
    if (s && m && h && !d) up = `${h} hours, ${m} minutes, ${s} seconds`;
    if (s && m && h && d) up = `${d} days, ${h} hours, ${m} minutes, ${s} seconds`;
    msg.channel.send(`:clock: discordboats.club Uptime:\n ${up}`);
};