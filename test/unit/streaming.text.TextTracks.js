import TextTracks from '../../src/streaming/text/TextTracks';
import EventBus from '../../src/core/EventBus';
import Events from '../../src/core/events/Events';
import VoHelper from './helpers/VOHelper';
import VideoModelMock from './mocks/VideoModelMock';
import Settings from '../../src/core/Settings';

const SUBTITLE_DATA = 'subtitle lign 1';
// Cue settings as VTTParser hands them over, i.e. `align:left line:28% position:31% size:50%`.
const CUE_STYLES = {align: 'left', line: 28, snapToLines: false, position: 31, size: 50};
const chai = require('chai');
const expect = chai.expect;
const context = {};
const eventBus = EventBus(context).getInstance();

describe('TextTracks', function () {

    const voHelper = new VoHelper();
    const streamInfo = voHelper.getDummyStreamInfo();
    const settings = Settings(context).getInstance();
    let textTracks;
    let videoModelMock;

    beforeEach(function () {
    });

    afterEach(function () {
        settings.reset();
    });

    beforeEach(function () {
        videoModelMock = new VideoModelMock();
        textTracks = TextTracks(context).create({
            videoModel: videoModelMock,
            streamInfo,
            settings
        });
        textTracks.initialize();
    });

    afterEach(function () {
        textTracks.deleteAllTextTracks();
    });

    describe('Method getTrackIdxForId', function () {
        it('should return -1 if getTrackIdxForId is called but textTrackQueue is empty', function () {
            const trackId = textTracks.getTrackIdxForId(0);

            expect(trackId).to.equal(-1); // jshint ignore:line
        });
    });

    describe('Method addTextTrack', function () {
        it('should trigger TEXT_TRACK_ADDED and TEXT_TRACKS_QUEUE_INITIALIZED events when a call to addTextTrackfunction is made', function () {
            const spyTrackAdded = chai.spy();
            const spyTracksQueueInit = chai.spy();

            eventBus.on(Events.TEXT_TRACK_ADDED, spyTrackAdded);
            eventBus.on(Events.TEXT_TRACKS_QUEUE_INITIALIZED, spyTracksQueueInit);

            textTracks.addTextTrack({
                index: 0,
                kind: 'subtitles',
                label: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            const currrentTrackIdx = textTracks.getCurrentTrackIdx();
            expect(currrentTrackIdx).to.equal(0); // jshint ignore:line
            expect(spyTrackAdded).to.have.been.called();
            expect(spyTracksQueueInit).to.have.been.called();

            eventBus.off(Events.TEXT_TRACK_ADDED, spyTrackAdded);
            eventBus.off(Events.TEXT_TRACKS_QUEUE_INITIALIZED, spyTracksQueueInit);
        });
    });

    describe('Method addCaptions', function () {
        it('should call addCue function when a call to addCaptions is made', function () {
            textTracks.addTextTrack({
                index: 0,
                kind: 'subtitles',
                id: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            let track = videoModelMock.getTextTrack('subtitles', 'eng');

            textTracks.addCaptions(0, 0, [{type: 'noHtml', data: SUBTITLE_DATA, start: 0, end: 2}]);

            expect(videoModelMock.getCurrentCue(track).text).to.equal(SUBTITLE_DATA);
        });

        it('should apply the WebVTT cue settings when dispatchForManualRendering is enabled', function () {
            settings.update({streaming: {text: {dispatchForManualRendering: true}}});

            textTracks.addTextTrack({
                index: 0,
                kind: 'subtitles',
                id: 'eng',
                defaultTrack: true,
                isTTML: true}, 1);

            textTracks.createTracks();
            let track = videoModelMock.getTextTrack('subtitles', 'eng');

            textTracks.addCaptions(0, 0, [{
                type: 'noHtml',
                data: SUBTITLE_DATA,
                start: 0,
                end: 2,
                styles: CUE_STYLES}]);

            const cue = videoModelMock.getCurrentCue(track);

            expect(cue.align).to.equal(CUE_STYLES.align);
            expect(cue.line).to.equal(CUE_STYLES.line);
            expect(cue.snapToLines).to.equal(CUE_STYLES.snapToLines);
            expect(cue.position).to.equal(CUE_STYLES.position);
            expect(cue.size).to.equal(CUE_STYLES.size);
        });
    });
});
