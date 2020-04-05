const api = APIClient;
console.log('Welcome to discordboats.club! Why are you looking here? :D');

console.log('%c🚫 Warning! 🚫', 'color: red; font-weight: bold; font-size: x-large');
console.log('%cTyping anything here could make bad stuff happen!', 'color: #e91e63; font-size: large');

function undefIfEmpty(str) {
    return str.trim() === '' ? undefined : str;
}

/* Particles
particlesJS.load('snow', '/particles.json');
*/

// Theme control
const controlEle = document.querySelector('#themeControl');
let light = localStorage.getItem('lightTheme') === 'true';
controlEle.checked = light;
function processThemeState() {
    if (!light) {
        $(document.body).addClass('dark-theme');
    } else {
        $(document.body).removeClass('dark-theme');
    }
}
processThemeState();
controlEle.addEventListener('change', e => {
    light = e.target.checked;
    localStorage.setItem('lightTheme', JSON.stringify(e.target.checked));
    processThemeState();
});

$(document).ready(() => {
    $('select').formSelect();

    const sortSelect = $('#sortSelect');
    const orderSelect = $('#orderSelect');

    if (!sortSelect || !orderSelect) return;

    const selects = [sortSelect, orderSelect];

    selects.forEach(s => {
        s.change(() => {
            window.location = s.find('option:selected').val();
        });
    });
});

