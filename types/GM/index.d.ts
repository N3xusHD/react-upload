/*
Based on https://github.com/vannhi/userscript-typescript-webpack/blob/master/tampermonkey-module.d.ts
*/

declare namespace GMType {
  type RegisterMenuCommandListener = () => void;
  type MenuCommandId = number;
  type StorageValue = string | number | boolean;
  interface NotificationDetails {
    text?: string;
    title?: string;
    image?: string;
    highlight?: boolean;
    silent?: boolean;
    timeout?: number;
    ondone?: NotificationOnDone;
    onclick?: NotificationOnClick;
  }
  interface NotificationThis extends NotificationDetails {
    id: string;
  }
  type NotificationOnClick = (this: NotificationThis) => any;
  type NotificationOnDone = (this: NotificationThis, clicked: boolean) => any;
}

interface GMXHRDetails {
  method?: "GET" | "HEAD" | "POST";
  url: string;
  headers?: {
    [key: string]: string;
  };
  data?: string;
  cookie?: string;
  binary?: boolean;
  nocache?: boolean;
  revalidate?: boolean;
  timeout?: number;
  context?: any;
  responseType?: "arraybuffer" | "blob" | "json" | "stream";
  overrideMimeType?: string;
  anonymous?: boolean;
  fetch?: boolean;
  user?: string;
  password?: string;
  onabort?: (arg0: any) => any;
  onerror?: (arg0: any) => any;
  onloadstart?: (arg0: any) => any;
  onprogress?: (arg0: any) => any;
  onreadystatechange?: (arg0: any) => any;
  ontimeout?: (arg0: any) => any;
  onload?: (r: {
    finalUrl: string;
    readyState: number;
    status: number;
    statusText: number;
    responseHeaders: {
      [key: string]: string;
    };
    response: ArrayBuffer | Blob | any | ReadableStream;
    responseXML: XMLDocument;
    responseText: string;
  }) => any;
}

interface GM {
  getValue(
    key: string,
    defaultValue: GMType.StorageValue
  ): Promise<GMType.StorageValue>;
  setValue(key: string, value: GMType.StorageValue): Promise<void>;

  registerMenuCommand(
    caption: string,
    commandFunc: GMType.RegisterMenuCommandListener,
    accessKey?: string
  ): Promise<GMType.MenuCommandId>;
  unregisterMenuCommand(menuCmdId: GMType.MenuCommandId): Promise<void>;

  addStyle(css: string): Promise<HTMLStyleElement>;

  notification(
    details: GMType.NotificationDetails,
    ondone?: GMType.NotificationOnDone
  ): Promise<void>;
  notification(
    text: string,
    title: string,
    image?: string,
    onclick?: GMType.NotificationOnDone
  ): Promise<void>;

  xmlHttpRequest(details: GMXHRDetails): {
    abort: (arg0: any) => any;
  };
}

declare var GM: GM;
declare var unsafeWindow: Window;
