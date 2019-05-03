const { readFileSync } = require('fs');
const express = require('express');
const app = (module.exports = express.Router());
const Joi = require('joi');
const { r, bot: client } = require('../ConstantStore');
const randomString = require('randomstring');
const Util = require('../Util');
// datamined from the discord api docs
const libList = (module.exports.libList = [
    'discordcr',
    'Nyxx',
    'Discord.Net',
    'DSharpPlus',
    'Nostrum',
    'coxir',
    'DiscordGo',
    'Discord4J',
    'Javacord',
    'JDA',
    'discord.js',
    'Eris',
    'Discordia',
    'RestCord',
    'Yasmin',
    'disco',
    'discord.py',
    'discordrb',
    'serenity',
    'SwiftDiscord',
    'Sword',
    'Other'
]);
const config = require('../config.json');

const badBots = readFileSync('./badbots.txt', 'utf-8')
    .split('\n')
    .map(b => b.split(' ')[0]);
console.log(`[api-route] loaded ${badBots.length} bad bots.`);

app.get('/search/autocomplete', async (req, res) => {
    const q = req.query.q;
    if (typeof q !== 'string') return res.sendStatus(400);
    const bots = (await r
        .table('bots')
        .filter(bot =>
            bot('name')
                .downcase()
                .match('^' + q.toLowerCase())
                .and(bot('verified'))
        )
        .pluck('name')
        .limit(5)
        .run()).map(bot => bot.name);
    res.json({ ok: 'View data property', data: bots });
});

app.use((req, res, next) => {
    if (req.isAuthenticated()) next();
    else {
        res.status(401).json({ error: 'not_authenticated' });
    }
});

app.get('/', (req, res) => {
    res.json({ ok: 'you found the api!' });
});

const newBotSchema = Joi.object()
    .required()
    .keys({
        shortDescription: Joi.string()
            .max(200)
            .required(),
        id: Joi.string()
            .length(18)
            .required(),
        longDescription: Joi.string()
            .min(50)
            .max(12000)
            .required(),
        prefix: Joi.string()
            .max(50)
            .required(),
        invite: Joi.string()
            .uri({ scheme: ['https', 'http'] })
            .required(),
        website: Joi.string().uri({ scheme: ['https', 'http'] }),
        library: Joi.string(),
        github: Joi.string().uri({ scheme: ['https'] }), // gh is just https
        likeWebhook: Joi.string().uri({ scheme: ['http', 'https'] }),
        webhookAuth: Joi.string()
    })
    .with('likeWebhook', 'webhookAuth');

// bot resource
app.post('/bot', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (Util.handleJoi(newBotSchema, req, res)) return;
    const data = Util.filterUnexpectedData(
        req.body,
        { inviteClicks: 0, pageViews: 0, apiToken: randomString.generate(30), ownerID: req.user.id, createdAt: +new Date(), verified: false },
        newBotSchema
    );
    if (data.library && !libList.includes(data.library)) return res.status(400).json({ error: 'Invalid Library' });
    if (badBots.includes(data.id)) res.status(403).json({ error: 'Blacklisted bot' });

    const botUser = client.users.get(data.id) || (await client.users.fetch(data.id));
    if (!botUser) return res.status(404).json({ error: 'Invalid bot ID' });
    if (!botUser.bot) return res.status(400).json({ error: 'ID doesn\'t belong to a bot' });
    
    // check for user in guild -tony
    const user = await client.guilds.get(config.ids.mainServer).members.get(data.ownerID);
    if (!user) return res.status(403).json({ error: 'You must join our server to add bots' });

    // does bot already exist?
    const dbeBot = await r
        .table('bots')
        .get(data.id)
        .run();
    if (dbeBot) return res.status(302).json({ error: 'Bot already exists' });

    // everything looks good.
    await r
        .table('bots')
        .insert(data)
        .run();
    res.status(200).json({ ok: 'Created bot' });
    client.channels.get(config.ids.logChannel).send(`📥 <@${req.user.id}> added ${botUser.username} (<@&${config.ids.staffRole}>).`);
});

