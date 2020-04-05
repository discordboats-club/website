const express = require('express');
const passport = require('passport');
const app = (module.exports = express.Router());
const scopes = require('../app').discordScopes;
const discord = require('passport-discord');
const { ensureLoggedOut } = require('connect-ensure-login');

app.get('/login', ensureLoggedOut('/dashboard'), passport.authenticate('discord', { scope: scopes }));

app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));

app.post('/logout', (req, res) => {
    if (req.isUnauthenticated()) return res.sendStatus(403);
    req.logOut();
    res.sendStatus(200);
});
