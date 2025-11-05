import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const unlink = promisify(fs.unlink);

export interface VideoProcessingResult {
  audioPath: string;
  cleanup: () => Promise<void>;
}

export async function extractAudioFromVideo(
  videoPath: string
): Promise<VideoProcessingResult> {
  return new Promise((resolve, reject) => {
    const audioPath = `${videoPath}_audio.mp3`;

    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec("libmp3lame")
      .audioQuality(2) // High quality
      .noVideo()
      .on("end", () => {
        console.log(`Audio extracted successfully: ${audioPath}`);
        resolve({
          audioPath,
          cleanup: async () => {
            try {
              await unlink(videoPath);
              await unlink(audioPath);
              console.log(`Cleaned up: ${videoPath}, ${audioPath}`);
            } catch (error) {
              console.error("Error cleaning up files:", error);
            }
          },
        });
      })
      .on("error", (err) => {
        console.error("Error extracting audio:", err);
        reject(new Error(`Failed to extract audio: ${err.message}`));
      })
      .run();
  });
}

export async function getVideoInfo(videoPath: string): Promise<{
  duration: number;
  format: string;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        format: metadata.format.format_name || "unknown",
        size: metadata.format.size || 0,
      });
    });
  });
}
