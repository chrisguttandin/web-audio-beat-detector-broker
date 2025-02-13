import { createBroker } from 'broker-factory';
import { isSupported } from 'standardized-audio-context';
import { TWebAudioBeatDetectorWorkerDefinition } from 'web-audio-beat-detector-worker';
import { render } from './helpers/render';
import { IWebAudioBeatDetectorBrokerDefinition } from './interfaces';
import { TArgs, TWebAudioBeatDetectorBrokerLoader, TWebAudioBeatDetectorBrokerWrapper } from './types';

/*
 * @todo Explicitly referencing the barrel file seems to be necessary when enabling the
 * isolatedModules compiler option.
 */
export * from './types/index';

export { isSupported };

export const wrap: TWebAudioBeatDetectorBrokerWrapper = createBroker<
    IWebAudioBeatDetectorBrokerDefinition,
    TWebAudioBeatDetectorWorkerDefinition
>({
    analyze: ({ call }) => {
        return async (...args: TArgs) => {
            const [audioBuffer, offsetOrTempoSettings, durationOrTempoSettings] = args;
            const offset = typeof offsetOrTempoSettings === 'number' ? offsetOrTempoSettings : 0;
            const duration = typeof durationOrTempoSettings === 'number' ? durationOrTempoSettings : audioBuffer.duration - offset;
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);
            const tempoSettings =
                typeof offsetOrTempoSettings === 'object'
                    ? offsetOrTempoSettings
                    : typeof durationOrTempoSettings === 'object'
                      ? durationOrTempoSettings
                      : (args[3] ?? null);

            return call('analyze', { channelData, sampleRate, ...(tempoSettings === null ? tempoSettings : { tempoSettings }) }, [
                channelData.buffer
            ]);
        };
    },
    guess: ({ call }) => {
        return async (...args: TArgs): Promise<{ bpm: number; offset: number }> => {
            const [audioBuffer, offsetOrTempoSettings, durationOrTempoSettings] = args;
            const offset = typeof offsetOrTempoSettings === 'number' ? offsetOrTempoSettings : 0;
            const duration = typeof durationOrTempoSettings === 'number' ? durationOrTempoSettings : audioBuffer.duration - offset;
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);
            const tempoSettings =
                typeof offsetOrTempoSettings === 'object'
                    ? offsetOrTempoSettings
                    : typeof durationOrTempoSettings === 'object'
                      ? durationOrTempoSettings
                      : (args[3] ?? null);

            return call('guess', { channelData, sampleRate, ...(tempoSettings === null ? tempoSettings : { tempoSettings }) }, [
                channelData.buffer
            ]);
        };
    }
});

export const load: TWebAudioBeatDetectorBrokerLoader = (url: string) => {
    const worker = new Worker(url);

    return wrap(worker);
};
