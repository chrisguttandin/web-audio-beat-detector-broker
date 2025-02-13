import { IDefaultBrokerDefinition } from 'broker-factory';
import { IWebAudioBeatDetectorBrokerDefinition } from '../interfaces';

export type TWebAudioBeatDetectorBrokerLoader = (url: string) => IWebAudioBeatDetectorBrokerDefinition & IDefaultBrokerDefinition;
