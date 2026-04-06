import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { UUIDTransformer } from '../../common/transformers/uuid.transformer';
import { College } from '../enums/college.enum';
import { Department } from '../enums/department.enum';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({
    name: 'user_id',
    type: 'binary',
    length: 16,
    transformer: new UUIDTransformer(),
  })
  userId!: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'Anonymous',
    nullable: false,
  })
  nickname!: string;

  @Column({
    type: 'enum',
    enum: College,
    nullable: false,
  })
  college!: string;

  @Column({
    type: 'enum',
    enum: Department,
    nullable: false,
  })
  department!: string;
}
