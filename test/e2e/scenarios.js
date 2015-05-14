var StorageProviderFirebase = require('../../src/index.js');

var provider = new StorageProviderFirebase(process.env.FIREBASE_URL);
var chai = require('chai');
var	chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

function testSaveErrorCase () {
	describe('update record with invalid data::', function() {
		this.timeout(10000);
		it('should reject the promise', function() {
			var data = {undefinedData: undefined};
			var returnedPromise = provider.save('namespace', '1234', data);
			return expect(returnedPromise).to.eventually.be.rejected;
		});
	});
}

testSaveErrorCase();