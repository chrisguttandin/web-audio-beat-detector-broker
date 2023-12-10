import { addUniqueNumber } from 'fast-unique-numbers';
import { isSupported } from 'standardized-audio-context';
import { IAnalyzeRequest, IAnalyzeResponse, IGuessRequest, IGuessResponse, IWorkerEvent } from 'web-audio-beat-detector-worker';
import { render } from './helpers/render';
import { TArgs } from './types';

/*
 * @todo Explicitly referencing the barrel file seems to be necessary when enabling the
 * isolatedModules compiler option.
 */
export * from './types/index';

export { isSupported };

export const load = (url: string) => {
    const worker = new Worker(url);

    const ongoingRecordingRequests: Set<number> = new Set();

    const analyze = (...args: TArgs): Promise<number> => {
        const [audioBuffer, offsetOrTempoSettings, durationOrTempoSettings] = args;
        const offset = typeof offsetOrTempoSettings === 'number' ? offsetOrTempoSettings : 0;
        const duration = typeof durationOrTempoSettings === 'number' ? durationOrTempoSettings : audioBuffer.duration - offset;
        const tempoSettings =
            typeof offsetOrTempoSettings === 'object'
                ? offsetOrTempoSettings
                : typeof durationOrTempoSettings === 'object'
                  ? durationOrTempoSettings
                  : args[3] ?? null;

        return new Promise(async (resolve, reject) => {
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);

            const id = addUniqueNumber(ongoingRecordingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve((<IAnalyzeResponse>data).result.tempo);
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(
                <IAnalyzeRequest>{
                    id,
                    method: 'analyze',
                    params: { channelData, sampleRate, ...(tempoSettings === null ? tempoSettings : { tempoSettings }) }
                },
                [<ArrayBuffer>channelData.buffer]
            );
        });
    };

    const guess = (...args: TArgs): Promise<{ bpm: number; offset: number }> => {
        const [audioBuffer, offsetOrTempoSettings, durationOrTempoSettings] = args;
        const offset = typeof offsetOrTempoSettings === 'number' ? offsetOrTempoSettings : 0;
        const duration = typeof durationOrTempoSettings === 'number' ? durationOrTempoSettings : audioBuffer.duration - offset;
        const tempoSettings =
            typeof offsetOrTempoSettings === 'object'
                ? offsetOrTempoSettings
                : typeof durationOrTempoSettings === 'object'
                  ? durationOrTempoSettings
                  : args[3] ?? null;

        return new Promise(async (resolve, reject) => {
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);

            const id = addUniqueNumber(ongoingRecordingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve((<IGuessResponse>data).result);
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(
                <IGuessRequest>{
                    id,
                    method: 'guess',
                    params: { channelData, sampleRate, ...(tempoSettings === null ? tempoSettings : { tempoSettings }) }
                },
                [<ArrayBuffer>channelData.buffer]
            );
        });
    };

    return {
        analyze,
        guess
    };
};
