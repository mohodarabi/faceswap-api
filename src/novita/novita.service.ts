import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export type MergeFaceRequest = {
  face_image_file: string;
  image_file: string;
  extra?: { response_image_type?: string };
};

export type MergeFaceResponse = {
  image_file: string;
  image_type: string;
};

export type VideoMergeFaceRequest = {
  request: {
    video_assets_id: string;
    face_image_base64: string;
    enable_restore: boolean;
  };
  extra?: { response_video_type?: string };
};

export type AsyncTaskResponse = {
  task_id: string;
};

export type MotionControlRequest = {
  image: string;
  video: string;
  prompt?: string;
  negative_prompt?: string;
  character_orientation?: string;
  keep_original_sound?: boolean;
};

export type TaskResultResponse = {
  task: {
    task_id: string;
    status: string;
  };
  videos?: Array<{ video_url: string }>;
};

@Injectable()
export class NovitaService {
  private readonly http: AxiosInstance;

  constructor(config: ConfigService) {
    this.http = axios.create({
      baseURL: 'https://api.novita.ai',
      timeout: 60_000,
      headers: {
        Authorization: `Bearer ${config.get<string>('app.novitaApiKey')}`,
      },
    });
  }

  async mergeFace(req: MergeFaceRequest): Promise<MergeFaceResponse> {
    const { data } = await this.http.post<MergeFaceResponse>('/v3/merge-face', req, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  }

  async putRaw(assetsUrl: string, contentType: string, body: Buffer): Promise<unknown> {
    const { data } = await axios.put(assetsUrl, body, {
      timeout: 60_000,
      headers: {
        'Content-Type': contentType,
        Authorization: this.http.defaults.headers.common.Authorization,
      },
    });
    return data;
  }

  async videoMergeFace(req: VideoMergeFaceRequest): Promise<AsyncTaskResponse> {
    const { data } = await this.http.post<AsyncTaskResponse>('/v3/async/video-merge-face', req, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  }

  async motionControl(req: MotionControlRequest): Promise<AsyncTaskResponse> {
    if (!req.character_orientation) {
      req.character_orientation = 'video';
    }
    const { data } = await this.http.post<AsyncTaskResponse>('/v3/async/kling-v2.6-pro-motion-control', req, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  }

  async getTaskResult(taskId: string): Promise<TaskResultResponse> {
    const { data } = await this.http.get<TaskResultResponse>('/v3/async/task-result', {
      params: { task_id: taskId },
    });
    if (data.task?.status === 'TASK_STATUS_QUEUED' || data.task?.status === 'TASK_STATUS_PROCESSING') {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return data;
    }
    return data;
  }
}
