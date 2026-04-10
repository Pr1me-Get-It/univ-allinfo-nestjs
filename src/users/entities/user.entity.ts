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

  @Column({ type: 'varchar', length: 128, nullable: false })
  providerId!: string;

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  hashedRefreshToken?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  // UserProfile과 1:1 관계 설정
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile?: UserProfile;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }
}
