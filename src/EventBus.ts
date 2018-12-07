/**
 * @Author: yanxinaliang (rainyxlxl@163.com)
 * @Date: 2018/8/15 15:04
 * @Last Modified by: yanxinaliang (rainyxlxl@163.com)
 * @Last Modified time: 2018/8/15 15:04
 * @disc:EventBus
 */

class EventBus{
    public _el:HTMLDivElement=document.createElement("div");
    public on(type:string,listener:EventListenerOrEventListenerObject){
        this._el.addEventListener(type,listener);
    }
    public trigger(type:string,data?:any){
        let ev:any=document.createEvent("HTMLEvents");
        ev.initEvent(type, true, false);
        ev.data=data;
        this._el.dispatchEvent(ev);
    }
    public off(type:string,listener:EventListenerOrEventListenerObject){
        this._el.removeEventListener(type,listener);
    }
}

export {EventBus};