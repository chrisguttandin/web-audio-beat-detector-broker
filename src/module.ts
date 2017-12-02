import { addUniqueNumber } from 'fast-unique-numbers';
import { isSupported } from 'standardized-audio-context';
import { IAnalyzeRequest, IAnalyzeResponse, IGuessRequest, IGuessResponse, IWorkerEvent } from 'web-audio-beat-detector-worker';
import { render } from './helpers/render';

export { isSupported };

export const load = (url: string) => {
    const worker = new Worker(url);

    const ongoingRecordingRequests: Set<number> = new Set();

    const analyze = (audioBuffer: AudioBuffer, offset = 0, duration = audioBuffer.duration - offset): Promise<number> => {
        return new Promise(async (resolve, reject) => {
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);

            const id = addUniqueNumber(ongoingRecordingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve((<IAnalyzeResponse> data).result.tempo);
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<IAnalyzeRequest> { id, method: 'analyze', params: { channelData, sampleRate } }, [ channelData.buffer ]);
        });
    };

    const guess = (
        audioBuffer: AudioBuffer, offset = 0, duration = audioBuffer.duration - offset
    ): Promise<{ bpm: number, offset: number }> => {
        return new Promise(async (resolve, reject) => {
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);

            const id = addUniqueNumber(ongoingRecordingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        resolve((<IGuessResponse> data).result);
                    } else {
                        reject(new Error(data.error.message));
                    }
                }
            };

            worker.addEventListener('message', onMessage);

            worker.postMessage(<IGuessRequest> { id, method: 'guess', params: { channelData, sampleRate } }, [ channelData.buffer ]);
        });
    };

    return {
        analyze,
        guess
    };
};
