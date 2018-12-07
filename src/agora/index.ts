/**
 * @Author: yanxinaliang (rainyxlxl@163.com)
 * @Date: 2018/12/7 12:14
 * @Last Modified by: yanxinaliang (rainyxlxl@163.com)
 * @Last Modified time: 2018/12/7 12:14
 * @disc:网宿连麦 sdk
 */
import {ILiveInterface} from '../interface';

class Agora implements ILiveInterface{
    constructor(){
    
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
}

export {WsRtc};