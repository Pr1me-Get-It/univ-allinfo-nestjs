import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAppleRefreshToken1779265740726 implements MigrationInterface {
  name = 'AddUserAppleRefreshToken1779265740726';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user_apple_refresh_tokens\` (\`user_id\` binary(16) NOT NULL, \`apple_refresh_token\` varchar(512) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`feedbacks\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`content\` varchar(500) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_apple_refresh_tokens\` ADD CONSTRAINT \`FK_90bdfeecd090bbc69c0c9428c9a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_apple_refresh_tokens\` DROP FOREIGN KEY \`FK_90bdfeecd090bbc69c0c9428c9a\``,
    );
    await queryRunner.query(`DROP TABLE \`feedbacks\``);
    await queryRunner.query(`DROP TABLE \`user_apple_refresh_tokens\``);
  }
}
