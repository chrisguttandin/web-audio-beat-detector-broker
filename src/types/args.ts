import { ITempoSettings } from 'web-audio-beat-detector-worker';

export type TArgs =
    | [audioBuffer: AudioBuffer]
    | [audioBuffer: AudioBuffer, offset: number]
    | [audioBuffer: AudioBuffer, tempoSettings: ITempoSettings]
    | [audioBuffer: AudioBuffer, offset: number, duration: number]
    | [audioBuffer: AudioBuffer, offset: number, tempoSettings: ITempoSettings]
    | [audioBuffer: AudioBuffer, offset: number, duration: number, tempoSettings: ITempoSettings];
