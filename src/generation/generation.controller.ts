import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  InternalServerErrorException,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiHeader, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AxiosError } from 'axios';
import { BadGatewayException } from '../common/http-errors';
import { DeviceRateLimitGuard } from '../common/rate-limit.guard';
import { MediaService, MemoryFile } from '../media/media.service';
import { NovitaService } from '../novita/novita.service';
import { TasksService } from '../tasks/tasks.service';
import {
  ErrorResponseDto,
  MergeFaceMultipartDto,
  MergeFaceResponseDto,
  MotionControlMultipartDto,
  NovitaTaskResultDto,
  VideoMergeFaceMultipartDto,
} from './generation.dto';
import { GenerationService } from './generation.service';

const { memoryStorage } = require('multer') as { memoryStorage: () => unknown };

const multipartOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 50 << 20,
    files: 3,
  },
};

type GenerationFiles = {
  face_image?: MemoryFile[];
  image?: MemoryFile[];
  reference_image?: MemoryFile[];
  reference_video?: MemoryFile[];
};

@Controller('api/v1')
@ApiTags('Generation')
@ApiHeader({ name: 'X-Device-ID', required: true })
@ApiResponse({ status: 402, description: 'Insufficient credits', type: ErrorResponseDto })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiResponse({ status: 502, description: 'Upstream error', type: ErrorResponseDto })
export class GenerationController {
  constructor(
    private readonly generation: GenerationService,
    private readonly media: MediaService,
    private readonly novita: NovitaService,
    private readonly tasks: TasksService,
  ) {}

  @Post('merge-face')
  @UseGuards(DeviceRateLimitGuard)
  @ApiOperation({ summary: 'Merge two face images and return a stored result image URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: MergeFaceMultipartDto })
  @ApiOkResponse({ type: MergeFaceResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'face_image', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ],
      multipartOptions,
    ),
  )
  async mergeFace(
    @Headers('x-device-id') deviceId: string | undefined,
    @UploadedFiles() files: GenerationFiles,
    @Body() body: MergeFaceMultipartDto,
    @Req() req: Request,
  ) {
    const user = await this.generation.resolveUser(deviceId);
    const faceImage = this.requiredFile(files.face_image, 'face_image');
    const image = this.requiredFile(files.image, 'image');
    const cost = await this.generation.deductCredits(user.id);
    const taskId = this.generation.newSyncTaskId();
    try {
      await this.tasks.insert(user.id, taskId, 'merge_face');
    } catch {
      await this.generation.refundIfNeeded(user.id, cost);
      throw new InternalServerErrorException({ error: 'failed to record task' });
    }
    try {
      await this.media.storeImage(faceImage, 'inputs');
      await this.media.storeImage(image, 'inputs');
      const resp = await this.novita.mergeFace({
        face_image_file: faceImage.buffer.toString('base64'),
        image_file: image.buffer.toString('base64'),
        extra: { response_image_type: body.image_type || 'png' },
      });
      const stored = await this.media.storeBase64Image(resp.image_file, resp.image_type);
      return { image_url: this.media.publicUrl(req, stored.relativePath), image_type: resp.image_type };
    } catch (error) {
      await this.generation.refundIfNeeded(user.id, cost);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw this.toBadGateway(error);
    }
  }

  @Post('video-merge-face')
  @UseGuards(DeviceRateLimitGuard)
  @ApiOperation({ summary: 'Replace the face in a Novita video asset with an uploaded face image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VideoMergeFaceMultipartDto })
  @ApiOkResponse({ type: NovitaTaskResultDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'face_image', maxCount: 1 }], multipartOptions),
  )
  async videoMergeFace(
    @Headers('x-device-id') deviceId: string | undefined,
    @UploadedFiles() files: GenerationFiles,
    @Body() body: VideoMergeFaceMultipartDto,
  ) {
    const user = await this.generation.resolveUser(deviceId);
    const faceImage = this.requiredFile(files.face_image, 'face_image');
    if (!body.video_asset_id) {
      throw new BadRequestException({ error: 'video_asset_id is required' });
    }
    const cost = await this.generation.deductCredits(user.id);
    let taskId: string;
    try {
      await this.media.storeImage(faceImage, 'inputs');
      const resp = await this.novita.videoMergeFace({
        request: {
          video_assets_id: body.video_asset_id,
          face_image_base64: faceImage.buffer.toString('base64'),
          enable_restore: true,
        },
        extra: { response_video_type: 'mp4' },
      });
      taskId = resp.task_id;
    } catch (error) {
      await this.generation.refundIfNeeded(user.id, cost);
      if (error instanceof BadRequestException) {
        throw error;
      }
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
  @ApiOperation({ summary: 'Apply motion from an uploaded reference video to an uploaded reference image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: MotionControlMultipartDto })
  @ApiOkResponse({ type: NovitaTaskResultDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'reference_image', maxCount: 1 },
        { name: 'reference_video', maxCount: 1 },
      ],
      multipartOptions,
    ),
  )
  async motionControl(
    @Headers('x-device-id') deviceId: string | undefined,
    @UploadedFiles() files: GenerationFiles,
    @Body() body: MotionControlMultipartDto,
  ) {
    const user = await this.generation.resolveUser(deviceId);
    const referenceImage = this.requiredFile(files.reference_image, 'reference_image');
    const referenceVideo = this.requiredFile(files.reference_video, 'reference_video');
    if ((body.positive_prompt || '').length > 2500) {
      throw new BadRequestException({ error: 'positive_prompt exceeds 2500 character limit' });
    }
    if ((body.negative_prompt || '').length > 2500) {
      throw new BadRequestException({ error: 'negative_prompt exceeds 2500 character limit' });
    }

    const cost = await this.generation.deductCredits(user.id);
    let taskId: string;
    try {
      await this.media.storeImage(referenceImage, 'inputs');
      await this.media.storeVideo(referenceVideo, 'inputs');
      const resp = await this.novita.motionControl({
        image: referenceImage.buffer.toString('base64'),
        video: referenceVideo.buffer.toString('base64'),
        prompt: body.positive_prompt,
        negative_prompt: body.negative_prompt,
        character_orientation: body.character_orientation || 'video',
        keep_original_sound: this.toBoolean(body.keep_original_sound),
      });
      taskId = resp.task_id;
    } catch (error) {
      await this.generation.refundIfNeeded(user.id, cost);
      if (error instanceof BadRequestException) {
        throw error;
      }
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

  private requiredFile(files: MemoryFile[] | undefined, fieldName: string): MemoryFile {
    const file = files?.[0];
    if (!file) {
      throw new BadRequestException({ error: `${fieldName} is required` });
    }
    return file;
  }

  private toBoolean(value: boolean | string | undefined): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === undefined || value === '') {
      return undefined;
    }
    return value === 'true' || value === '1';
  }
}
