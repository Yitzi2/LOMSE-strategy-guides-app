"use strict";

const express = require('express');
const morgan = require('morgan');
const app = express();
const {DATABASE_URL} = require('./config');
const pg = require('pg');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

pg.defaults.ssl = true;

app.use(express.static('public'));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

let server;

function doubleQuotes(str) {
	return str.replace(/'/g, "''");
}

function runServer (database_url = DATABASE_URL) {
	return new Promise ((res, rej) => {
		const port = process.env.PORT || 8080;
		server = app.listen(port, () => {
			console.log(`Server is listening on port ${port}`);
			app.db = new pg.Pool({connectionString: database_url});
			res();
		})
		.on('error', err => rej(err))	
	});
}

function closeServer () {
	return new Promise ((res, rej) => {
		console.log('closing server');
		server.close(err => {
			if (err) rej(err);
			else res();
		});
	});
}

app.post('/users', (req, res) => {
	const requiredFields = ['username', 'password'];
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing ${field} in request body`
			return res.status(400).send(message);
	    }
	}
	const username = req.body.username;
	const password = req.body.password;
	//To add: Entry for halfsalt.
	if (username === "") return res.status(400).send("username cannot be blank");
		//Half uses a callback, so that the salt can be stored in the cookie
	bcrypt.genSalt(9, function (err, salt) {
		if (err) {
			console.log(err);
			res.status(500).send();
		}
		else bcrypt.hash(password, salt, function (err, hash1) {
			bcrypt.hash(hash1, 9) //From here on can be promises.
				.then(hash2 => {
					const queryText = `insert into users (username, hashedpassword,
					halfsalt) values('${doubleQuotes(username)}',
					'${doubleQuotes(hash2)}', '${doubleQuotes(salt)}');`;
					return app.db.query(queryText);
				})
				.then(queryres => {res
					.status(201)
					.cookie("authentication", 
						`{username: ${username}, halfhash: ${hash1}}`, {
							maxAge: 1000*86400*365.2425*1000,
							httpOnly: true,
							secure: true
						})
					.json({
						"username": username, 
						"password": password
					})})
				.catch(err => {
					if (err.detail === 
						`Key (username)=(${username}) already exists.`)
							res.status(409).send("username already taken");
					else {
						console.log(err);
						res.status(500).send();
					}
				});
		});
	});
});

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