const editBotSchema = Joi.object()
    .required()
    .keys({
        shortDescription: Joi.string().max(200),
        longDescription: Joi.string()
            .min(50)
            .max(12000),
        prefix: Joi.string().max(50),
        invite: Joi.string().uri({ scheme: ['https', 'http'] }),
        website: Joi.string().uri({ scheme: ['https', 'http'] }),
        library: Joi.string(),
        github: Joi.string().uri({ scheme: ['https'] }),
        vanityURL: Joi.string()
            .token()
            .min(4)
            .max(12),
        likeWebhook: Joi.string().uri({ scheme: ['http', 'https'] }),
        webhookAuth: Joi.string()
    })
    .with('likeWebhook', 'webhookAuth');

app.patch('/bot/:id', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (Util.handleJoi(editBotSchema, req, res)) return;
    const bot = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (!bot) return res.status(404).json({ error: 'Unknown bot' });
    if (req.user.id === bot.ownerID || req.user.admin || req.user.mod) {
        const data = Util.filterUnexpectedData(req.body, { editedAt: +new Date() }, editBotSchema);
        if (data.library && !libList.includes(data.library)) return res.status(400).json({ error: 'Invalid Library' });

        if (bot.certified) {
            const vanityTaken = (await r.table('bots').filter({ vanityURL: data.vanityURL }))[0];
            if (data.vanityURL && vanityTaken && vanityTaken.id !== bot.id) return res.status(400).json({ error: 'Vanity URL taken' });
            if (!data.vanityURL) data.vanityURL = null;
        } else data.vanityURL = bot.vanityURL || null;

        if (!data.likeWebhook) data.likeWebhook = null;
        if (!data.webhookAuth) data.webhookAuth = null;
        const botUser = client.users.get(bot.id) || (await client.users.fetch(bot.id));

        await r
            .table('bots')
            .get(bot.id)
            .update(data)
            .run();
        client.channels.get(config.ids.logChannel).send(`✏ <@${req.user.id}> edited ${botUser.username}.`);
        res.json({ ok: 'Edited bot' });
    } else res.status(403).json({ error: 'You do not own this bot' });
});

app.delete('/bot/:id', async (req, res) => {
    const bot = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (!bot) return await res.status(404).json({ error: 'Bot does not exist' });
    if (req.user.id === bot.ownerID || req.user.admin || req.user.mod) {
        await r
            .table('bots')
            .get(req.params.id)
            .delete()
            .run();
        const botUser = client.users.get(bot.id) || (await client.users.fetch(bot.id));
        client.channels.get(config.ids.logChannel).send(`🗑 <@${req.user.id}> deleted ${botUser.username}.`);
        client.guilds
            .get(config.ids.mainServer)
            .member(botUser.id)
            .kick('Bot deleted')
            .catch(() => {});
        res.status(200).json({ ok: 'Deleted bot.' });
    } else res.status(403).json({ error: 'You do not own this bot' });
});

app.patch('/bot', async (req, res) => {
    res.sendStatus(501);
});

// bot comment resource
const newCommentSchema = Joi.object()
    .required()
    .keys({
        content: Joi.string()
            .max(500)
            .required(),
        botID: Joi.string()
            .length(36)
            .required()
    });
const editCommentSchema = Joi.object()
    .required()
    .keys({
        content: Joi.string()
            .max(500)
            .required()
    });
app.post('/bot/comment', async (req, res) => {
    if (Util.handleJoi(newCommentSchema, req, res)) return;
    return res.sendStatus(501);
    /*const data = Util.filterUnexpectedData(req.body, {authorID: req.user.id, createdAt: +new Date()}, newCommentSchema);
    
    const bot = await r.table("bots").get(data.botID).run();
    if (!bot) return res.status(404).json({error: "Bot not found"});

    const reResponse = await r.table("comments").insert(data).run();
    res.status(200).json({ok: "comment created", commentID: reResponse.generated_keys[0]});*/
});

app.patch('/bot/comment/:id', async (req, res) => {
    return res.sendStatus(501);
    /*const comment = await r.table("comments").get(req.params.id);
    if (!comment) return res.status(404).json({error: "comment not found"});
    if (comment.authorID !== req.user.id) return res.status(403).json({error: "no permission"});
    if (Util.handleJoi(editCommentSchema, req, res)) return;
    const data = Util.filterUnexpectedData(req.body, {editedAt: +new Date()}, newCommentSchema);
    await r.table("comments").get(req.params.id).update(data).run();
    res.status(200).json({ok: "comment edited"});*/
});

