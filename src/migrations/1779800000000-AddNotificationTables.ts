import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationTables1779800000000 implements MigrationInterface {
  name = 'AddNotificationTables1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`expo_tokens\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` binary(16) NOT NULL,
        \`expo_push_token\` varchar(512) NOT NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_expo_push_token\` (\`expo_push_token\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`expo_tokens\`
        ADD CONSTRAINT \`FK_expo_tokens_user_id\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE \`keyword_subscriptions\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` binary(16) NOT NULL,
        \`keyword\` varchar(64) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_keyword_subscriptions_user_keyword\` (\`user_id\`, \`keyword\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`keyword_subscriptions\`
        ADD CONSTRAINT \`FK_keyword_subscriptions_user_id\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE \`source_subscriptions\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` binary(16) NOT NULL,
        \`source\` varchar(64) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_source_subscriptions_user_source\` (\`user_id\`, \`source\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`source_subscriptions\`
        ADD CONSTRAINT \`FK_source_subscriptions_user_id\`
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`source_subscriptions\` DROP FOREIGN KEY \`FK_source_subscriptions_user_id\``,
    );
    await queryRunner.query(`DROP TABLE \`source_subscriptions\``);

    await queryRunner.query(
      `ALTER TABLE \`keyword_subscriptions\` DROP FOREIGN KEY \`FK_keyword_subscriptions_user_id\``,
    );
    await queryRunner.query(`DROP TABLE \`keyword_subscriptions\``);

    await queryRunner.query(
      `ALTER TABLE \`expo_tokens\` DROP FOREIGN KEY \`FK_expo_tokens_user_id\``,
    );
    await queryRunner.query(`DROP TABLE \`expo_tokens\``);
  }
}
