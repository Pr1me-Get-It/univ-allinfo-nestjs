import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationTables1781351627031 implements MigrationInterface {
  name = 'AddNotificationTables1781351627031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`expo_tokens\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` binary(16) NOT NULL, \`expo_push_token\` varchar(512) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5cfb283ecc4b94bd7e80613f9c\` (\`expo_push_token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`source_subscriptions\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` binary(16) NOT NULL, \`source\` varchar(64) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_02a0f4a81524b597973106e70f\` (\`user_id\`, \`source\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`keyword_subscriptions\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` binary(16) NOT NULL, \`keyword\` varchar(64) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_7fb7e65c19ca8c111985cb2477\` (\`user_id\`, \`keyword\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`expo_tokens\` ADD CONSTRAINT \`FK_006e33342c029c8b1594e20fb43\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`source_subscriptions\` ADD CONSTRAINT \`FK_e475c3699ad285e544618abec44\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`keyword_subscriptions\` ADD CONSTRAINT \`FK_1a97dcc53e60b67438a1f34f121\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`keyword_subscriptions\` DROP FOREIGN KEY \`FK_1a97dcc53e60b67438a1f34f121\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`source_subscriptions\` DROP FOREIGN KEY \`FK_e475c3699ad285e544618abec44\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`expo_tokens\` DROP FOREIGN KEY \`FK_006e33342c029c8b1594e20fb43\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_7fb7e65c19ca8c111985cb2477\` ON \`keyword_subscriptions\``,
    );
    await queryRunner.query(`DROP TABLE \`keyword_subscriptions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_02a0f4a81524b597973106e70f\` ON \`source_subscriptions\``,
    );
    await queryRunner.query(`DROP TABLE \`source_subscriptions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_5cfb283ecc4b94bd7e80613f9c\` ON \`expo_tokens\``,
    );
    await queryRunner.query(`DROP TABLE \`expo_tokens\``);
  }
}
