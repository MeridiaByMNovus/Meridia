export interface MsgServerLoaded
{
    type: "serverLoaded",
}

export interface UserFolder
{
    [key: string]: UserFolder | string | ArrayBuffer;
}

export interface MsgInitServer
{
    type: "initServer",
    userFiles: UserFolder,
    typeshedFallback: ArrayBuffer | false | undefined,
}

export interface MsgServerInitialized
{
    type: "serverInitialized",
}

export type InitializeMsg = MsgServerLoaded | MsgInitServer | MsgServerInitialized;
export type MsgOfType<T extends InitializeMsg["type"]> =
    T extends "serverLoaded" ? MsgServerLoaded
    : T extends "initServer" ? MsgInitServer
    : T extends "serverInitialized" ? MsgServerInitialized
    : never;