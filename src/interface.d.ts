import {IChannelConfig, IWsRtcConfig} from './wsrtc';

interface ILiveInterface {
    init(config:IWsRtcConfig):void;
    auth():Promise<boolean>;
    createChannel(channelConfig:IChannelConfig):Promise<any>;
    destroyChannel():Promise<boolean>;
    joinChannel(channelConfig:IChannelConfig):Promise<boolean>;
    leaveChannel():Promise<boolean>;
    startMix():Promise<boolean>;
    updateMix():Promise<boolean>;
    stopMix():Promise<boolean>;
    shareDesktop():void;
    stopDesktop():void;
    play():void;
    playMix():void;
}