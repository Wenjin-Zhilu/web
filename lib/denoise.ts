import { Rnnoise } from "@shiguredo/rnnoise-wasm";

let rnnoise: Awaited<ReturnType<typeof Rnnoise.load>> | null = null;

const RNNOISE_SAMPLE_RATE = 48000;
const SCALE_IN = 32768;
const SCALE_OUT = 1 / 32768;

export async function createDenoisedStream(
  rawStream: MediaStream
): Promise<{ stream: MediaStream; cleanup: () => void }> {
  if (!rnnoise) {
    rnnoise = await Rnnoise.load();
  }

  const denoiseState = rnnoise.createDenoiseState();
  const frameSize = rnnoise.frameSize; // 480 samples (10ms @ 48kHz)

  const audioCtx = new AudioContext({ sampleRate: RNNOISE_SAMPLE_RATE });
  const source = audioCtx.createMediaStreamSource(rawStream);
  const processor = audioCtx.createScriptProcessor(4096, 1, 1);

  // 双环形缓冲：解决 4096 与 480 不整除的问题
  const inRing = new Float32Array(frameSize * 20);
  let inWrite = 0;
  let inRead = 0;

  const outRing = new Float32Array(frameSize * 20);
  let outWrite = 0;
  let outRead = 0;

  const frame = new Float32Array(frameSize);

  function ringAvailable(write: number, read: number, len: number): number {
    return (write - read + len) % len;
  }

  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);

    // 写入输入环形缓冲
    for (let i = 0; i < input.length; i++) {
      inRing[inWrite] = input[i];
      inWrite = (inWrite + 1) % inRing.length;
    }

    // 处理所有可用的完整帧
    while (ringAvailable(inWrite, inRead, inRing.length) >= frameSize) {
      for (let i = 0; i < frameSize; i++) {
        frame[i] = inRing[(inRead + i) % inRing.length] * SCALE_IN;
      }
      inRead = (inRead + frameSize) % inRing.length;

      denoiseState.processFrame(frame);

      for (let i = 0; i < frameSize; i++) {
        outRing[(outWrite + i) % outRing.length] = frame[i] * SCALE_OUT;
      }
      outWrite = (outWrite + frameSize) % outRing.length;
    }

    // 从输出缓冲读取
    const available = ringAvailable(outWrite, outRead, outRing.length);
    const toRead = Math.min(available, output.length);
    for (let i = 0; i < toRead; i++) {
      output[i] = outRing[(outRead + i) % outRing.length];
    }
    outRead = (outRead + toRead) % outRing.length;
    for (let i = toRead; i < output.length; i++) {
      output[i] = 0;
    }
  };

  source.connect(processor);
  const destination = audioCtx.createMediaStreamDestination();
  processor.connect(destination);

  const cleanup = () => {
    processor.disconnect();
    source.disconnect();
    denoiseState.destroy();
    audioCtx.close();
  };

  return { stream: destination.stream, cleanup };
}
