import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackTable1778528267309 implements MigrationInterface {
  name = 'CreateFeedbackTable1778528267309';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`feedbacks\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`content\` varchar(500) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`feedbacks\``);
  }
}
