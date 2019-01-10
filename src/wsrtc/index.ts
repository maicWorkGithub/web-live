/**
 * @Author: yanxinaliang (rainyxlxl@163.com)
 * @Date: 2018/12/7 12:14
 * @Last Modified by: yanxinaliang (rainyxlxl@163.com)
 * @Last Modified time: 2018/12/7 12:14
 * @disc:网宿连麦 sdk
 */
import {IExtraPlayer, WSWebRTC} from './wswebrtc';
import {ILiveInterface} from '../interface';
import {EventBus} from '../EventBus';

export declare interface IWsRtcConfig{
    host:string;
    appId:string;
    appKey:string;
    mixPath:string;
    pullMixPath:string;
    userId:string;
    channelId:string;
    userRole:0|1;
    width?:number;
    height?:number;
}

export enum ProfileEnum {
    "180P_1"="180P_1",
    "180P_2"="180P_2",
    "360P_1"="360P_1",
    "360P_2"="360P_2",
    "480P_1"="480P_1",
    "480P_2"="480P_2",
    "540P_1"="540P_1",
    "540P_2"="540P_2",
    "720P_1"="720P_1",
    "720P_2"="720P_2",
    "1080P_1"="1080P_1",
    "1080P_2"="1080P_2"
}

export declare interface IChannelConfig {
    profile:ProfileEnum;
    cameraId?:string;
    audioId?:string;
    bitrate?:number;
    framerate?:number;
    brFactor?:number;
    echoCancellation?:boolean;
    sei?:boolean;
    isBrControl?:boolean;
    mix?:boolean;
    idle?:number;
    layoutContent?:IMixLayout[];
    resolution?:{width:number;height:number};
}

declare interface IMixPeer{
    layout_index:number;
    userId:string;
}
declare interface IMixLayout{
    x:number;
    y:number;
    width:number;
    height:number;
}

export declare interface IModifyMixConfig {
    layout:0|1|2|11|22;
    resolution:{width:number;height:number};
    maxBitrate?:number;
    framerate?:number;
    sei:0|1;
    fill:0|1|2;
    idle?:number;// 合流销毁
    layoutIndex:number;
    layoutContent:IMixLayout[]
}

export declare interface IMixConfig extends IModifyMixConfig{
    peers:IMixPeer[];
}

const SkinEvent=WSWebRTC.WSEvent.SkinEvent;
const Event=WSWebRTC.WSEvent.Event;
const LinkEvent = WSWebRTC.WSEvent.LinkEvent;
const MixEvent = WSWebRTC.WSEvent.MixEvent;
const PlayEvent=WSWebRTC.WSEvent.PlayEvent;


export enum EventEnum {
    PullSuccess="pull:success",
    PushSuccess="push:success",
    StopPullSuccess="pull:stop",
    StopPushSuccess="push:stop",
    PlaySuccess="play:success",
    PlayEnd="play:end",
    PlayError="play:error",
    PlayMetadata="play:metadata",
    PlayInterrupt="play:interrupt",
    PlayResolutionChange="play:resolution",
}

const PlayerMap:Map<number,Player>=new Map();


