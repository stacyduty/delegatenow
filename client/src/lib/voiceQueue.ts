import { saveToStore, getFromStore, deleteFromStore } from './offlineStorage';

export interface QueuedVoiceRecording {
  id: string;
  transcript: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const VOICE_QUEUE_STORE = 'voiceQueue';

export async function queueVoiceRecording(transcript: string): Promise<string> {
  const recording: QueuedVoiceRecording = {
    id: crypto.randomUUID(),
    transcript,
    timestamp: Date.now(),
    status: 'pending',
  };

  const existingQueue = (await getFromStore(VOICE_QUEUE_STORE)) as QueuedVoiceRecording[] || [];
  const updatedQueue = [...existingQueue, recording];

  await saveToStore(VOICE_QUEUE_STORE, updatedQueue);

  return recording.id;
}

export async function getVoiceQueue(): Promise<QueuedVoiceRecording[]> {
  return (await getFromStore(VOICE_QUEUE_STORE)) as QueuedVoiceRecording[] || [];
}

export async function updateVoiceRecordingStatus(
  id: string,
  status: QueuedVoiceRecording['status']
): Promise<void> {
  const queue = await getVoiceQueue();
  const updatedQueue = queue.map((recording) =>
    recording.id === id ? { ...recording, status } : recording
  );

  await saveToStore(VOICE_QUEUE_STORE, updatedQueue);
}

export async function removeVoiceRecording(id: string): Promise<void> {
  const queue = await getVoiceQueue();
  const updatedQueue = queue.filter((recording) => recording.id !== id);

  await saveToStore(VOICE_QUEUE_STORE, updatedQueue);
}

export async function processVoiceQueue(
  processFunction: (transcript: string) => Promise<void>
): Promise<void> {
  const queue = await getVoiceQueue();
  const pendingRecordings = queue.filter((r) => r.status === 'pending');

  for (const recording of pendingRecordings) {
    try {
      await updateVoiceRecordingStatus(recording.id, 'processing');
      await processFunction(recording.transcript);
      await removeVoiceRecording(recording.id);
    } catch (error) {
      console.error(`Failed to process voice recording ${recording.id}:`, error);
      await updateVoiceRecordingStatus(recording.id, 'failed');
    }
  }
}
