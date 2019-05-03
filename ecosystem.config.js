module.exports = {
  apps : [{
    name: "DBC",
    script: "./app.js",
    watch: true,
	ignore_watch: "node_modules rethinkdb-new",
  }]
}