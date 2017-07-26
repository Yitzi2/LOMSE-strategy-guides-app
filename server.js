"use strict";

const express = require('express');
const morgan = require('morgan');
const app = express();
const {DATABASE_URL, SSL_PRIVATE_KEY, SSL_CERTIFICATE} = require('./config');
const pg = require('pg');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const https = require('https');
const http = require('http');

pg.defaults.ssl = true;

app.use(express.static('public'));
app.use(morgan('common'));
app.use(bodyParser.json());

let server;

function doubleQuotes(str) {
	return str.replace(/'/g, "''");
}

function runServer (database_url = DATABASE_URL) {
	return new Promise ((res, rej) => {
		const port = process.env.PORT || 8080;
		server = http.createServer(/*{
			key: SSL_PRIVATE_KEY,
			cert: SSL_CERTIFICATE
		}, */app)
		.listen(port, () => {
			console.log(`Server is listening on port ${port}`);
			const pool = new pg.Pool({connectionString: database_url});
			app.pool = pool;
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
			const message = `Missing \`${field}\` in request body`
			console.error(message);
			return res.status(400).send(message);
	    }
	}
	const queryText = `insert into users (username, hashedpassword) values(
		'${doubleQuotes(req.body.username)}', 
		'${doubleQuotes(bcrypt.hashSync(req.body.password, 10))}');`;
	app.pool.query(queryText)
		.catch(err => {
			console.error(err);
			res.status(500).send(`Database access error: ${err}`)
		}
		.then(() => res.status(201).json({req.body.username, req.body.password}))
		.catch(err => {
			console.error(err);
			res.status(500).send(`Server error: ${err}`)
		}
		);
});

app.get('/users', (req, res) => {
	res.status(200).send("working fine");
});


if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
