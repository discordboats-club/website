const express = require('express');
const chunk = require('chunk');
const ejs = require('ejs');
const randomstring = require('randomstring');
const webshot = require('webshot');
const Util = require('../Util');
const { r } = require('../ConstantStore');
const config = require('../config.json');
const app = (module.exports = express.Router());

app.get('/', async (req, res) => {
    const bots = await Promise.all(
        (await r
            .table('bots')
            .filter({ verified: true })
            .orderBy(r.desc('servers'))
            .limit(4 * 6)
            .run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4); // 4 bots per
    res.render('index', { user: req.user ? await Util.attachPropUser(req.user) : undefined, rawBots: bots, botChunks });
});

const rowsPerPage = 5;
const itemsPerPage = rowsPerPage * 4;

const sortBy = [
    ['Name', 'name', r.row('name').downcase()],
    ['Server Count', 'servers', r.row('servers')],
    ['Views', 'views', r.row('pageViews')],
    ['Invites', 'invites', r.row('inviteClicks')],
    ['Added Date', 'created', r.row('createdAt')]
];
const defaultSortBy = 'name';

const orders = [['Ascending', 'asc'], ['Descending', 'desc']];
const defaultOrder = 'asc';

app.get('/browse', async (req, res) => {
    let page = +req.query.page;
    if (typeof page !== 'number' || isNaN(page) || page < 1) page = 1;

    const items = await r.table('bots').count();
    const pages = Math.ceil(items / itemsPerPage);
    if (page > pages) page = pages;

    page--;

    let sort = sortBy.find(s => s[1] === req.query.sort) ? req.query.sort : defaultSortBy;
    let order = orders.find(o => o[1] === req.query.order) ? req.query.order : defaultOrder;

    sort = sortBy.find(s => s[1] === sort);
    order = orders.find(o => o[1] === order);

    const start = page * itemsPerPage;

    const bots = await Promise.all(
        (await r
            .table('bots')
            .filter({ verified: true })
            .orderBy(r[order[1]](sort[2]))
            .slice(start, start + itemsPerPage)).map(b => Util.attachPropBot(b, req.user))
    );
    const botChunks = chunk(bots, 4);

    res.render('browse', {
        user: req.user ? await Util.attachPropUser(req.user) : undefined,
        rawBots: bots,
        botChunks,
        itemsPerPage,
        items,
        page,
        pages,
        sorting: { sorts: sortBy, current: sort[1] },
        ordering: { orders, current: order[1] }
    });
});

app.get('/bot/:id', async (req, res, next) => {
    let rB = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (rB && rB.vanityURL) return res.redirect(`/bot/${rB.vanityURL}`);
    if (!rB) {
        rB = (await r.table('bots').filter({ vanityURL: req.params.id }))[0];
        if (!rB) return next();
    }
    const bot = await Util.attachPropBot(rB, req.user);
    if (!bot.verified && !((req.user ? req.user.mod || req.user.admin : false) || req.user.id === rB.ownerID)) return res.sendStatus(404); // pretend it doesnt exist lol
    res.render('botPage', { user: req.user ? await Util.attachPropUser(req.user) : undefined, bot });
    await r
        .table('bots')
        .get(req.params.id)
        .update({ pageViews: r.row('pageViews').add(1) })
        .run();
});

app.get('/bot/:id/key', async (req, res, next) => {
    const rB = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (!rB) return next();
    const bot = await Util.attachPropBot(rB, req.user);
    if (bot.verified) {
        if (req.user) {
            if (req.user.id !== bot.ownerID) res.sendStatus(403);
            else return res.render('botKey', { bot: rB, user: req.user ? await Util.attachPropUser(req.user) : undefined });
        } else return res.sendStatus(401);
    } else return res.sendStatus(403);
});

app.get('/bot/:id/reset', async (req, res, next) => {
    const rB = await r.table('bots').get(req.params.id);
    if (!rB) return next();

    const bot = await Util.attachPropBot(rB, req.user);
    if (!bot.verified) return res.sendStatus(403);
    if (!req.user) return res.sendStatus(401);
    if (req.user.id !== bot.ownerID) return res.sendStatus(403);

    await r
        .table('bots')
        .get(req.params.id)
        .update({ apiToken: randomstring.generate(30) });

    res.redirect(`/bot/${req.params.id}/key`);
});

app.get('/user/:id', async (req, res, next) => {
    let user = await r
        .table('users')
        .get(req.params.id)
        .run();
    if (!user) return next();
    user = await Util.attachPropUser(user);
    res.render('userPage', { user: req.user ? await Util.attachPropUser(req.user) : undefined, profile: user });
});

app.get('/search', async (req, res) => {
    if (typeof req.query.q !== 'string') return res.status(403).json({ error: 'expected query q' });
    //const query = req.query.q.toLowerCase();
    const text = req.query.q.toLowerCase();
    //const text = req.query.q.replace(/<([^>]+)>/gi, "");
   const bots = await Promise.all((await r.table("bots").filter(bot => {
        return bot("name").downcase().match(text).and(bot("verified"))
    }).orderBy(bot => {
        return bot("name").downcase().split(text).count()
    }).limit(2*4).run()).map(bot => Util.attachPropBot(bot, req.user)));

    const botChunks = chunk(bots, 4);

    res.render('search', { bots, botChunks, user: req.user ? await Util.attachPropUser(req.user) : undefined, searchQuery: text });
});

app.get('/invite_url/:id', async (req, res) => {
    const bot = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (!bot) return res.status(404).json({ error: 'bot does not exist' });
    res.redirect(bot.verified ? bot.invite : `https://discordapp.com/api/oauth2/authorize?scope=bot&client_id=${bot.id}&guild_id=${config.ids.verificationServer}`);

    await r
        .table('bots')
        .get(bot.id)
        .update({ inviteClicks: r.row('inviteClicks').add(1) })
        .run();
});

app.get('/bot/:id/widget.png', async (req, res) => {
    const hex = /^[a-f0-9]{6}$/i;
    const backgroundColor = hex.test(req.query.background) ? req.query.background : '252525';
    const textColor = hex.test(req.query.text) ? req.query.text : 'ffffff';

    const client = require('../ConstantStore').bot;
    const botRow = await r.table('bots').get(req.params.id);
    if (!botRow) return res.status(404).json({ error: 'bot does not exist' });
    const bot = await Util.attachPropBot(botRow);
    if (!bot) return res.status(404).json({ error: 'bot does not exist' });
    bot.ownerTag = (client.users.get(bot.ownerID) || client.users.fetch(bot.ownerID) || {}).tag;
    res.set('Content-Type', 'image/png');
    ejs.renderFile('views/botWidget.ejs', { bot, colors: { background: backgroundColor, text: textColor } }, (err, html) => {
        if (err) throw err;
        webshot(html, undefined, { siteType: 'html', windowSize: { width: '400', height: '250' } }).pipe(res);
    });
});

app.get('/certification', async (req, res) => {
    res.render('certification', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/terms', async (req, res) => {
    res.render('terms', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/privacy', async (req, res) => {
    res.render('privacy', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});

app.get('/stats', async (req, res) => {
    res.render('stats', {
        botCount: await r
            .table('bots')
            .count()
            .run(),
        userCount: await r
            .table('users')
            .count()
            .run(),
        likeCount: await r
            .table('likes')
            .count()
            .run(),
        botsInvited: await r
            .table('bots')
            .sum('inviteClicks')
            .run(),
        user: req.user ? await Util.attachPropUser(req.user) : undefined
    });
});
app.get('/staff/queue', async (req, res) => {
    if (!(req.user.mod || req.user.admin)) return res.status(403).json({ error: 'No permission' });
    const bots = await Promise.all(
        (await r
            .table('bots')
            .filter({ verified: false })
            .run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('staff/queue', { user: req.user ? await Util.attachPropUser(req.user) : undefined, chunks: botChunks, rawBots: bots, config });
});
app.get('/Apis', async (req, res) => {
    res.render('Apis', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});app.get('/about', async (req, res) => {
    res.render('about', { user: req.user ? await Util.attachPropUser(req.user) : undefined });
});
app.get('/staff', async (req, res) => {

	//let staffusersNonFounder = [];
	//let staffusersFounder = [];
	let staffusers = [];
	
	//let staffMods = [];
	//let staffAdmins = [];

	let staffusersRaw = await Promise.all(
        (await r
            .table('users')
            .run()).map(user => Util.StaffattachPropUser(user))
		);
			
			staffusersRaw.forEach(async function(item, index){
				if(item.staff){
					/*if(item.badges.includes("Founder")){
						staffusersFounder.push(item)
					} else {
						
						if(item.staffAdmin){
							staffAdmins.push(item)
						} else {
							staffMods.push(item)
							staffusersNonFounder.push(item)
						}
					}*/
					staffusers.push(item)
					
				}
			})
			
			/*staffusersNonFounder.sort(function(a, b){
				if(a.username < b.username) { return -1; }
				if(a.username > b.username) { return 1; }
				return 0;
			})
			
			staffusersFounder.sort(function(a, b){
				if(a.username < b.username) { return -1; }
				if(a.username > b.username) { return 1; }
				return 0;
			})
			
			staffusers.sort(function(a, b){
				if(a.username < b.username) { return -1; }
				if(a.username > b.username) { return 1; }
				return 0;
			})
			
			staffMods.sort(function(a, b){
				if(a.username < b.username) { return -1; }
				if(a.username > b.username) { return 1; }
				return 0;
			})
			
			staffAdmins.sort(function(a, b){
				if(a.username < b.username) { return -1; }
				if(a.username > b.username) { return 1; }
				return 0;
			})
			
	const staffChunksFounders = chunk(staffusersFounder, 4);
	const staffChunksNonFounder = chunk(staffusersNonFounder, 4);
	const staffChunks = chunk(staffusers, 4);
	
	const staffChunksAdmins = chunk(staffAdmins, 4);
	const staffChunksMods = chunk(staffMods, 4);*/
	//res.render('staffList', { user: req.user ? await Util.attachPropUser(req.user) : undefined, staff: staffusers, StaffFounders: staffusersFounder, staffnonFounder: staffusersNonFounder, staffChunks: staffChunks, staffChunksFounder: staffChunksFounders, staffChunksNonFounder: staffChunksNonFounder, config, staffChunksMods: staffChunksMods, staffChunksAdmins: staffChunksAdmins});

    staffusers.sort(function(a, b){
        if(a.username < b.username) { return -1; }
        if(a.username > b.username) { return 1; }
        return 0;
    })

    const staffChunks = chunk(staffusers, 4);

    res.render('staffList', { user: req.user ? await Util.attachPropUser(req.user) : undefined, staff: staffusers, StaffChunk: staffChunks});
});
app.get('/admin', async (req, res) => {

    /*
    const bots = await Promise.all(
        (await r
            .table('bots')
            .filter({ verified: false })
            .run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('staff/queue', { user: req.user ? await Util.attachPropUser(req.user) : undefined, chunks: botChunks, rawBots: bots, config });
     */

    const BotQbots = await Promise.all(
        (await r
            .table('bots')
            .filter({ verified: false })
            .run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const BotQbotChunks = chunk(BotQbots, 4);
    if (!(req.user.mod || req.user.admin)) return res.status(403).json({ error: 'No permission' });
    res.render('admin', { user: req.user ? await Util.attachPropUser(req.user) : undefined, botqueue: {chunks: BotQbotChunks, rawBots: BotQbots},
        config });
});
