/// <reference path="types/lodash/lodash.d.ts" />
/// <reference path="types/jquery/jquery.d.ts" />
declare var Applet: any;
declare class Megauni {
    [key: string]: any;
    static comma_split(str: String): Array<String>;
    static funcs(...names: Array<String>): Array<() => any>;
    static on_respond_ok(): void;
    static ui_ajax(o: any): void;
}
