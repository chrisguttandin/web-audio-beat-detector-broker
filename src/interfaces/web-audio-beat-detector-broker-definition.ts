import { IBrokerDefinition } from 'broker-factory';
import { TArgs } from '../types';

export interface IWebAudioBeatDetectorBrokerDefinition extends IBrokerDefinition {
    analyze(...args: TArgs): Promise<number>;

    guess(...args: TArgs): Promise<{ bpm: number; offset: number }>;
}
