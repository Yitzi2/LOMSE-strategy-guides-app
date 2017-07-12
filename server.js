const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(express.static('public'));
app.use(morgan('common'));
let server;

function runServer () {
	return new Promise ((res, rej) => {
		const port = process.env.PORT || 8080
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
