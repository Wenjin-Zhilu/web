import type { ZegoExpressEngine } from "zego-express-engine-webrtc";

type RoomUpdateType = "ADD" | "DELETE";
type RoomUserInfo = { userID: string; userName?: string };
type StreamInfo = { streamID: string; user?: RoomUserInfo };
type ZegoEngineConstructor = new (appID: number, server: string | string[]) => ZegoExpressEngine;

let engine: ZegoExpressEngine | null = null;
let localStream: MediaStream | null = null;
let publishStreamID: string | null = null;
let currentRoomID: string | null = null;
let peerUserID: string | null = null;
const playingStreams = new Set<string>();
let remoteStream: MediaStream | null = null;

async function getZegoEngine(): Promise<ZegoEngineConstructor> {
  const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");
  return ZegoExpressEngine;
}

export async function createEngine(appID: number): Promise<ZegoExpressEngine> {
  if (engine) return engine;
  const ZegoExpressEngine = await getZegoEngine();
  engine = new ZegoExpressEngine(appID, "wss://webliveroom-api.zego.im/ws");
  return engine;
}

export async function joinRoom(
  token: string,
  roomID: string,
  userID: string,
  userName: string,
  expectedPeerUserID: string
): Promise<void> {
  if (!engine) throw new Error("Engine not created");

  playingStreams.clear();
  currentRoomID = roomID;
  peerUserID = expectedPeerUserID;
  publishStreamID = `${roomID}_${userID}`;
  await engine.loginRoom(roomID, token, { userID, userName }, { userUpdate: true });

  localStream = await engine.createStream({ camera: { video: false, audio: true } });
  await engine.startPublishingStream(publishStreamID, localStream);
}

export async function leaveRoom(roomID?: string): Promise<void> {
  if (!engine) return;

  for (const streamID of playingStreams) {
    try {
      engine.stopPlayingStream(streamID);
    } catch {
      // Stream may already have been removed by the SDK.
    }
  }
  playingStreams.clear();

  if (localStream) {
    engine.destroyStream(localStream);
    localStream = null;
  }
  if (publishStreamID) {
    engine.stopPublishingStream(publishStreamID);
    publishStreamID = null;
  }
  currentRoomID = null;
  peerUserID = null;
  if (roomID) {
    await engine.logoutRoom(roomID);
  }
}

export function toggleMute(): boolean {
  if (!localStream) return false;
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return false;
  audioTrack.enabled = !audioTrack.enabled;
  return !audioTrack.enabled;
}

export function onRoomUserUpdate(
  callback: (type: RoomUpdateType, userList: RoomUserInfo[]) => void
): void {
  if (!engine) return;
  engine.on("roomUserUpdate", (...args: [string, RoomUpdateType, RoomUserInfo[]]) => {
    const [, updateType, userList] = args;
    const remoteUsers = userList.filter((user) => user.userID === peerUserID);
    if (remoteUsers.length > 0) {
      callback(updateType, remoteUsers);
    }
  });
}

function isPeerStream(stream: StreamInfo): boolean {
  if (!stream.streamID || stream.streamID === publishStreamID) return false;
  if (stream.user?.userID) return stream.user.userID === peerUserID;
  return !!currentRoomID && !!peerUserID && stream.streamID === `${currentRoomID}_${peerUserID}`;
}

export function onRoomStreamUpdate(
  callback: (type: RoomUpdateType, streamList: StreamInfo[]) => void
): void {
  if (!engine) return;
  engine.on("roomStreamUpdate", async (...args: [string, RoomUpdateType, StreamInfo[], string?]) => {
    const [, updateType, streamList] = args;
    const remoteStreams = streamList.filter(isPeerStream);
    if (updateType === "ADD") {
      for (const stream of remoteStreams) {
        const streamID = stream.streamID;
        if (playingStreams.has(streamID)) continue;
        playingStreams.add(streamID);
        try {
          const rs = await engine!.startPlayingStream(streamID);
          remoteStream = rs;
          const audio = new Audio();
          audio.srcObject = rs;
          audio.autoplay = true;
        } catch {
          playingStreams.delete(streamID);
        }
      }
      if (remoteStreams.length > 0) {
        callback(updateType, remoteStreams);
      }
    }
    if (updateType === "DELETE") {
      for (const stream of remoteStreams) {
        const streamID = stream.streamID;
        if (!playingStreams.has(streamID)) continue;
        try {
          engine!.stopPlayingStream(streamID);
        } catch {
          // Stream may already have been removed by the SDK.
        }
        playingStreams.delete(streamID);
      }
    }
    if (updateType === "DELETE" && remoteStreams.length > 0) {
      callback(updateType, remoteStreams);
    }
  });
}

export function getLocalStream(): MediaStream | null {
  return localStream;
}

export function getRemoteStream(): MediaStream | null {
  return remoteStream;
}

export function destroy(): void {
  if (engine) {
    engine.off("roomUserUpdate");
    engine.off("roomStreamUpdate");
    engine = null;
  }
  localStream = null;
  remoteStream = null;
  publishStreamID = null;
  currentRoomID = null;
  peerUserID = null;
  playingStreams.clear();
}
