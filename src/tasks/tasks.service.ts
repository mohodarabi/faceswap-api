import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly repo: Repository<Task>) {}

  async insert(userId: string, taskId: string, endpoint: string): Promise<void> {
    await this.repo.insert({ user_id: userId, task_id: taskId, endpoint });
  }

  getByTaskId(taskId: string): Promise<Task | null> {
    return this.repo.findOne({ where: { task_id: taskId } });
  }

  getByTaskIdAndUserId(taskId: string, userId: string): Promise<Task | null> {
    return this.repo.findOne({ where: { task_id: taskId, user_id: userId } });
  }

  listPending(): Promise<Task[]> {
    return this.repo.find({ where: { status: In(['TASK_STATUS_QUEUED', 'TASK_STATUS_PROCESSING']) } });
  }

  async updateByTaskId(taskId: string, status: string, responsePayload: unknown): Promise<void> {
    await this.repo.update({ task_id: taskId }, { status, response_payload: responsePayload as any });
  }
}
