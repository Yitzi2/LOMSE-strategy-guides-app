"use strict";

const express = require('express');
const morgan = require('morgan');
const app = express();
const {DATABASE_URL} = require('./config');
const pg = require('pg');

pg.defaults.ssl = true;

app.use(express.static('public'));
app.use(morgan('common'));
let server;

function runServer (database_url = DATABASE_URL) {
	return new Promise ((res, rej) => {
		const port = process.env.PORT || 8080;
		server = app.listen(port, () => {
			console.log(`Server is listening on port ${port}`);
			const pool = new pg.Pool({connectionString: database_url});
			app.pool = pool;
			res()
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

/*app.post('/users', (req, res) => {

});*/


if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
