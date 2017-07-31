"use strict";
const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL, workaroundConnect} = require('../config');

describe('user data tests', function () {
	this.timeout(15000);
	before(function(done) {
		TEST_DATABASE_URL
			.then(url => runServer(url))
			.then(done);
	});

	beforeEach(function () {
		const queryText = "delete from users;" //Clear database for next test.
		return app.db.query(queryText);
	});


	after(function(done) {
		const queryText = "delete from users;" //Clear database.
		app.db.query(queryText)
			.then(closeServer())
			.then(() => done());
	});

	describe ('users POST endpoint', function () {
		it ('should return code 201 and user info', function () {
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
					return app.db.query(queryText)
						.then(function (queryResult) {
							console.log("hashed password was "+
								queryResult.rows[0].hashedpassword);
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
			const newUser2 = {username: "Order", password: "Fire"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					return chai.request(app)
						.post('/users')
						.send(newUser2)
						/*Status codes of 4XX are currently treated as errors, so 
						need to be caught.  A then block is also needed to ensure 
						failure if it returns a 2XX status code, and repeating the 
						test in the then block allows for forward compatibility 
						if 4XX cease to be treated as errors.*/
						.then(function (res2) {
							res2.should.have.status(409);
							res2.response.text.should.be.a("string");
							res2.response.text.should.equal(
								"username already taken");
						})
						.catch(function (res2) {
							res2.should.have.status(409);
							res2.response.text.should.be.a("string");
							res2.response.text.should.equal(
								"username already taken");
						});
				});
		});
		it ('Even if another is in between', function () {
			const newUser = {username: "Order", password: "Chaos"};
			const newUser2 = {username: "Life", password: "Death"};
			const newUser3 = {username: "Order", password: "Fire"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					return chai.request(app)
						.post('/users')
						.send(newUser2)
							.then(function (res2) {
								return chai.request(app)
								.post('/users')
								.send(newUser3)
								.then(function (res3) {
									res3.should.have.status(409);
									res3.response.text.should.be.a("string");
									res3.response.text.should.equal(
										"username already taken");
								})
								.catch(function (res3) {
									res3.should.have.status(409);
									res3.response.text.should.be.a("string");
									res3.response.text.should.equal(
										"username already taken");
								});
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
		it ('should return 400 and error message if password is missing', function () {
			const newUser = {username: "Order"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					res.should.have.status(400);
					res.text.should.be.a("string");
					res.text.should.equal("Missing password in request body");
			})
				.catch(function (res) {
					res.should.have.status(400);
					res.response.text.should.be.a("string");
					res.response.text.should.equal("Missing password in request body");
			});
		});
		it ('should return 400 and error message if username is blank', function () {
			const newUser = {username: "", password: "Chaos"};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					res.should.have.status(400);
					res.text.should.be.a("string");
					res.text.should.equal("username cannot be blank");
			})
				.catch(function (res) {
					res.should.have.status(400);
					res.response.text.should.be.a("string");
					res.response.text.should.equal("username cannot be blank");
			});
		});
		it ('should accept it if password is blank', function () {
			const newUser = {username: "Order", password: ""};
			return chai.request(app)
				.post('/users')
				.send(newUser)
				.then(function (res) {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.deep.equal(newUser);
			})
		});
	});
});