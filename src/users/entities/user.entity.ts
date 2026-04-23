import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { OauthProvider } from '../enums/oauth-provider.enum';
import { UUIDTransformer } from '../../common/transformers/uuid.transformer';
import { UserProfile } from './user-profile.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
@Unique(['provider', 'providerId'])
export class User {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UUIDTransformer(),
  })
  id!: string;

  // 같은 이메일로 다른 provider 가입 허용
  @Column({ type: 'varchar', length: 255, unique: false, nullable: false })
  email!: string;

  @Column({ type: 'enum', enum: OauthProvider, nullable: false })
  provider!: OauthProvider;

  @Exclude()
  @Column({
    name: 'provider_id',
    type: 'varchar',
    length: 128,
    nullable: false,
  })
  providerId!: string;

  @Exclude()
  @Column({
    name: 'hashed_refresh_token',
    type: 'varchar',
    length: 255,
    select: false,
    nullable: true,
  })
  hashedRefreshToken?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // UserProfile과 1:1 관계 설정
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile?: UserProfile;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }
}
