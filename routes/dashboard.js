const express = require('express');
const chunk = require('chunk');
const app = (module.exports = express.Router());
const r = require('../ConstantStore').r;
const Util = require('../Util');
const config = require('../config.json');

app.get('/', async (req, res) => {
    const myBots = await Promise.all(
        (await r
            .table('bots')
            .filter({ ownerID: req.user.id })
            .run()).map(Util.attachPropBot)
    );
    const botChunks = chunk(myBots, 4);
    res.render('dashboard/index', { user: req.user ? await Util.attachPropUser(req.user) : undefined, myBots: botChunks, rawBots: myBots });
});

app.get('/new', async (req, res) => {
    res.render('dashboard/newBot', { user: req.user ? await Util.attachPropUser(req.user) : undefined, libs: require('./api').libList });
});

app.get('/bot/:id/edit', async (req, res, next) => {
    const bot = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (!bot) return next();
    if (req.user.id === bot.ownerID || req.user.admin || req.user.mod) {
        res.render('dashboard/editBot', { libs: require('./api').libList, bot, user: req.user ? await Util.attachPropUser(req.user) : null });
    } else res.status(403).json({ error: 'you do not own this bot' });
});

app.get('/bot/:id/manage', async (req, res, next) => {
    let bot = await r
        .table('bots')
        .get(req.params.id)
        .run();
    if (!bot) return next(); // 404 them (^:
    if (req.user.id === bot.ownerID || req.user.admin || req.user.mod) {
        bot = await Util.attachPropBot(bot, req.user);
        res.render('dashboard/botManage', { bot, user: req.user ? await Util.attachPropUser(req.user) : undefined });
    } else res.status(403).json({ error: 'you do not own this bot' });
});

app.get('/queue', async (req, res) => {
    if (!(req.user.mod || req.user.admin)) return res.status(403).json({ error: 'No permission' });
    const bots = await Promise.all(
        (await r
            .table('bots')
            .filter({ verified: false })
            .run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('dashboard/queue', { user: req.user ? await Util.attachPropUser(req.user) : undefined, chunks: botChunks, rawBots: bots, config });
});
