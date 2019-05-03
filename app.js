const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Discord = require('passport-discord');
const logger = require('morgan');
const { ensureLoggedIn } = require('connect-ensure-login');
const compress = require('compression');
const { r, client } = require('./ConstantStore');
const { promisify } = require('util');
const cp = require('child_process');
const exec = promisify(cp.exec);
const config = require('./config');
const minifyHTML = require('express-minify-html');
const RethinkStore = require('session-rethinkdb')(session);
const port = process.env.PORT || require('./config.json').listeningPort || 3000;

const app = (module.exports = express());

app.use(require('helmet')());
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use((req, res, next) => {
    const { bot } = require('./ConstantStore');
    if (!bot.readyTimestamp) {
        bot.once('ready', () => {
            next();
        });
    } else {
        next();
    }
});

app.use(compress());
app.use(
    minifyHTML({
        override: true,
        exception_url: false,
        htmlMinifier: {
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeEmptyAttributes: true
        }
    })
);

app.use(express.static('static'));
app.use(express.json());
app.use('/api/public', require('./routes/botapi'));
app.use(session({ saveUninitialized: true, resave: false, name: 'discordboats_session', secret: require('./ConstantStore').secret, store: new RethinkStore(require('./ConstantStore').r) }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(undefined, user.id));
passport.deserializeUser(async (id, done) => {
    done(
        undefined,
        await r
            .table('users')
            .get(id)
            .run()
    );
});

const discordScopes = (module.exports.discordScopes = ['identify']);
passport.use(
    new Discord(
        {
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            scope: discordScopes,
            callbackURL: config.callbackURL,
            authorizationURL: 'https://discordapp.com/api/oauth2/authorize?prompt=none'
        },
        async (accessToken, refreshToken, profile, done) => {
            // we'll enable storing extra user data here.
            let user = await r
                .table('users')
                .get(profile.id)
                .run();
            if (!user) {
                user = {
                    id: profile.id,
                    discordAT: accessToken,
                    discordRT: refreshToken,
                    createdAt: new Date().getTime(),
                    badges: []
                };
            }
            await r
                .table('users')
                .insert(user, { conflict: 'update' })
                .run();
            done(undefined, profile);
        }
    )
);

app.use(require('./routes/index'));
app.use('/discord', require('./routes/discord'));
app.use('/dashboard', ensureLoggedIn('/discord/login'), require('./routes/dashboard'));
app.use('/api', require('./routes/api'));

app.use((req, res) => {
    res.status(404).render('404', { user: req.user });
});

setInterval( async () => { 
    const bots = await r.table('bots')
    bots.forEach(async(bot) => {
        const user = await client.users.fetch(bot.id);
        if (!user || !user.id) return;
        await r.table('bots').get(bot.id).update({ name: user.username });
    });
    console.log('[Automatic] Updated names of users.');
    if (!config.automaticBackup) return;
    try {
        const result = await exec('cd /home/dboats/backup && rethinkdb dump -e discordboatsclubv1 && cd ../dboats');
        console.log('[Automatic] Backing up the database...');
    } catch (e) {
        console.log('[Error] with backup: ' + e.toString());
    }
}, 8 * 60 * 60 * 1000);

app.listen(port, () => {
    console.log(`Listening on port ${port}.`);
});
