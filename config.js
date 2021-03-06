const fs = require('fs');
let request = require('request');

exports.DATABASE_URL = process.env.DATABASE_URL;
exports.TEST_DATABASE_URL = new Promise ((resolve, reject) => {
	if (process.env.TEST_DATABASE_URL) resolve(process.env.TEST_DATABASE_URL);
	else {
		let HEROKU_AUTH;
		if (process.env.HEROKU_AUTH) HEROKU_AUTH = process.env.HEROKU_AUTH;
		else HEROKU_AUTH = require('./env').HEROKU_AUTH; //local usage only.
		const options = {
			url: 'https://api.heroku.com/apps/lomse-strategy-guides-app/config-vars',
			headers: {
				'Accept': 'application/vnd.heroku+json; version=3',
				'Authorization': `Bearer ${HEROKU_AUTH}`
			}
		};
		request.get(options, (err, res) => 
			resolve(JSON.parse(res.body).TEST_DATABASE_URL)
		);
	}
});
