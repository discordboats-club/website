const marked = require('marked');
const Joi = require('joi');
const moment = require('moment');
const chunk = require('chunk');
const fetch = require('node-fetch');
const sanitizeHtml = require('sanitize-html');

const htmlOptions = {
    allowedTags: ['style', 'h1', 'h2', ...sanitizeHtml.defaults.allowedTags]
};

module.exports = class Utils {
    /**
     * @param {Object} bot
     * @param user
     * @returns {Object}
     */
    static async attachPropBot(bot, user = {}) {
        const client = require('./ConstantStore').bot;
        const { r } = require('./ConstantStore');
        const botUser = client.users.get(bot.id) || (await client.users.fetch(bot.id));
        bot.online = botUser.presence.status !== 'offline';
        bot.name = botUser.username;
        bot._discordAvatarURL = botUser.displayAvatarURL({ format: "png", size: 512 });

        const description = bot.certified ? sanitizeHtml(bot.longDescription, htmlOptions) : bot.longDescription;
        bot._markedDescription = marked(description, { sanitize: bot.certified ? false : true });

        bot._ownerViewing = user.id === bot.ownerID;
        bot._comments = await r
            .table('comments')
            .filter({ botID: bot.id })
            .run();
        try {
            bot._ownerTag = client.users.get(bot.ownerID).tag;
        } catch (e) {
            bot._ownerTag = 'Unknown#0000';
        }
        if (user.id) {
            const like = (await r
                .table('likes')
                .filter({ userID: user.id, botID: bot.id })
                .run())[0];
            bot._userLikes = !!like;
        }
        bot.likeCount = await r
            .table('likes')
            .filter({ botID: bot.id })
            .count()
            .run();
        return bot;
    }
    /**
     * Hides sensetive and internal data from bots.
     * @param {Object} bot
     */
    static hidePropsBot(bot) {
        delete bot._discordAvatarURL;
        delete bot._markedDescription;
        delete bot._ownerViewing;
        delete bot.apiToken;
        return bot;
    }

    /**
     * Hides sensetive and internal data from bots.
     * @param user
     * @param hideBots
     */
    static hidePropsUser(user, hideBots = true) {
        delete user.discordAT;
        delete user.discordRT;
        delete user._fmtCreatedAt;
        if (hideBots) user._bots = user._bots.map(Utils.hidePropsBot);
        delete user._verifiedBots;
        return user;
    }
    /**
     * @param {Object} user
     * @returns {Object}
     */
    static async attachPropUser(user) {
        const client = require('./ConstantStore').bot;
        const { r } = require('./ConstantStore');
        const discordUser = client.users.get(user.id) || (await client.users.fetch(user.id));
        user.online = discordUser.presence.status !== 'offline';
        user.username = discordUser.username;
        user.discriminator = discordUser.discriminator;
        user._discordAvatarURL = discordUser.displayAvatarURL({ format: 'png', size: 512 });
        user._bots = await Promise.all((await r.table('bots').filter({ ownerID: user.id })).map(b => Utils.attachPropBot(b)));
        user._verifiedBots = user._bots.filter(bot => bot.verified);
        user._chunked = chunk(user._verifiedBots, 4);
		user.staff = false;
		if(user.mod || user.admin) user.staff = true;
		if (user._bots.find(b => b.certified)) user.badges.push('Certified Developer');
        if (user.mod) user.badges.push('Moderator');
        if (user.admin) user.badges.push('Administrator');
		if (user.id === "131417543888863232" || user.id === "398536643172237314" || user.id === "233823931830632449"|| user.id === "250536623270264833") user.badges.push('Founder');
        return user;
    }
	
	static async StaffattachPropUser(user) {
        const client = require('./ConstantStore').bot;
        const { r } = require('./ConstantStore');
        const discordUser = client.users.get(user.id) || (await client.users.fetch(user.id));

		user.clientStatus = discordUser.presence.clientStatus;
		user.activity = discordUser.presence.activity;
        user.online = discordUser.presence.status !== 'offline';
		
        user.username = discordUser.username;
        user.discriminator = discordUser.discriminator;
        user._discordAvatarURL = discordUser.displayAvatarURL({ format: 'png', size: 512 });
        user._bots = await Promise.all((await r.table('bots').filter({ ownerID: user.id })).map(b => Utils.attachPropBot(b)));
        user._verifiedBots = user._bots.filter(bot => bot.verified);
        user._chunked = chunk(user._verifiedBots, 4);
		user.staff = false;
		user.staffAdmin = false;
		user.staffMod = false;
		if(user.mod || user.admin) user.staff = true;
		if(user.admin) user.staffAdmin = true;
		if(user.mod) user.staffMod = true;
		if (user.id === "131417543888863232" || user.id === "398536643172237314" || user.id === "233823931830632449" || user.id === "250536623270264833") user.badges.push('Founder');
        if (user.admin) user.badges.push('Administrator');
        if (user.mod) user.badges.push('Moderator');
		
        return user;
    }
    /**
     * method for api endpoints
     */
    static filterUnexpectedData(orig, startingData, schema) {
        const data = Object.assign({}, startingData);
        Object.keys(schema.describe().children).forEach(key => {
            data[key] = orig[key];
        });
        return data;
    }
    /**
     * method for api endpoints
     */
    static handleJoi(schema, req, res) {
        const wdjt = Joi.validate(req.body, schema); // What Does Joi Think (wdjt)
        if (wdjt.error) {
            if (!wdjt.error.isJoi) {
                console.error('Error while running Joi.', wdjt.error);
                res.status(500).json({ error: 'Internal Server Error' });
                return true;
            }
            res.status(400).json({ error: wdjt.error.name, details: wdjt.error.details.map(item => item.message) });
            return true;
        }
        return false;
    }

    static async resolveUser(msg, args, client) {
        try {
            const mention = msg.mentions.users.first();
            if (mention) return mention;

            if (!args[0]) return false;

            const id = /^(?:<@!?)?(\d{17,19})>?$/.exec(args[0]);
            if (id) {
                const user = await client.users.fetch(id[1]);
                if (user) return user;
            }

            const userTag = client.users.find(u => u.tag === args[0]);
            if (userTag) return userTag;

            return false;
        } catch (e) {
            return false;
        }
    }

    static async likeWebhook(url, auth, event, botId, userId) {
        const body = JSON.stringify({
            event,
            botId,
            userId
        });

        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: auth,
                    'Content-Type': 'application/json'
                },
                body
            });
        } catch (e) {}
    }
};
