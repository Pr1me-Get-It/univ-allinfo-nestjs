import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialCreate1777383205307 implements MigrationInterface {
    name = 'InitialCreate1777383205307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_profiles\` (\`user_id\` binary(16) NOT NULL, \`nickname\` varchar(50) NOT NULL, \`college\` enum ('인문대학', '사회과학대학', '자연과학대학', '경상대학', '공과대학', 'IT대학', '농업생명과학대학', '예술대학', '사범대학', '의과대학', '치과대학', '수의과대학', '생활과학대학', '간호대학', '약학대학', '행정학부', '자율전공부', '생태환경대학', '과학기술대학', '첨단기술융합대학', '자율미래인재학부', '기타') NULL, \`department\` enum ('국어국문학과', '영어영문학과', '사학과', '철학과', '불어불문학과', '독어독문학과', '중어중문학과', '고고인류학과', '일어일문학과', '한문학과', '노어노문학과', '인문대학 자율학부', '정치외교학과', '사회학과', '지리학과', '문헌정보학과', '심리학과', '사회복지학부', '미디어커뮤니케이션학과', '사회과학대학 자율학부', '수학과', '물리학과', '화학과', '생물학과', '생명공학부', '통계학과', '지구시스템과학부', '자연과학대학 자율학부', '경제통상학부', '경영학부', '경상대학 자율학부', '금속재료공학과', '신소재공학과', '기계공학부', '건축학부', '토목공학과', '응용화학과', '화학공학과', '고분자공학과', '섬유시스템공학과', '환경공학과', '에너지공학부', '공과대학 자율학부', '전자공학부', '전자공학부 모바일공학전공', '전자공학부 인공지능전공', '컴퓨터학부', '전기공학과', 'IT대학 자율학부', 'IT 첨단자율학부', '응용생명과학부', '식물의학과', '식품공학부', '산림과학·조경학부', '원예과학과', '바이오섬유소재학과', '농업토목공학과', '스마트생물산업기계공학과', '식품자원경제학과', '농산업학과', '농업생명과학대학 자율학부', '음악학과', '국악학과', '미술학과', '디자인학과', '교육학과', '국어교육과', '영어교육과', '유럽어교육학부', '역사교육과', '지리교육과', '일반사회교육과', '윤리교육과', '수학교육과', '물리교육과', '화학교육과', '생물교육과', '지구과학교육과', '가정교육과', '체육교육과', '정보·컴퓨터교육과', '의과대학', '치과대학', '수의과대학', '아동학부', '의류학과', '식품영양학과', '간호학과', '약학과', '융합학부', '스마트모빌리티공학과', '우주공학부', '혁신신약학과', '의생명융합공학과', '로봇공학과', '행정학부', '자율전공학부', '공학 첨단자율학부', '기타') NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` binary(16) NOT NULL, \`email\` varchar(255) NOT NULL, \`provider\` enum ('google', 'apple') NOT NULL, \`provider_id\` varchar(128) NOT NULL, \`hashed_refresh_token\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_9c126dfdc9977c5a4378049447\` (\`provider\`, \`provider_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notices\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`source\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`url\` text NOT NULL, \`posted_at\` timestamp NOT NULL, \`views\` int NOT NULL DEFAULT '0', \`kickoff\` timestamp NULL, \`deadline\` timestamp NULL, \`hashed_url\` varchar(64) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_NOTICE_SOURCE\` (\`source\`), UNIQUE INDEX \`IDX_8f8789ec0aeee2dbaa3dcefde5\` (\`hashed_url\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`game_score_logs\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`user_id\` binary(16) NOT NULL, \`game_type\` enum ('HOBANWOO', 'DUJJONKU', 'TETRIS') NOT NULL, \`score\` int NOT NULL, \`played_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_profiles\` ADD CONSTRAINT \`FK_6ca9503d77ae39b4b5a6cc3ba88\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_profiles\` DROP FOREIGN KEY \`FK_6ca9503d77ae39b4b5a6cc3ba88\``);
        await queryRunner.query(`DROP TABLE \`game_score_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_8f8789ec0aeee2dbaa3dcefde5\` ON \`notices\``);
        await queryRunner.query(`DROP INDEX \`IDX_NOTICE_SOURCE\` ON \`notices\``);
        await queryRunner.query(`DROP TABLE \`notices\``);
        await queryRunner.query(`DROP INDEX \`IDX_9c126dfdc9977c5a4378049447\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`user_profiles\``);
    }

}