$(window).ready(async () => {
    $('.accept-button').click(e => {
        let card = e.target.parentElement.parentElement.parentElement.parentElement;
        let id = card.getAttribute('id');
        api.verifyBot(true, undefined, id);
        card.remove();
    });
    $('.deny-bot-action').click(async e => {
        let modal = e.target.parentElement.parentElement;
        let id = modal.getAttribute('data-bot-id');
        let card = $(`#${id}`);

        try {
            await api.verifyBot(false, $(`#deny-reason-${id}`).val(), id);

            card.remove();
        } catch (e) {
            M.toast({ html: e.message });
        }
    });
    document.querySelectorAll('.modal').forEach(ele => M.Modal.init(ele));
    M.Dropdown.init(document.querySelector('#profile-dropdown-trigger'), { ecoverTrigger: false });

    if (document.querySelector('#searchbox')) {
        const searchBoxM = M.Autocomplete.init(document.querySelector('#searchbox'), {
            data: {},
            limit: 10,
            onAutocomplete: () =>
                $('#searchbox')
                    .parent()
                    .parent()
                    .submit()
        });
        document.querySelector('#searchbox').addEventListener(
            'input',
            $.throttle(1000, async e => {
                const res = await fetch('/api/search/autocomplete?q=' + encodeURI(e.target.value));
                const body = await res.json();
                if (!body.data) {
                    M.toast('Could not get autocomplete data');
                    return;
                }
                let newData = {};
                body.data.forEach(bot => {
                    newData[bot] = null;
                });
                searchBoxM.options.data = newData;
            })
        );
    }

    const logoutele = document.querySelector('#log-out-indd');
    if (logoutele)
        document.querySelector('#log-out-indd').addEventListener('click', async e => {
            await api.logOut();
            window.localStorage.setItem('toastOnNext', 'Logged out');
            if (window.location.pathname === '/') {
                window.location.reload();
            } else {
                window.location.replace('/');
            }
        });
    if (window.localStorage.getItem('toastOnNext')) {
        M.toast({ html: window.localStorage.toastOnNext });
        window.localStorage.removeItem('toastOnNext');
    }
    if (document.location.href.includes('/dashboard/new')) {
        M.FormSelect.init($('select#newbot'), { classes: 'newbot-dd-wrap' });
        $('form').submit(async e => {
            e.preventDefault();
            let lib = $('select').val();
            if (lib === 'none') lib = undefined;
            try {
                await api.createBot({
                    id: undefIfEmpty($('#client_id').val()),
                    library: lib,
                    prefix: undefIfEmpty($('#bot_prefix').val()),
                    website: undefIfEmpty($('#bot_website').val()),
                    invite: undefIfEmpty($('#bot_invite').val()) || `https://discordapp.com/oauth2/authorize?client_id=${encodeURI(e.target[0].value)}&scope=bot&permissions=0`,
                    github: undefIfEmpty($('#bot_github').val()),
                    shortDescription: undefIfEmpty($('#bot_description').val()),
                    longDescription: undefIfEmpty($('#bot_description-full').val()),
                    likeWebhook: undefIfEmpty($('#like_webhook').val()),
                    webhookAuth: undefIfEmpty($('#webhook_auth').val())
                });
                M.toast({ html: 'Submitted new bot.' });
                document.location.replace('/bot/' + e.target[0].value);
            } catch (error) {
                M.toast({ html: 'Error: ' + error.message });
                console.error(error);
            }
        });
    } else if (document.location.href.includes('/bot/') && document.location.href.endsWith('/manage')) {
        $('#delete-bot-action').click(async e => {
            await api.deleteBot(document.querySelector('#delete-bot-modal').getAttribute('data-bot-id'));
            window.localStorage.setItem('toastOnNext', 'Deleted bot.');
            window.location = '/dashboard';
        });
    } else if (document.location.href.includes('/dashboard/bot') && document.location.href.endsWith('/edit')) {
        M.FormSelect.init($('select#newbot'), { classes: 'newbot-dd-wrap' });
        $('form').submit(async e => {
            e.preventDefault();
            let lib = $('select').val();
            if (lib === 'none') lib = undefined;
            try {
                await api.editBot({
                    id: e.target.getAttribute('data-bot-id'),
                    library: lib,
                    prefix: undefIfEmpty($('#bot_prefix').val()),
                    website: undefIfEmpty($('#bot_website').val()),
                    invite: undefIfEmpty($('#bot_invite').val()) || `https://discordapp.com/oauth2/authorize?client_id=${encodeURI(e.target[0].value)}&scope=bot&permissions=0`,
                    github: undefIfEmpty($('#bot_github').val()),
                    shortDescription: undefIfEmpty($('#bot_description').val()),
                    longDescription: undefIfEmpty($('#bot_description-full').val()),
                    vanityURL: undefIfEmpty($('#vanity_url').val()),
                    likeWebhook: undefIfEmpty($('#like_webhook').val()),
                    webhookAuth: undefIfEmpty($('#webhook_auth').val())
                });
                localStorage.setItem('toastOnNext', 'Edited bot');
                document.location.replace(`/bot/${e.target.getAttribute('data-bot-id')}`);
            } catch (error) {
                M.toast({ html: error.message });
                console.error(error);
            }
        });
    } else if (window.IS_BOT_PAGE && window.mojs) {
        let like = $('#like-btn');
        const burst = new mojs.Burst({
            parent: like,
            radius: { 25: 75 },
            count: 15,
            duration: 600,
            children: {
                shape: ['circle', 'polygon'],
                fill: ['#7289da', '#90caf9', '#99AAB5'],
                angle: { 0: 180 },
                degreeShift: 'rand(-360, 360)',
                delay: 'stagger(0, 25)'
            }
        });
        like.click(async e => {
            e.preventDefault();
            try {
                if (like.hasClass('modal-trigger')) return;
                const likeRes = await api.likeBot(like.data('bot-id'));
                const likeText = $('#like-btn p');
                burst.play();
                like.addClass('animated tada');
                setTimeout(() => $('#like-btn').removeClass('animated tada'), 1000);
                const svg = $('#like-btn svg');

                if (likeRes.ok === 'Liked bot') {
                    likeText.html(parseInt(likeText.html()) + 1);
                    svg.removeClass('grey-text');
                    svg.addClass('red-text');
                } else if (likeRes.ok === 'Unliked bot') {
                    likeText.html(parseInt(likeText.html()) - 1);
                    svg.removeClass('red-text');
                    svg.addClass('grey-text');
                }
            } catch (error) {
                M.toast({ html: error.message });
                console.error(error);
            }
        });
    }
});
