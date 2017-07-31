"use strict";

const express = require('express');
const morgan = require('morgan');
const app = express();
const {DATABASE_URL} = require('./config');
const pg = require('pg');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

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
	console.log(req.headers);
	console.log(req.rawHeaders);
	console.log(req.params);
	console.log(req.query);
	console.log(req.body);
	for (let i=0; i<requiredFields.length; i++) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing ${field} in request body`
			return res.status(400).send(message);
	    }
	}
	const username = req.body.username;
	const password = req.body.password;
	if (username === "") return res.status(400).send("username cannot be blank");
	const queryText = `insert into users (username, hashedpassword) values(
		'${doubleQuotes(username)}', 
		'${doubleQuotes(bcrypt.hashSync(password, 10))}');`;
	app.db.query(queryText)
		.then((queryRes) => res.status(201).json({
			"username": req.body.username, 
			"password": req.body.password
		}))
		.catch(
			err => {
				if (err.detail === 
					`Key (username)=(${req.body.username}) already exists.`)
					res.status(409).send("username already taken");
				else {
					console.log(err);
					res.status(500).send();
				}
			});
});

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
