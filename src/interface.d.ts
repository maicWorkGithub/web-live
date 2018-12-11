import {IChannelConfig, IMixConfig, IWsRtcConfig} from './wsrtc';

interface ILiveInterface {
    init(config:IWsRtcConfig):void;
    auth():Promise<boolean>;
    createChannel(channelConfig:IChannelConfig):Promise<any>;
    destroyChannel():Promise<boolean>;
    joinChannel(channelConfig:IChannelConfig):Promise<boolean>;
    leaveChannel():Promise<boolean>;
    startMix():Promise<boolean>;
    createMix(mixConfig:IMixConfig):Promise<boolean>;
    updateMix(mixConfig:IMixConfig):Promise<boolean>;
    stopMix():Promise<boolean>;
    shareDesktop():void;
    stopDesktop():void;
    play(url:string,secCallback:(timestamp:number)=>void):void;
    playMix():void;
}