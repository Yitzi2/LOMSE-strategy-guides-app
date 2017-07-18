"use strict";

const express = require('express');
const morgan = require('morgan');
const app = express();
const {DATABASE_URL} = require('./config');

app.use(express.static('public'));
app.use(morgan('common'));
let server;

function runServer (database_url = config.DATABASE_URL) {
	return new Promise ((res, rej) => {
		const port = process.env.PORT || 8080;
		app.database_url = database_url;
		server = app.listen(port, () => {
			console.log(`Server is listening on port ${port}`);
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

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {runServer, app, closeServer};
