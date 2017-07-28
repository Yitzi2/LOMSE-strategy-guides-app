const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL, workaroundConnect} = require('../config');

describe('user data tests', function () {
	this.timeout(15000);
	before(function(done) {
		if (process.env.CAN_CONNECT_DIRECTLY) {//May be undefined if cannot.
			TEST_DATABASE_URL
				.then(url => runServer(url))
				.then(done);
		}
		else runServer(workaroundConnect)
			.then(done);
  	});

	beforeEach(function () {
		queryText = "delete from users;" //Clear database for next test.
		return app.db.query(queryText);
	});


	after(function(done) {
		queryText = "delete from users;" //Clear database.
		app.db.query(queryText)
			.then(closeServer())
			.then(() => done());
	});

	describe ('users POST endpoint', function () {
		it ('should return access code 201 and user info', function () {
			const newUser = {username: "Order", password: "Chaos"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.deep.equal(newUser);
			});
		});
		it ('should not store password in plaintext', function () {
				//This should be the only test accessing the database directly.
			const newUser = {username: "Order", password: "Chaos"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					const queryText = "select hashedpassword from users;"
					app.db.query(queryText)
						.then(function (queryResult) {
							console.log("hashed password was "+
								JSON.parse(queryResult.body)
								.rows[0].hashedpassword);
								/*To manually check that 
								it isn't even close to plaintext.*/
							queryResult.should.not.equal(newUser.password);
						});
			});
		});
		it ('should be able to create two users', function () {
			const newUser = {username: "Order", password: "Chaos"};
			const newUser2 = {username: "Life", password: "Death"}
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					return chai.request(app)
						.post('/users')
						.send(newUser2)
						.then(function (res2) {
							res.should.have.status(201);
							res.should.be.json;
							res.body.should.deep.equal(newUser);
							res2.should.have.status(201);
							res2.should.be.json;
							res2.body.should.deep.equal(newUser2);
						});
			});
		});
		it ('should not be able to create two users with the same username', function () {
			const newUser = {username: "Order", password: "Chaos"};
			const newUser2 = {username: "Order", password: "Death"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {

					return chai.request(app)
						.post('/users')
						.send(newUser2)
						/*Status codes of 4XX and 5XX are currently treated as 
						errors, so need to be caught.  A then block is also 
						needed to ensure failure if it returns a 2XX status code, 
						nd repeating the test in the then block allows for forward 
						compatibility if 4XX and 5XX cease to be treated as errors.*/
						.then(function (res2) {
							res2.should.have.status(500);
							JSON.parse(res2.response.text).detail.should.be.a("string");
							JSON.parse(res2.response.text).detail.should.equal(
								"Key (username)=(Order) already exists.");
						})
						.catch(function (res2) {
							res2.should.have.status(500);
							JSON.parse(res2.response.text).detail.should.be.a("string");
							JSON.parse(res2.response.text).detail.should.equal(
								"Key (username)=(Order) already exists.");
						});
				});
		});
		it ('should return 400 and error message if username is missing', function () {
			const newUser = {password: "Chaos"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					res.should.have.status(400);
					res.text.should.be.a("string");
					res.text.should.equal("Missing username in request body");
			})
				.catch(function (res) {
					res.should.have.status(400);
					res.response.text.should.be.a("string");
					res.response.text.should.equal("Missing username in request body");
			});
		});
	});
});