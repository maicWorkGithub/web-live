import {ProfileEnum} from './index';

declare interface WSInitInitParams{
    host:string;
    appId:string;
    appKey:string;
    userId:string;
    userRole:0|1;
    sdkType?:"MIC_LINK"|"STREAMER_SDK",
    logConfig?:any;
}

declare interface WSInitInitResult{
    code:number;
    message:string;
}

/**
 * 初始化模块
 */
declare class WSInit {
    init(params: WSInitInitParams,callback: (result: WSInitInitResult) => void): void;
    destory(): void;
}

/**
 * 销毁模块
 */
declare class WSDestroy{
    destroy():void;
}

/**
 * 事件模块
 */
declare class WSEmitter {
    listenTo(eventName: string, callback: Function): void;
    removeTo(eventName: string, callback: Function): void;
    removeToAll(): void;
    trigger(eventName: string,...data:any): void;
}



declare interface WSPlayerSEIConfig{
    isSei:boolean;
    seiCallback:(obj:Object)=>void
}

declare interface WSPlayerPlayParams{
    url:string;
    userId?:string;
    isLiveCatch?:boolean;
    enableAudioStrategy?:boolean;
    seiConfig:WSPlayerSEIConfig
}
/**
 * 播放合流模块
 */
declare class WSPlayer {
    play(params:WSPlayerPlayParams): void;
    destroy():void;
}



declare interface WSStreamPreviewParams{
    width:number;
    height:number;
    profile:ProfileEnum;
    deviceId:string
}


declare interface AudioConfig{
    bitrate?:number;
    echoCancellation?:boolean;
    deviceId?:string;
}



declare interface VideoConfig{
    profile:ProfileEnum;
    bitrate:number;
    framerate:number;
    deviceId:string;
    isBrControl:boolean;
    brFactor?:number;
    landscape?:boolean;
}

declare interface CamConfig{
    audio?:boolean|AudioConfig;
    video:boolean|VideoConfig
}

declare interface Resolution{
    width:number;
    height:number;
}

declare interface LayoutConfig{
    x:number;
    y:number;
    width:number;
    height:number
}

declare interface Peer{
    name:string;
    layout_index:number;
}

declare interface MixConfig{
    layout?:1|2|11|22|0;
    resolution:Resolution;
    maxBitrate?:number;
    framerate?:number;
    sei:boolean;
    fill?:0|1|2;
    idle?:number;
    layoutIndex?:number;
    layout_content?:LayoutConfig[];
    roomUrl:string;
    peers?:Peer[]
}

declare interface WSStreamPushParams{
    channelId:string;
    userId:string;
    url?:string;
    userRole:0|1;
    isMix:boolean;
    isSei:boolean;
    camConfig:CamConfig,
    mixConfig?:MixConfig
}


declare interface WSStreamMixParams{
    roomId:string;
    userId:string;//主播
}

declare interface MixPeer{
    layout_index:number;
    name:string;// "host/appId_channelId/userId"
}

declare interface WSStreamMixConfig extends MixConfig{
    peers?:MixPeer[]
}

declare interface WSStreamMixJoinParams{
    userId:string;
    roomId:string;
}


declare interface WSStreamMixStateParams{
    roomId:string;
}

declare interface WSStreamMixDestoryParams{
    roomId:string;
}

export class WSStream {
    startPreview(params: WSStreamPreviewParams): void;
    stopPreview():void;
    startPush(params: WSStreamPushParams):void;
    stopPush():void;
    startMix(params: WSStreamMixParams):void;
    stopMix():void;
    mixCreate(params: WSStreamMixConfig):void;
    mixModify(params: WSStreamMixConfig):void;
    mixJoin(params:WSStreamMixJoinParams):void;
    mixQuit(params:WSStreamMixJoinParams):void;
    mixStatus(params:WSStreamMixStateParams):void;
    mixDestory(params:WSStreamMixDestoryParams):void;
    destory():void;
}




declare interface StreamConfig{
    isMix:boolean;
    camConfig:CamConfig;
    mixConfig?:MixConfig;
    isSei?:boolean;
}
declare interface WSChannelCreateConfig{
    streamConfig:StreamConfig
}

declare interface WSChannelJoinConfig{
    isDirectLink:boolean;//是否直连，直连不播放合流
    streamConfig:StreamConfig;
    playConfig?:WSPlayerPlayParams
}

/**
 * 互动频道模块
 */
declare class WSChannel{
    init(params?:any):void;
    startPreview(params:WSStreamPreviewParams):void;
    stopPreview():void;
    createChannel(channelId:string,userId:string,config:WSChannelCreateConfig):void;//主播创建频道
    destroyChannel():void;
    joinChannel(channelId:string,userId:string,config:WSChannelJoinConfig):void;//观众加入互动频道
    quitChannel():void;
    destory():void;
    sendMessage(userId:string,params:any):void;
}


declare class WSUtil{
    version:string;
    getMediaDevices(callback:Function):void;
    setVideoVolume(videoElementId:string,volume:number):void;
    setVideoDisplay(videoElements:null|string|string[],display:"fill"|"contain"):void;
}

declare class WSEvent{
    Event:any;
    SkinEvent:any;
    LINK_EVENT:any;
    PlayEvent:any;
    LinkEvent:any;
    SignalEvent:any;
    MixEvent:any;
}




declare class WSWebRTC{
    public static WSInit:WSInit;
    public static WSDestroy:WSDestroy;
    public static WSEmitter:WSEmitter;
    public static WSPlayer:WSPlayer;
    public static WSStream:WSStream;
    public static WSChannel:WSChannel;
    public static WSUtil:WSUtil;
    public static WSEvent:WSEvent;
}


export {WSWebRTC}