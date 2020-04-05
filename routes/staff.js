const express = require('express');
const chunk = require('chunk');
const ejs = require('ejs');
const randomstring = require('randomstring');
const webshot = require('webshot');
const Util = require('../Util');
const { r } = require('../ConstantStore');
const config = require('../config.json');
const app = (module.exports = express.Router());
app.get('/staff/queue', async (req, res) => {
    if (!(req.user.mod || req.user.admin)) return res.status(403).json({ error: 'No permission' });
    const bots = await Promise.all(
        (await r
            .table('bots')
            .filter({ verified: false })
            .run()).map(bot => Util.attachPropBot(bot, req.user))
    );
    const botChunks = chunk(bots, 4);
    res.render('/staff/queue', { user: req.user ? await Util.attachPropUser(req.user) : undefined, chunks: botChunks, rawBots: bots, config });
});