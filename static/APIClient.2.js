window.APIClient = class APIClient {
    static async logOut() {
        await fetch('/api/logout', { credentials: 'same-origin', method: 'POST' });
    }
    /**
     * @param {Object} bot
     * @returns {Promise<Object>} this object has a `ok` property for data from the api (usually the same for all requests)
     */
    static async createBot(bot) {
        // id, shortDescription, longDescription, invite, website, library
        const res = await fetch('/api/bot', {
            method: 'POST',
            body: JSON.stringify(bot),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });
        const data = await res.json();
        if (data.error && !data.details) {
            throw new Error(data.error);
        } else if (data.error && data.details) {
            throw new Error(`${data.error} ${data.details.join(', ')}`);
        } else if (data.ok) {
            return { ok: data.ok };
        } else {
            throw new Error('Bad response');
        }
    }
    /**
     * Deletes a boat. (Good thing comments get removed in production builds lmao (haha xd))
     * @param {String} id
     * @returns {Promise<Object>} json response from the api.
     */
    static async deleteBot(id) {
        const res = await fetch('/api/bot/' + encodeURI(id), { method: 'DELETE', credentials: 'same-origin' });
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        } else if (data.ok) {
            return { ok: data.ok };
        } else {
            throw new Error('Bad response');
        }
    }

    static async verifyBot(verified, reason, id) {
        const res = await fetch('/api/bot/mod/verify', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verified, reason, botID: id })
        });
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        } else if (data.ok) {
            return { ok: data.ok };
        } else {
            throw new Error('Bad response');
        }
    }

    static async editBot(bot) {
        let botNoId = Object.assign({}, bot);
        delete botNoId.id;
        const res = await fetch('/api/bot/' + bot.id, { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(botNoId) });
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        } else if (data.ok) {
            return { ok: data.ok };
        } else {
            throw new Error('Bad response');
        }
    }
    static async likeBot(botID) {
        const res = await fetch(`/api/bot/${botID}/like`, { method: 'POST', credentials: 'same-origin' });
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        } else if (data.ok) {
            return { ok: data.ok };
        } else {
            throw new Error('Bad response');
        }
    }
};
