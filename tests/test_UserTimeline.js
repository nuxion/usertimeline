const sinon = require('sinon');
const expect = require('chai').expect;
const fs = require('fs');
const utils = require('util');
const UserTimeline = require('../lib/UserTimeline');

const readFileAsync = utils.promisify(fs.readFile);
const twitResponse = JSON.parse(fs.readFileSync('../data/user_timeline.json'));
const twitFile0 = '../data/user_timeline-0.json';
const twitFile1 = '../data/user_timeline-1.json';
const twitFile2 = '../data/user_timeline-2.json';

describe('UserTimeline', function(){
  
  const T = { get : () => "test" };
  const controller = { 
    getLowestId: sinon.stub(),
    getGreatestId: sinon.stub(),
    saveData: sinon.fake(),
  };
  const ut = new UserTimeline(T, controller);

	before(()=>{
		this.files = [];
		/*
		files.push(JSON.parse(readFileAsync(twitFile0)));
		files.push(JSON.parse(readFileAsync(twitFile1)));
		files.push(JSON.parse(readFileAsync(twitFile2)));
		*/

		this.files.push(JSON.parse(fs.readFileSync(twitFile0)))
		this.files.push(JSON.parse(fs.readFileSync(twitFile1)))
		this.files.push(JSON.parse(fs.readFileSync(twitFile2)))
		//await Promise.all([files]);
	})

  beforeEach(() => {
    var tObject = sinon.stub(T, 'get');
    tObject.withArgs('/statuses/user_timeline', 
      { screen_name: 'cosmos_caos', count: 20 })
      .resolves(twitResponse)
      .withArgs('/statuses/user_timeline', 
      { screen_name: 'cosmos_caos', count: 200 })
      .resolves(twitResponse);
  })

  afterEach(()=>{
    sinon.restore();
  })

  it ('Tweet Library Mocking', (done) => {
    T.get('/statuses/user_timeline',
      { screen_name: 'cosmos_caos', count: 20 })
      .then((resp) => {
        expect(resp.resp.statusCode).to.equal(200);
      })
    .then(()=> done(), done);
  })

  it ('getTimeline', async () => {
    response = await ut.getTimeline('cosmos_caos', 20);
    expect(response.resp.statusCode).to.equal(200);
  })

  it('getRangeIds -> getTimeline', async () =>{
    var getTimeline = sinon.spy(ut, 'getTimeline');
    //var fake = sinon.fake.returns(true);
    //ut.getTimeline = fake;

    ut.control.getLowestId = sinon.stub().returns([]);
    ut.control.getGreatestId = sinon.stub().returns([]);

    await ut.getRangeIds('cosmos_caos', 20, {});
    //expect(result).to.equal(true);
    expect(getTimeline.called).to.be.true;
  })

  it('getRangeIds -> getTimelineRange', async () =>{
    var getTimelineRange = sinon.spy(ut, 'getTimelineRange');
    ut.control.getLowestId = sinon.stub().returns([{}]);
    ut.control.getGreatestId = sinon.stub().returns([{}]);

    await ut.getRangeIds('cosmos_caos', 20, {});
    expect(getTimelineRange.called).to.be.true;
  })
  
  it('firstTime', async ()=> {
    ut.control.saveData = sinon.fake.returns(async () => {});
    await ut.firstTime('cosmos_caos', 200);
    
    expect(ut.control.saveData.callCount).to.equal(34);
  })

	it('iterateTweets -> firstTime', async()=>{
		// console.log(`files lenght: ${this.files.length}`);
		// getOldest
		const getOldest = sinon.stub(ut, 'getOldest');
		getOldest.onCall(0).resolves(this.files[0]);
		getOldest.onCall(1).resolves(this.files[1]);
		getOldest.resolves(this.files[2]);

    ut.control.saveData = sinon.fake.returns(async () => {});
		await ut.iterateTweets('cosmos_caos', '1067069307576827904', 20, 'getOldest');
		expect(ut.control.saveData.callCount).to.equal(34);
	})
  it('iterateTweets -> existing', async()=>{
		console.log(`files lenght: ${this.files.length}`);
		// getNewest
		const getNewest = sinon.stub(ut, 'getNewest');
		getNewest.onCall(0).resolves(this.files[0]);
		getNewest.onCall(1).resolves(this.files[1]);
		getNewest.resolves(this.files[2]);
    ut.control.saveData = sinon.fake.returns(async () => {});
		await ut.iterateTweets('cosmos_caos', '324173293819138049', 20, 'getNewest');
		expect(ut.control.saveData.callCount).to.equal(34);
	})

})
