import { Injectable } from '@nestjs/common';
import { FeedbacksRepository } from './feedbacks.repository';

@Injectable()
export class FeedbacksService {
  constructor(private readonly feedbacksRepository: FeedbacksRepository) {}

  async save(content: string) {
    const feedback = this.feedbacksRepository.create({ content });
    return this.feedbacksRepository.save(feedback);
  }
}
