let audioCtx: AudioContext | null = null;
let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

export function startRecording(local: MediaStream, remote: MediaStream): void {
  if (recorder) return;

  audioCtx = new AudioContext();

  const localSource = audioCtx.createMediaStreamSource(local);
  const remoteSource = audioCtx.createMediaStreamSource(remote);

  const merger = audioCtx.createChannelMerger(2);
  localSource.connect(merger, 0, 0);
  remoteSource.connect(merger, 0, 1);

  const dest = audioCtx.createMediaStreamDestination();
  merger.connect(dest);

  chunks = [];
  recorder = new MediaRecorder(dest.stream, { mimeType: "audio/webm;codecs=opus" });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(5000);
}

export function stopRecording(): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!recorder || recorder.state === "inactive") {
      cleanup();
      resolve(null);
      return;
    }

    recorder.onstop = () => {
      const blob = chunks.length > 0 ? new Blob(chunks, { type: "audio/webm" }) : null;
      cleanup();
      resolve(blob);
    };
    recorder.stop();
  });
}

export function isRecording(): boolean {
  return recorder?.state === "recording";
}

function cleanup() {
  recorder = null;
  chunks = [];
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}
