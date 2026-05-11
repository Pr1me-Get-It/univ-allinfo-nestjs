import { Injectable } from '@nestjs/common';
import { FeedbacksRepository } from './feedbacks.repository';
import { ConfigService } from '@nestjs/config';
import { Feedback } from './entities/feedback.entity';
import axios from 'axios';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbacksService {
  private readonly feedbackWebHookUrl: string | undefined;

  constructor(
    private readonly feedbacksRepository: FeedbacksRepository,
    private readonly configService: ConfigService,
  ) {
    this.feedbackWebHookUrl = this.configService.get<string>(
      'FEEDBACK_WEB_HOOK_URL',
    );
  }

  async saveAndSendToWebhook(
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<Feedback> {
    const feedback = this.feedbacksRepository.create(createFeedbackDto);
    const savedFeedback = await this.feedbacksRepository.save(feedback);

    await this.sendFeedbackToWebhook(savedFeedback);
    return savedFeedback;
  }

  private async sendFeedbackToWebhook(feedback: Feedback) {
    if (!this.feedbackWebHookUrl) {
      return;
    }
    const slackMessage = {
      attachments: [
        {
          title: '📢 새로운 유저 피드백이 도착했습니다!',
          text: feedback.content,
        },
      ],
    };
    await axios.post(this.feedbackWebHookUrl, slackMessage);
  }
}
