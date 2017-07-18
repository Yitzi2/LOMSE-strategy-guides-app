const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();

const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config')

describe('status code and response type tests', function () {
	before(function() {
    	return runServer(TEST_DATABASE_URL);
  	});

	after(function() {
		return closeServer();
	});

	describe ('accessible pages', function () {
		it ('should return 200 and HTML for index', function () {
			return chai.request(app)
				.get('/')
				.then(function (res) {
					res.should.have.status(200);
					res.should.be.html;
				});
		});
	});
});