app.delete('/bot/comment/:id', async (req, res) => {
    return res.sendStatus(501);
    /*const comment = await r.table("comments").get(req.params.id);
    if (!comment) return res.status(404).json({error: "comment not found"});
    if (comment.authorID !== req.user.id) return res.status(403).json({error: "no permission"});
    await r.table("comments").get(req.params.id).delete().run();
    res.status(200).json({ok: "deleted comment"});*/
});

// user resource
app.post('/logout', (req, res) => {
    req.logOut();
    res.sendStatus(200);
});

app.get('/me', (req, res) => {
    res.json({
        id: req.user.id,
        discord: {
            username: req.user.username
        },
        warning: 'This API endpoint is a legacy one and does not provide all info about the user.'
    });
});

const modVerifyBotSchema = Joi.object()
    .required()
    .keys({
        verified: Joi.boolean().required(),
        reason: Joi.string(),
        botID: Joi.string()
            .length(18)
            .required()
    });

app.post('/bot/mod/verify', async (req, res) => {
    const client = require('../ConstantStore').bot;
    if (!(req.user.mod || req.user.admin)) return res.status(403).json({ error: 'No permission' });
    if (Util.handleJoi(modVerifyBotSchema, req, res)) return;
    const data = Util.filterUnexpectedData(req.body, {}, modVerifyBotSchema);
    const bot = await Util.attachPropBot(
        await r
            .table('bots')
            .get(data.botID)
            .run()
    );
    const botUser = client.users.get(bot.id) || client.users.fetch(bot.id);
    if (!bot) return res.status(404).json({ error: 'Bot does not exist' });
    const discordOwner = client.users.get(bot.ownerID);
    const staffUser = client.users.get(req.user.id) || client.users.fetch(req.user.id);
    if (data.verified) {
        try {
            await discordOwner.send(`🎉 "${bot.name}" was verified by ${staffUser.tag}!`);
        } catch (e) {}
        client.channels.get(config.ids.logChannel).send(`🎉 ${botUser.username} by <@${bot.ownerID}> was verified by ${staffUser}!`);
        await r
            .table('bots')
            .get(bot.id)
            .update({ verified: true })
            .run();
    } else {
        console.log(data.reason);
        if (!data.reason || !data.reason.trim()) return res.status(400).json({ error: 'A reason is required' });
        try {
            await discordOwner.send(`❌ Your bot, ${bot.name}, was rejected by ${staffUser.tag}. Check <#${config.ids.logChannel}> for more information.`);
        } catch (e) {}
        client.channels.get(config.ids.logChannel).send(`❌ ${botUser.tag} by <@${bot.ownerID}> was rejected by ${staffUser}.\nReason: \`${data.reason}\``);
        await r
            .table('bots')
            .get(bot.id)
            .delete()
            .run();
    }

    try {
        client.guilds
            .get(config.ids.verificationServer)
            .members.get(bot.id)
            .kick()
            .catch(() => {});
    } catch (e) {}

    if (data.verified)
        client.guilds
            .get(config.ids.mainServer)
            .members.get(bot.ownerID)
            .roles.add(config.ids.botDeveloperRole)
            .catch(() => {});

    res.status(200).json({ ok: 'Applied actions' });
});

app.post('/bot/:id/like', async (req, res) => {
    const bot = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (!bot) return res.status(404).json({ error: 'Bot does not exist' });
    let existingLike = (await r
        .table('likes')
        .filter({ userID: req.user.id, botID: bot.id })
        .run())[0];

    if (bot.likeWebhook) Util.likeWebhook(bot.likeWebhook, bot.webhookAuth, existingLike ? 'unlike' : 'like', bot.id, req.user.id);

    if (existingLike) {
        await r
            .table('likes')
            .get(existingLike.id)
            .delete()
            .run();
        res.json({ ok: 'Unliked bot' });
    } else {
        await r
            .table('likes')
            .insert({ userID: req.user.id, botID: bot.id, createdAt: Date.now() })
            .run();
        res.json({ ok: 'Liked bot' });
    }
});

app.use((req, res) => {
    res.sendStatus(404);
});
