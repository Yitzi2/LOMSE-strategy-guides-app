require('dotenv').config();
let request = require('request') 
exports.DATABASE_URL = process.env.DATABASE_URL;
exports.TEST_DATABASE_URL = new Promise ((resolve, reject) => {
	if (process.env.TEST_DATABASE_URL) resolve(process.env.TEST_DATABASE_URL);
	else {
		let options = {
			url: 'https://api.heroku.com/apps/lomse-strategy-guides-app/config-vars',
			headers: {
				'Accept': 'application/vnd.heroku+json; version=3',
				'Authorization': `Bearer ${process.env.HEROKU_AUTH}`
			}
		};
		request.get(options, res => resolve(res.TEST_DATABASE_URL));
	}
});