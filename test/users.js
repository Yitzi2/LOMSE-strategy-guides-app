const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

describe('user data tests', function () {
	before(function(done) {
		TEST_DATABASE_URL
			.then(url => runServer(url))
			.then(done);
  	});

	beforeEach(function () {
		queryText = "delete * from users;" //Clear database for next test.
		return app.pool.query(queryText);
	});


	after(function(done) {
		queryText = "delete * from users;" //Clear database.
		app.pool.query(queryText)
			.then(closeServer())
			.then(done);
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
					res.should.deep.equal.newUser;
					const queryText = "select hashedpassword from users;"
					const hashedPassword = app.pool.query(queryText).then(r => r)
						.then
					console.log(`hashed password was 
						${app.pool.query(queryText)}`);
						//To manually check it isn't close to plaintext.
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
					const hashedPassword = app.pool.query(queryText)
						.then(function (queryResult) {
							console.log(`hashed password was ${queryResult}`);
							queryResult.should.not.equal.newUser.password;
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
							res.should.deep.equal.newUser;
							res2.should.have.status(201);
							res2.should.be.json;
							res2.should.deep.equal.newUser2;
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
					res.body.should.be.a("string");
					res.body.should.equal("Missing username in request body");
			});
		});
	});
});