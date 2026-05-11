import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbacksRepository extends Repository<Feedback> {
  constructor(private readonly dataSource: DataSource) {
    super(Feedback, dataSource.manager);
  }
}
