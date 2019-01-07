import {
    EventEnum,
    IChannelConfig,
    IMixConfig,
    IModifyMixConfig,
    IWsRtcConfig, Player,
} from './wsrtc';

interface ILiveInterface {
    init(config:IWsRtcConfig):void;
    auth():Promise<boolean>;
    createChannel(channelConfig:IChannelConfig):Promise<any>;
    destroyChannel():Promise<boolean>;
    joinChannel(channelConfig:IChannelConfig):Promise<boolean>;
    leaveChannel():Promise<boolean>;
    startMix():Promise<boolean>;
    createMix(mixConfig:IMixConfig):Promise<boolean>;
    updateMix(mixConfig:IModifyMixConfig):Promise<boolean>;
    stopMix():Promise<boolean>;
    shareDesktop():void;
    stopDesktop():void;
    play(url:string,seiCallback?:(timestamp:number)=>void,urlCallback?:(callback:Function)=>void,listener?:(eventType:EventEnum,data?:any)=>void):Player;
    playMix():void;
    destroy():void;
}