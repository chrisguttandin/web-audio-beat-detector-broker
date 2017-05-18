import { IAnalyzeRequest, IAnalyzeResponse, IGuessRequest, IGuessResponse, IWorkerEvent } from 'web-audio-beat-detector-worker';
import { render } from './helpers/render';

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;

const generateUniqueId = (set: Set<number>) => {
    let id = Math.round(Math.random() * MAX_SAFE_INTEGER);

    while (set.has(id)) {
        id = Math.round(Math.random() * MAX_SAFE_INTEGER);
    }

    return id;
};

export const load = (url: string) => {
    const worker = new Worker(url);

    const ongoingRecordingRequests: Set<number> = new Set();

    const analyze = (audioBuffer: AudioBuffer, offset = 0, duration = audioBuffer.duration - offset) => {
        return new Promise(async (resolve, reject) => {
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);

            const id = generateUniqueId(ongoingRecordingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
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

    const guess = (audioBuffer: AudioBuffer, offset = 0, duration = audioBuffer.duration - offset) => {
        return new Promise(async (resolve, reject) => {
            const { channelData, sampleRate } = await render(audioBuffer, offset, duration);

            const id = generateUniqueId(ongoingRecordingRequests);

            const onMessage = ({ data }: IWorkerEvent) => {
                if (data.id === id) {
                    ongoingRecordingRequests.delete(id);

                    worker.removeEventListener('message', onMessage);

                    if (data.error === null) {
                        const { bpm, offset } = (<IGuessResponse> data).result;

                        resolve({ bpm, offset });
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
