/**
 * @Author: yanxinaliang (rainyxlxl@163.com)
 * @Date: 2018/12/7 12:14
 * @Last Modified by: yanxinaliang (rainyxlxl@163.com)
 * @Last Modified time: 2018/12/7 12:14
 * @disc:网宿连麦 sdk
 */
import {WSWebRTC} from './wswebrtc';
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
    "180P_1",
    "180P_2",
    "360P_1",
    "360P_2",
    "480P_1",
    "480P_2",
    "540P_1",
    "540P_2",
    "720P_1",
    "720P_2",
    "1080P_1",
    "1080P_2"
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
}

const SkinEvent=WSWebRTC.WSEvent.SkinEvent;
const Event=WSWebRTC.WSEvent.Event;
const LinkEvent = WSWebRTC.WSEvent.LinkEvent;
const MixEvent = WSWebRTC.WSEvent.MixEvent;


export enum EventEnum {
    PullSuccess="pull:success",
    PushSuccess="push:success",
    StopPullSuccess="pull:stop",
    StopPushSuccess="push:stop",
}


class WsRtc extends EventBus implements ILiveInterface{
    private host:string;
    private appId:string;
    private appKey:string;
    private mixPath:string;
    private pullMixPath:string;
    private userId:string;
    private channelId:string;
    private  userRole:0|1;
    private width:number;
    private height:number;
    private createChannelEventListener:(obj:any)=>void;
    private destroyChannelEventListener:(obj:any)=>void;
    private joinChannelEventListener:(obj:any)=>void;
    constructor(){
        super();
        WSWebRTC.WSEmitter.listenTo(Event.SKIN_EVENT,this.skinEventListener.bind(this));
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
        } else if(type === SkinEvent.REMOVE) {
            const id=obj.data;
            if(obj.message==="Pull"){
                this.trigger(EventEnum.StopPullSuccess,id);
            }
            if(obj.message==="Push"){
                this.trigger(EventEnum.StopPushSuccess,id);
            }
        }
    }
    public init(config:IWsRtcConfig): void {
        this.host=config.host;
        this.appId=config.appId;
        this.appKey=config.appKey;
        this.mixPath=config.mixPath;
        this.pullMixPath=config.pullMixPath;
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
                logConfig:{
                    "level": 1
                }
            }, (rsp) => {
                if(rsp.code === 0) {
                    WSWebRTC.WSChannel.init({});
                    resolve(true);
                }else{
                    reject(false);
                }
            });
        });
    }
    public createChannel(channelConfig:IChannelConfig):Promise<any>{
        const {bitrate=400,framerate=25,brFactor=0.6,echoCancellation=true,sei=true,cameraId,audioId,profile,isBrControl=true,mix=true} = channelConfig;
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
                        isSei: sei,
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
                            sei: sei,
                            layoutIndex: 0,
                            layout: 0,
                            resolution: {
                                width:this.width,
                                height:this.height
                            },
                            fill: 0,
                            roomUrl: this.mixPath,
                            framerate: framerate,
                            layout_content:[{
                                x:0,
                                y:0,
                                width:1,
                                height:1
                            }]
                        }:undefined
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
            WSWebRTC.WSStream.stopMix();
            resole(true);
        })
    }
    
    public startMix():Promise<boolean>{
        return new Promise<boolean>((resole,reject)=>{
            WSWebRTC.WSStream.startMix({
                roomId:this.channelId,
                userId:this.userId
            });
            resole(true);
        })
    }
    
    public updateMix(){
        return Promise.resolve(true);
    }
    public shareDesktop():void{
    }
    public stopDesktop():void{
    }
    public play():void{
    }
    public playMix():void{
    }
}

export {WsRtc};