import { OfflineAudioContext } from 'standardized-audio-context';
import { load } from '../../src/module';

describe('module', () => {

    let offlineAudioContext;
    let sampleRate;
    let webAudioBeatDetector;

    afterEach(() => {
        Worker.reset();
    });

    beforeEach(() => {
        sampleRate = 44100;

        offlineAudioContext = new OfflineAudioContext(1, 1, sampleRate);

        Worker = ((OriginalWorker) => { // eslint-disable-line no-global-assign
            const instances = [];

            return class ExtendedWorker extends OriginalWorker {

                constructor (url) {
                    super(url);

                    const addEventListener = this.addEventListener;

                    // This is an ugly hack to prevent the broker from handling mirrored events.
                    this.addEventListener = (index, ...args) => {
                        if (typeof index === 'number') {
                            return addEventListener.apply(this, args);
                        }
                    };

                    instances.push(this);
                }

                static addEventListener (index, ...args) {
                    return instances[index].addEventListener(index, ...args);
                }

                static get instances () {
                    return instances;
                }

                static reset () {
                    Worker = OriginalWorker; // eslint-disable-line no-global-assign
                }

            };
        })(Worker);

        const blob = new Blob([
            `self.addEventListener('message', ({ data }) => {
                self.postMessage(data);
            });`
        ], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);

        webAudioBeatDetector = load(url);

        URL.revokeObjectURL(url);
    });

    describe('analyze()', () => {

        let audioBuffer;

        beforeEach(() => {
            audioBuffer = offlineAudioContext.createBuffer(1, 2000, sampleRate);
        });

        it('should send the correct message', (done) => {
            Worker.addEventListener(0, 'message', ({ data }) => {
                expect(data.id).to.be.a('number');

                const channelData = data.params.channelData;

                expect(channelData.length).to.equal(audioBuffer.length);

                expect(data).to.deep.equal({
                    id: data.id,
                    method: 'analyze',
                    params: { channelData, sampleRate }
                });

                done();
            });

            webAudioBeatDetector.analyze(audioBuffer);
        });

    });

    describe('guess()', () => {

        let audioBuffer;

        beforeEach(() => {
            audioBuffer = offlineAudioContext.createBuffer(1, 2000, sampleRate);
        });

        it('should send the correct message', (done) => {
            Worker.addEventListener(0, 'message', ({ data }) => {
                expect(data.id).to.be.a('number');

                const channelData = data.params.channelData;

                expect(channelData.length).to.equal(audioBuffer.length);

                expect(data).to.deep.equal({
                    id: data.id,
                    method: 'guess',
                    params: { channelData, sampleRate }
                });

                done();
            });

            webAudioBeatDetector.guess(audioBuffer);
        });

    });

});
