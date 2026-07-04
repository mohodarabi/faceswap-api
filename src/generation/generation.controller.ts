import { BadRequestException, Body, Controller, Headers, InternalServerErrorException, Post, UseGuards } from '@nestjs/common';
import { AxiosError } from 'axios';
import { BadGatewayException } from '../common/http-errors';
import { DeviceRateLimitGuard } from '../common/rate-limit.guard';
import { NovitaService } from '../novita/novita.service';
import { TasksService } from '../tasks/tasks.service';
import { GenerationService } from './generation.service';

@Controller('api/v1')
export class GenerationController {
  constructor(
    private readonly generation: GenerationService,
    private readonly novita: NovitaService,
    private readonly tasks: TasksService,
  ) {}

  @Post('merge-face')
  @UseGuards(DeviceRateLimitGuard)
  async mergeFace(
    @Headers('x-device-id') deviceId: string | undefined,
    @Body() body: { face_image_base64?: string; image_base64?: string; image_type?: string; template_id?: string },
  ) {
    const user = await this.generation.resolveUser(deviceId);
    if (!body.face_image_base64 || !body.image_base64) {
      throw new BadRequestException({ error: 'face_image_base64 and image_base64 are required' });
    }
    const cost = await this.generation.deductCredits(user.id);
    const taskId = this.generation.newSyncTaskId();
    try {
      await this.tasks.insert(user.id, taskId, 'merge_face');
    } catch {
      await this.generation.refundIfNeeded(user.id, cost);
      throw new InternalServerErrorException({ error: 'failed to record task' });
    }
    try {
      const resp = await this.novita.mergeFace({
        face_image_file: body.face_image_base64,
        image_file: body.image_base64,
        extra: { response_image_type: body.image_type || 'png' },
      });
      return { image_base64: resp.image_file, image_type: resp.image_type };
    } catch (error) {
      await this.generation.refundIfNeeded(user.id, cost);
      throw this.toBadGateway(error);
    }
  }

  @Post('video-merge-face')
  @UseGuards(DeviceRateLimitGuard)
  async videoMergeFace(
    @Headers('x-device-id') deviceId: string | undefined,
    @Body() body: { video_asset_id?: string; face_image_base64?: string; template_id?: string },
  ) {
    const user = await this.generation.resolveUser(deviceId);
    if (!body.video_asset_id || !body.face_image_base64) {
      throw new BadRequestException({ error: 'video_asset_id and face_image_base64 are required' });
    }
    const cost = await this.generation.deductCredits(user.id);
    let taskId: string;
    try {
      const resp = await this.novita.videoMergeFace({
        request: {
          video_assets_id: body.video_asset_id,
          face_image_base64: body.face_image_base64,
          enable_restore: true,
        },
        extra: { response_video_type: 'mp4' },
      });
      taskId = resp.task_id;
    } catch (error) {
      await this.generation.refundIfNeeded(user.id, cost);
      throw this.toBadGateway(error);
    }
    try {
      await this.tasks.insert(user.id, taskId, 'video_merge_face');
    } catch (error) {
      throw new InternalServerErrorException({ error: error instanceof Error ? error.message : String(error) });
    }
    try {
      return await this.novita.getTaskResult(taskId);
    } catch (error) {
      throw this.toBadGateway(error);
    }
  }

  @Post('motion-control')
  @UseGuards(DeviceRateLimitGuard)
  async motionControl(
    @Headers('x-device-id') deviceId: string | undefined,
    @Body()
    body: {
      reference_image_base64?: string;
      reference_video_base64?: string;
      positive_prompt?: string;
      negative_prompt?: string;
      character_orientation?: string;
      keep_original_sound?: boolean;
      template_id?: string;
    },
  ) {
    const user = await this.generation.resolveUser(deviceId);
    if (!body.reference_image_base64 || !body.reference_video_base64) {
      throw new BadRequestException({ error: 'reference_image_base64 and reference_video_base64 are required' });
    }
    if (body.reference_image_base64.length > (10 << 20) * 4 / 3) {
      throw new BadRequestException({ error: 'reference_image_base64 exceeds 10MB limit' });
    }
    if (body.reference_video_base64.length > (50 << 20) * 4 / 3) {
      throw new BadRequestException({ error: 'reference_video_base64 exceeds 50MB limit' });
    }
    if ((body.positive_prompt || '').length > 2500) {
      throw new BadRequestException({ error: 'positive_prompt exceeds 2500 character limit' });
    }
    if ((body.negative_prompt || '').length > 2500) {
      throw new BadRequestException({ error: 'negative_prompt exceeds 2500 character limit' });
    }

    const cost = await this.generation.deductCredits(user.id);
    let taskId: string;
    try {
      const resp = await this.novita.motionControl({
        image: body.reference_image_base64,
        video: body.reference_video_base64,
        prompt: body.positive_prompt,
        negative_prompt: body.negative_prompt,
        character_orientation: body.character_orientation || 'video',
        keep_original_sound: body.keep_original_sound,
      });
      taskId = resp.task_id;
    } catch (error) {
      await this.generation.refundIfNeeded(user.id, cost);
      throw this.toBadGateway(error);
    }
    try {
      await this.tasks.insert(user.id, taskId, 'motion_control');
    } catch {
      throw new InternalServerErrorException({ error: 'failed to record task' });
    }
    try {
      return await this.novita.getTaskResult(taskId);
    } catch (error) {
      throw this.toBadGateway(error);
    }
  }

  private toBadGateway(error: unknown) {
    if (error instanceof AxiosError) {
      const detail = error.response?.data ? ` - ${JSON.stringify(error.response.data)}` : '';
      return new BadGatewayException(`novita api error: ${error.response?.status || error.message}${detail}`);
    }
    return new BadGatewayException(error instanceof Error ? error.message : String(error));
  }
}
