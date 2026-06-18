import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { OauthProvider } from '../enums/oauth-provider.enum';
import { UUIDTransformer } from '../../common/transformers/uuid.transformer';
import { UserProfile } from './user-profile.entity';
import { Exclude } from 'class-transformer';
import { UserAppleRefreshToken } from './user-apple-rt.entity';
import { ExpoToken } from '@src/notifications/entities/expo-token.entity';
import { SourceSubscription } from '@src/notifications/entities/source-subscription.entity';
import { KeywordSubscription } from '@src/notifications/entities/keyword-subscription.entity';

@Entity('users')
@Unique(['provider', 'providerId'])
export class User {
  @PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: new UUIDTransformer(),
  })
  id: string;

  // 같은 이메일로 다른 provider 가입 허용
  @Column({ type: 'varchar', length: 255, unique: false, nullable: false })
  email: string;

  @Column({ type: 'enum', enum: OauthProvider, nullable: false })
  provider: OauthProvider;

  @Exclude()
  @Column({
    name: 'provider_id',
    type: 'varchar',
    length: 128,
    nullable: false,
  })
  providerId: string;

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
  createdAt: Date;

  // UserProfile과 1:1 관계 설정
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile?: UserProfile;

  @Exclude()
  @OneToOne(
    () => UserAppleRefreshToken,
    (appleRefreshToken) => appleRefreshToken.user,
    { cascade: true, nullable: true },
  )
  appleRefreshToken?: UserAppleRefreshToken | null;

  @OneToMany(() => ExpoToken, (expoToken) => expoToken.user, {
    cascade: true,
    nullable: true,
  })
  expoTokens?: ExpoToken[] | null;

  @OneToMany(
    () => SourceSubscription,
    (sourceSubscription) => sourceSubscription.user,
    { cascade: true, nullable: true },
  )
  sourceSubscriptions?: SourceSubscription[] | null;

  @OneToMany(
    () => KeywordSubscription,
    (keywordSubscription) => keywordSubscription.user,
    { cascade: true, nullable: true },
  )
  keywordSubscriptions?: KeywordSubscription[] | null;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }
}
