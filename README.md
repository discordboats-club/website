# discordboats.club
Discord bot list.


### Self hosting the bot list for development



We've only tested this on Windows and Linux at the moment, feel free to make a PR editing this README file if you've found it to work on other OSes too.
* Clone the repository.
* Run `npm install` or `yarn`, this will install all dependencies and enable the git hooks.
* Setup a RethinkDB instance on your local machine, reproduce the following structure:  
\[database\]     \[table\]

`discordboatsclubv1.comments`

`discordboatsclubv1.users`

`discordboatsclubv1.likes`

`discordboatsclubv1.sessions`

`discordboatsclubv1.bots`
* Rename the `config.json.example` to `config.json` and fill in the required fields with your Discord application details.
* Run the app, `pm2 start app.js`
* I recommend you setup a backup system with rethinkdb and enable automatic backups
