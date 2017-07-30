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
		request.get(options, (err, res) => {console.log("foo"+Object.keys(res.body));
			console.log(res.body.TEST_DATABASE_URL);
			resolve(res.body.TEST_DATABASE_URL);});
	}
});

exports.workaroundConnect = {
	query: function (queryText) {
		const options = {
			url: "https://pg-access.herokuapp.com/",
			body: queryText,
			headers: { 'content-type': 'text/plain' }
		};
		return new Promise ((resolve, reject) => {
			request.post(options, (err, response) => {
				if (err) reject(err);
				else if (response.statusCode === 500) {
					reject(JSON.parse(response.body));
				}
				else resolve(JSON.parse(response.body));
			});
		});
	}
	//Other methods go here.
};
