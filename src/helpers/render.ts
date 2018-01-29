import { OfflineAudioContext } from 'standardized-audio-context';

export const render = (audioBuffer: AudioBuffer, offset: number, duration: number) => {
    const offlineAudioContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        duration * audioBuffer.sampleRate,
        audioBuffer.sampleRate
    );
    const biquadFilter = offlineAudioContext.createBiquadFilter();
    const bufferSourceNode = offlineAudioContext.createBufferSource();

    biquadFilter.frequency.value = 240;
    biquadFilter.type = 'lowpass';

    bufferSourceNode.buffer = audioBuffer;

    bufferSourceNode
        .connect(biquadFilter)
        .connect(offlineAudioContext.destination);

    bufferSourceNode.start(0, offset, duration);

    return offlineAudioContext
        .startRendering()
        .then((renderedBuffer) => {
            const channelData = renderedBuffer.getChannelData(0);
            const sampleRate = renderedBuffer.sampleRate;

            return { channelData, sampleRate };
        });
};