export class Player {
    private player:IExtraPlayer;
    public id:number=Date.now();
    constructor(listener?:(eventType:EventEnum,data?:any)=>void){
        this.player=WSWebRTC.WSPlayer.play2();
        if(listener){
            this.player.listenTo(Event.PLAYER_EVENT,(obj:any)=>{
                if(!obj) return;
                const {type,data}=obj;
                switch (type){
                    case PlayEvent.ERROR://异常
                        listener(EventEnum.PlayError);
                        break;
                    case PlayEvent.METADATA://视屏元数据信息
                        listener(EventEnum.PlayMetadata,{
                            width:data.width,
                            height:data.height
                        });
                        break;
                    case PlayEvent.SOCKET_OPEN://接收数据
                        break;
                    case PlayEvent.SOCKET_CLOSE://异常中断
                        listener(EventEnum.PlayInterrupt);
                        break;
                    case PlayEvent.DURATION_WARNING://警告
                        break;
                    case PlayEvent.RESOLUTION_CHANGE://分辨率改变
                        if(!data.isHeader) {
                            const resolution=data.aspect2.split("x");
                            listener(EventEnum.PlayResolutionChange,{
                                width:resolution[0],
                                height:resolution[1]
                            });
                        } else {
                            listener(EventEnum.PlayResolutionChange,{
                                width:data.aspect1,
                                height:data.aspect2
                            });
                        }
                        break;
                }
            });
            WSWebRTC.WSEmitter.listenTo(Event.SKIN_EVENT, (obj:any) => {
                if(!obj) return;
                const {type,message}=obj;
                if(type === SkinEvent.APPEND) {
                    const wrap:any=obj.data;
                    if(message==="Play"){
                        listener(EventEnum.PlaySuccess,wrap);
                    }
                } else if(type === SkinEvent.REMOVE) {
                    const id=obj.data;
                    if(message==="Play"){
                        listener(EventEnum.PlayEnd,id);
                    }
                }
            });
        }
        PlayerMap.set(this.id,this);
    }
    public play(url:string,seiCallback?:(timestamp:number)=>void,urlCallback?:(callback:Function)=>void){
        this.player.play({
            isLiveCatch: true,
            url: url,
            seiConfig: {
                isSei: !!seiCallback,
                seiCallback: seiCallback
            },
            enableAudioStrategy: true,
            secretConfig:{
                isSecret:!!urlCallback,
                urlCallback:urlCallback
            }
        })
    }
    public destroy(){
        this.player.removeToAll();
        this.player.stop();
        this.player=undefined as any;
        PlayerMap.delete(this.id);
    }
}



