import { IDefaultBrokerDefinition } from 'broker-factory';
import { IWebAudioBeatDetectorBrokerDefinition } from '../interfaces';

export type TWebAudioBeatDetectorBrokerWrapper = (
    sender: MessagePort | Worker
) => IWebAudioBeatDetectorBrokerDefinition & IDefaultBrokerDefinition;
