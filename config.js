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
		request.get(options, (err, res) => resolve(res.TEST_DATABASE_URL));
	}
});
if (process.env.SSL_PRIVATE_KEY) 
	exports.SSL_PRIVATE_KEY = process.env.SSL_PRIVATE_KEY;
else exports.SSL_PRIVATE_KEY = fs.readFileSync('key.pem', 'utf8');
exports.SSL_CERTIFICATE = fs.readFileSync('crt.pem', 'utf8');