class WsRtc extends EventBus implements ILiveInterface{
    private host:string;
    private appId:string;
    private appKey:string;
    private mixPath:string;
    // private pullMixPath:string;
    private userId:string;
    private channelId:string;
    private  userRole:0|1;
    private width:number;
    private height:number;
    private createChannelEventListener:(obj:any)=>void;
    private destroyChannelEventListener:(obj:any)=>void;
    private joinChannelEventListener:(obj:any)=>void;
    private createMixEventListener:(obj:any)=>void;
    private updateMixEventListener:(obj:any)=>void;
    private defaultLayoutContent=[{
        x:0,
        y:0,
        width:1,
        height:1
    }];
    constructor(){
        super();
    }
    private skinEventListener(obj:any){
        if(!obj) return;
        const {type,message}=obj;
        if(type === SkinEvent.APPEND) {
            const wrap:any=obj.data;
            if(message==="Pull"){
                this.trigger(EventEnum.PullSuccess,wrap);
            }
            if(message==="Push"){
                this.trigger(EventEnum.PushSuccess,wrap);
            }
            if(message==="Play"){
                this.trigger(EventEnum.PlaySuccess,wrap);
            }
        } else if(type === SkinEvent.REMOVE) {
            const id=obj.data;
            if(message==="Pull"){
                this.trigger(EventEnum.StopPullSuccess,id);
            }
            if(message==="Push"){
                this.trigger(EventEnum.StopPushSuccess,id);
            }
            if(message==="Play"){
                this.trigger(EventEnum.PlayEnd,id);
            }
        }
    }
    public init(config:IWsRtcConfig): void {
        this.host=config.host;
        this.appId=config.appId;
        this.appKey=config.appKey;
        this.mixPath=config.mixPath;
        // this.pullMixPath=config.pullMixPath;
        this.userId=config.userId;
        this.channelId=config.channelId + "";
        this.userRole=config.userRole;
        this.width=config.width||1920;
        this.height=config.height||1080;
    }
    public auth():Promise<boolean> {
        return new Promise((resolve,reject)=>{
            WSWebRTC.WSInit.init({
                host:this.host,
                appId:this.appId,
                appKey:this.appKey,
                userId:this.userId,
                userRole:this.userRole,
                sdkType:"MIC_LINK",
                isRtcArea:false,// 海外是否开启
                reportConfig:{enable:true,period:60},
            }, (rsp) => {
                if(rsp.code === 0) {
                    WSWebRTC.WSChannel.init({});
                    WSWebRTC.WSEmitter.listenTo(Event.SKIN_EVENT,this.skinEventListener.bind(this));
                    resolve(true);
                }else{
                    reject(false);
                }
            });
        });
    }
    public createChannel(channelConfig:IChannelConfig):Promise<any>{
        const {bitrate=400,framerate=25,brFactor=0.6,echoCancellation=true,sei=true,cameraId,audioId,profile,isBrControl=true,mix=true,idle=1800,layoutContent=this.defaultLayoutContent,resolution={width:this.width,height:this.height}} = channelConfig;
        return new Promise((resole,reject)=>{
            if(this.createChannelEventListener){
                WSWebRTC.WSEmitter.removeTo(Event.CHANNEL_EVENT,this.createChannelEventListener);
            }
            this.createChannelEventListener=(obj:any)=>{
                if(!obj) return;
                const {type,code}=obj;
                switch(type) {
                    case LinkEvent.CREATE:
                        WSWebRTC.WSEmitter.removeTo(Event.CHANNEL_EVENT,this.createChannelEventListener);
                        this.createChannelEventListener=undefined as any;
                        if(code !==0) {
                            reject(false);
                        }else{
                            resole(true);
                        }
                        break;
                    default: break;
                }
            };
            WSWebRTC.WSEmitter.listenTo(Event.CHANNEL_EVENT,this.createChannelEventListener);
            WSWebRTC.WSChannel.createChannel(
                this.channelId,
                this.userId,
                {
                    streamConfig: {
                        isMix: mix,
                        isMixCheck:true,
                        isSei: sei,
                        isMirror:false,
                        isTrackDetect:true,
                        videoType:"H264",
                        camConfig: {
                            video:cameraId?{
                                profile:profile,
                                bitrate:bitrate,
                                framerate:framerate,
                                deviceId:cameraId,
                                isBrControl:isBrControl,
                                brFactor:brFactor
                            }:false,
                            audio:audioId?{
                                deviceId:audioId,
                                bitrate:bitrate,
                                echoCancellation
                            }:false
                        },
                        mixConfig: mix?{
                            idle,
                            sei: sei,
                            layoutIndex: 0,
                            layout: 0,
                            resolution,
                            fill: 0,
                            roomUrl: this.mixPath,
                            framerate: framerate,
                            layout_content:layoutContent
                        }:undefined,
                        networkConfig:{isDetect:true,enforceTCP:false},
                    },
                }
            );
        });
    }
    public destroyChannel():Promise<boolean>{
        return new Promise((resole,reject)=>{
            if(this.destroyChannelEventListener){
                WSWebRTC.WSEmitter.removeTo(Event.CHANNEL_EVENT,this.destroyChannelEventListener);
            }
            this.destroyChannelEventListener=(obj:any)=>{
                if(!obj) return;
                const {type,code}=obj;
                switch(type) {
                    case LinkEvent.DESTROY:
                        WSWebRTC.WSEmitter.removeTo(Event.CHANNEL_EVENT,this.destroyChannelEventListener);
                        this.destroyChannelEventListener=undefined as any;
                        if(code&&code !==0) {
                            reject(false);
                        }else{
                            resole(true);
                        }
                        break;
                    default: break;
                }
            };
            WSWebRTC.WSEmitter.listenTo(Event.CHANNEL_EVENT,this.destroyChannelEventListener);
            WSWebRTC.WSChannel.destroyChannel();
        });
    }
    public joinChannel(channelConfig:IChannelConfig):Promise<boolean>{
        return new Promise((resole,reject)=>{
            if(this.joinChannelEventListener){
                WSWebRTC.WSEmitter.removeTo(Event.CHANNEL_EVENT,this.joinChannelEventListener);
            }
            this.joinChannelEventListener=(obj:any)=>{
               if(!obj) return;
               const {type,code}=obj;
               switch(type) {
                   case LinkEvent.JOIN:
                       WSWebRTC.WSEmitter.removeTo(Event.CHANNEL_EVENT,this.joinChannelEventListener);
                       this.joinChannelEventListener=undefined as any;
                       if(code&&code !==0) {
                           reject(false);
                       }else{
                           resole(true);
                       }
                       break;
                   default: break;
               }
            };
            WSWebRTC.WSEmitter.listenTo(Event.CHANNEL_EVENT,this.joinChannelEventListener);
            const {cameraId,audioId,profile,bitrate=400,framerate=25,isBrControl=true,brFactor=0.6,echoCancellation=true} = channelConfig;
            WSWebRTC.WSChannel.joinChannel(
                this.channelId,
                this.userId,
                {
                    isDirectLink:true,
                    streamConfig:{
                        isMix:true,
                        isMirror:false,
                        isTrackDetect:true,
                        videoType:"H264",
                        camConfig:{
                            video:cameraId?{
                                profile:profile,
                                bitrate:bitrate,
                                framerate:framerate,
                                deviceId:cameraId,
                                isBrControl:isBrControl,
                                brFactor:brFactor
                            }:false,
                            audio:audioId?{
                                deviceId:audioId,
                                bitrate:bitrate,
                                echoCancellation:echoCancellation
                            }:false,
                        },
                        networkConfig:{isDetect:true,enforceTCP:false},
                    },
                }
            );
        });
    }
    public leaveChannel():Promise<boolean>{
        return new Promise((resole,reject)=>{
            WSWebRTC.WSChannel.quitChannel();
            resole(true);
        });
    }
    public stopMix(): Promise<boolean> {
        return new Promise<boolean>((resole,reject)=>{
            WSWebRTC.WSMixer.stopMix();
            resole(true);
        })
    }
    
    public startMix():Promise<boolean>{
        return new Promise<boolean>((resole,reject)=>{
            WSWebRTC.WSMixer.startMix({
                roomId:this.channelId,
                userId:this.userId
            });
            resole(true);
        })
    }
    
    public createMix(mixConfig:IMixConfig):Promise<boolean>{
        return new Promise((resole,reject)=>{
            const {maxBitrate=3000,sei=1,layoutIndex=0,layout,resolution,fill,framerate=25,peers=[],layoutContent=[],idle=1800} = mixConfig;
            if(this.createMixEventListener){
                WSWebRTC.WSEmitter.removeTo(Event.MIX_EVENT,this.createMixEventListener);
            }
            this.createMixEventListener=(obj:any)=>{
                if(!obj) return;
                const {type,code}=obj;
                switch(type) {
                    case MixEvent.CREATE:
                        WSWebRTC.WSEmitter.removeTo(Event.MIX_EVENT,this.createMixEventListener);
                        this.createMixEventListener=undefined as any;
                        if(code !==0) {
                            reject(false);
                        }else{
                            resole(true);
                        }
                        break;
                    default: break;
                }
            };
            WSWebRTC.WSEmitter.listenTo(Event.CHANNEL_EVENT,this.createMixEventListener);
            WSWebRTC.WSMixer.mixCreate({
                maxBitrate,
                sei,
                layoutIndex,
                layout,
                resolution,
                fill,
                roomUrl: this.mixPath,
                framerate,
                idle,
                audioChannel:2,
                peers:peers.map((peer)=>{
                    return {
                        layout_index:peer.layout_index,
                        name:`${this.host}/${this.appId}_${this.channelId}/${peer.userId}`
                    }
                }),
                layout_content:layoutContent,
            });
        });
    }
    public updateMix(mixConfig:IModifyMixConfig):Promise<boolean>{
        return new Promise((resole,reject)=>{
            const {maxBitrate=3000,sei=1,layoutIndex=0,layout,resolution,fill,framerate=25,layoutContent=[],idle=1800} = mixConfig;
            if(this.updateMixEventListener){
                WSWebRTC.WSEmitter.removeTo(Event.MIX_EVENT,this.updateMixEventListener);
            }
            this.updateMixEventListener=(obj:any)=>{
                if(!obj) return;
                const {type,code}=obj;
                switch(type) {
                    case MixEvent.MODIFY:
                        WSWebRTC.WSEmitter.removeTo(Event.MIX_EVENT,this.updateMixEventListener);
                        this.updateMixEventListener=undefined as any;
                        if(code !==0) {
                            reject(false);
                        }else{
                            resole(true);
                        }
                        break;
                    default: break;
                }
            };
            WSWebRTC.WSEmitter.listenTo(Event.CHANNEL_EVENT,this.updateMixEventListener);
            WSWebRTC.WSMixer.mixModify({
                maxBitrate,
                sei,
                layoutIndex,
                layout,
                resolution,
                fill,
                idle,
                roomUrl: this.mixPath,
                framerate,
                layout_content:layoutContent,
            });
        });
    }
    public shareDesktop():void{
    }
    public stopDesktop():void{
    }
    public play(url:string,seiCallback?:(timestamp:number)=>void,urlCallback?:(callback:Function)=>void,listener?:(eventType:EventEnum,data?:any)=>void){
        const player = new Player(listener);
        player.play(url,seiCallback,urlCallback);
        return player;
    }
    public playMix():void{
    }
    public destroy():void{
        WSWebRTC.WSDestroy.destroy();
        PlayerMap.forEach((player)=>{
            player.destroy();
        })
    }
}

export {WsRtc};