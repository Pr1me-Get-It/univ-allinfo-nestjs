/**
 * generate-api-docs.js
 *
 * 흐름:
 * 1. 변경된 컨트롤러/라우터 파일 읽기
 * 2. Notion DB에서 기존 명세서 샘플 페이지의 블록 구조를 그대로 추출 → 템플릿화
 * 3. OpenAI API로 코드 분석 + 템플릿 구조에 맞게 Notion 블록 JSON 직접 생성
 * 4. Notion API로 DB에 새 페이지 작성 (기존 스타일 100% 미러링)
 */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { Client } = require('@notionhq/client');

// ─── 클라이언트 초기화 ────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const REPO_ROOT = process.env.REPO_ROOT || process.cwd();
const PR_TITLE = process.env.PR_TITLE || '';
const PR_NUMBER = process.env.PR_NUMBER || '';
const PR_AUTHOR = process.env.PR_AUTHOR || '';
const PR_MERGED_AT = process.env.PR_MERGED_AT || new Date().toISOString();

// ─── 유틸: 파일 읽기 ──────────────────────────────────────────────────────────
function readChangedFiles(filesEnv) {
  const filePaths = filesEnv
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  const results = [];
  for (const relPath of filePaths) {
    const absPath = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(absPath)) {
      console.warn(`⚠️  파일 없음: ${absPath}`);
      continue;
    }
    const content = fs.readFileSync(absPath, 'utf-8');
    results.push({ path: relPath, content });
    console.log(`✅ 읽기 성공: ${relPath} (${content.length} chars)`);
  }
  return results;
}

// ─── Notion 블록 → 직렬화 (AI에게 구조 설명용) ───────────────────────────────
function serializeBlockForAI(block) {
  const type = block.type;
  const data = block[type] || {};

  const extractText = (richText = []) =>
    richText.map((t) => t.plain_text || '').join('');
  const extractAnnotations = (richText = []) => {
    const ann = richText[0]?.annotations || {};
    return Object.entries(ann)
      .filter(([, v]) => v && v !== 'default')
      .map(([k]) => k);
  };

  switch (type) {
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      return {
        type,
        text: extractText(data.rich_text),
        level: parseInt(type.slice(-1)),
      };

    case 'paragraph':
      return {
        type,
        text: extractText(data.rich_text),
        annotations: extractAnnotations(data.rich_text),
      };

    case 'bulleted_list_item':
    case 'numbered_list_item':
      return { type, text: extractText(data.rich_text) };

    case 'code':
      return {
        type,
        language: data.language || 'plain text',
        text: extractText(data.rich_text),
      };

    case 'divider':
      return { type };

    case 'table':
      return {
        type,
        has_column_header: data.has_column_header,
        has_row_header: data.has_row_header,
      };

    case 'table_row':
      return {
        type,
        cells: (data.cells || []).map((cell) => extractText(cell)),
      };

    case 'callout':
      return {
        type,
        text: extractText(data.rich_text),
        icon: data.icon?.emoji || '',
      };

    case 'toggle':
      return { type, text: extractText(data.rich_text) };

    case 'quote':
      return { type, text: extractText(data.rich_text) };

    default:
      return { type };
  }
}

// ─── Notion: 샘플 페이지 블록 구조 추출 (재귀적으로 자식까지) ────────────────
async function fetchBlocksRecursive(blockId, depth = 0) {
  if (depth > 3) return [];
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100,
  });
  const blocks = [];

  for (const block of response.results) {
    const serialized = serializeBlockForAI(block);
    if (
      block.has_children &&
      ['table', 'toggle', 'bulleted_list_item'].includes(block.type)
    ) {
      serialized.children = await fetchBlocksRecursive(block.id, depth + 1);
    }
    blocks.push({ _id: block.id, _raw: block, _serialized: serialized });
  }
  return blocks;
}

// ─── Notion: DB 구조 + 샘플 페이지 블록 템플릿 파악 ─────────────────────────
async function fetchNotionTemplate() {
  console.log('\n📋 Notion DB 구조 및 기존 명세서 형식 파악 중...');

  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  const dbProperties = Object.entries(db.properties).map(([name, prop]) => ({
    name,
    type: prop.type,
    options:
      prop.select?.options?.map((o) => o.name) ||
      prop.multi_select?.options?.map((o) => o.name) ||
      undefined,
  }));

  // 샘플 페이지 2개 가져오기 (일관된 패턴 파악)
  const pages = await notion.databases.query({
    database_id: DATABASE_ID,
    page_size: 2,
  });
  const sampleTemplates = [];

  for (const page of pages.results) {
    const blocks = await fetchBlocksRecursive(page.id);
    sampleTemplates.push({
      pageId: page.id,
      properties: Object.entries(page.properties).reduce(
        (acc, [name, prop]) => {
          acc[name] = extractPropertyValue(prop);
          return acc;
        },
        {},
      ),
      blocks: blocks.map((b) => b._serialized),
    });
  }

  console.log(
    `   DB 속성 ${dbProperties.length}개, 샘플 페이지 ${sampleTemplates.length}개 파악 완료`,
  );
  return { dbProperties, sampleTemplates, rawDb: db };
}

function extractPropertyValue(prop) {
  switch (prop.type) {
    case 'title':
      return prop.title?.map((t) => t.plain_text).join('') || '';
    case 'rich_text':
      return prop.rich_text?.map((t) => t.plain_text).join('') || '';
    case 'select':
      return prop.select?.name || '';
    case 'multi_select':
      return prop.multi_select?.map((s) => s.name) || [];
    case 'date':
      return prop.date?.start || '';
    case 'url':
      return prop.url || '';
    case 'number':
      return prop.number ?? '';
    default:
      return '';
  }
}

// ─── OpenAI: 코드 분석 + Notion 블록 직접 생성 ───────────────────────────────
async function analyzeAndBuildWithOpenAI(files, template) {
  console.log('\n🤖 OpenAI로 코드 분석 및 Notion 블록 생성 중...');

  const codeContext = files
    .map((f) => `=== ${f.path} ===\n${f.content}`)
    .join('\n\n');
  const dbPropsJson = JSON.stringify(template.dbProperties, null, 2);
  const sampleJson = JSON.stringify(template.sampleTemplates, null, 2);

  const systemPrompt = `당신은 NestJS/Express API 명세서 작성 전문가입니다.
응답은 반드시 순수 JSON만 반환하세요. 마크다운 코드블록(예: \`\`\`json)을 절대 포함하지 마세요.`;

  const userPrompt = `아래 정보를 바탕으로, 변경된 코드에서 새로 추가된 API 엔드포인트들을 분석하고
각 API에 대해 Notion 페이지를 생성하는 데 필요한 데이터를 JSON으로 반환하세요.

## Notion DB 속성 구조 (컬럼 정의)
${dbPropsJson}

## 기존 명세서 페이지 샘플 (속성값 + 블록 구조)
이 구조를 완전히 미러링해서 동일한 형식으로 새 페이지를 만들어야 합니다.
${sampleJson}

## 분석할 코드
${codeContext}

## 응답 규칙
1. 순수 JSON만 반환 (마크다운 코드블록 없이)
2. 기존 샘플의 블록 구조(섹션 순서, 헤딩 레벨, 구분선 위치, 테이블 vs 리스트 선택)를 100% 동일하게 따를 것
3. 새로 추가된 API만 포함 (기존 API 제외)
4. Notion API에 그대로 전달 가능한 블록 JSON 형식으로 작성

## 응답 JSON 구조
{
  "apis": [
    {
      "properties": {
        // DB 속성명을 key로, Notion API 형식의 value 사용
        // title 타입: { "title": [{ "text": { "content": "..." } }] }
        // rich_text 타입: { "rich_text": [{ "text": { "content": "..." } }] }
        // select 타입: { "select": { "name": "..." } }
        // multi_select 타입: { "multi_select": [{ "name": "..." }] }
        // date 타입: { "date": { "start": "YYYY-MM-DD" } }
      },
      "blocks": [
        // Notion blocks API 형식 그대로
        // 구분선: { "object": "block", "type": "divider", "divider": {} }
        // 헤딩: { "object": "block", "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "..." } }] } }
        // 문단: { "object": "block", "type": "paragraph", "paragraph": { "rich_text": [...] } }
        // 코드: { "object": "block", "type": "code", "code": { "language": "json", "rich_text": [...] } }
        // 불릿: { "object": "block", "type": "bulleted_list_item", "bulleted_list_item": { "rich_text": [...] } }
        // 표: { "object": "block", "type": "table", "table": { "table_width": N, "has_column_header": true, "has_row_header": false }, "children": [ { "object": "block", "type": "table_row", "table_row": { "cells": [[{ "type": "text", "text": { "content": "..." } }], ...] } } ] }
      ]
    }
  ]
}

PR 정보: #${PR_NUMBER} "${PR_TITLE}" by ${PR_AUTHOR} (merged: ${PR_MERGED_AT})`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 8192,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const responseText = response.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(responseText);
    console.log(`   분석된 API 수: ${parsed.apis?.length || 0}개`);
    return parsed;
  } catch {
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

// ─── Notion: 테이블 블록은 children 별도 처리 필요 ───────────────────────────
async function appendBlocksWithChildren(pageId, blocks) {
  const topLevelBlocks = [];
  const tableChildrenMap = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'table' && block.children) {
      tableChildrenMap.push({
        blockIndex: topLevelBlocks.length,
        children: block.children,
      });
      const { children: _, ...blockWithoutChildren } = block;
      topLevelBlocks.push(blockWithoutChildren);
    } else {
      topLevelBlocks.push(block);
    }
  }

  // 최대 100개씩 나눠서 append (Notion API 제한)
  const CHUNK_SIZE = 100;
  const createdBlocks = [];
  for (let i = 0; i < topLevelBlocks.length; i += CHUNK_SIZE) {
    const chunk = topLevelBlocks.slice(i, i + CHUNK_SIZE);
    const result = await notion.blocks.children.append({
      block_id: pageId,
      children: chunk,
    });
    createdBlocks.push(...result.results);
  }

  // 테이블의 자식 행(table_row) 별도 append
  for (const { blockIndex, children } of tableChildrenMap) {
    const tableBlock = createdBlocks[blockIndex];
    if (tableBlock) {
      await notion.blocks.children.append({
        block_id: tableBlock.id,
        children,
      });
    }
  }
}

// ─── Notion: 페이지 생성 ─────────────────────────────────────────────────────
async function createNotionPage(apiData) {
  const page = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: apiData.properties,
  });

  if (apiData.blocks && apiData.blocks.length > 0) {
    await appendBlocksWithChildren(page.id, apiData.blocks);
  }

  return page;
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 API 명세서 자동화 시작\n');
  console.log(`📌 PR #${PR_NUMBER}: ${PR_TITLE}`);
  console.log(`👤 작성자: ${PR_AUTHOR} | 📅 Merge: ${PR_MERGED_AT}\n`);

  const changedFilesEnv = process.env.CHANGED_FILES || '';
  if (!changedFilesEnv) {
    console.log('변경된 API 파일 없음. 종료.');
    return;
  }

  const files = readChangedFiles(changedFilesEnv);
  if (files.length === 0) {
    console.log('읽을 수 있는 파일이 없음. 종료.');
    return;
  }

  const template = await fetchNotionTemplate();

  const result = await analyzeAndBuildWithOpenAI(files, template);
  const apis = result.apis || [];

  if (apis.length === 0) {
    console.log('\n✅ 새로 추가된 API 없음. 종료.');
    return;
  }

  console.log(`\n📝 Notion에 ${apis.length}개 API 명세서 작성 중...`);
  let succeeded = 0,
    failed = 0;

  for (const apiData of apis) {
    const titleProp = Object.values(apiData.properties || {}).find(
      (p) => p.title,
    );
    const titleText = titleProp?.title?.[0]?.text?.content || '(제목 없음)';

    try {
      const page = await createNotionPage(apiData);
      console.log(`   ✅ ${titleText} → ${page.url}`);
      succeeded++;
    } catch (err) {
      console.error(`   ❌ ${titleText} 실패: ${err.message}`);
      if (err.body)
        console.error(
          `      Notion 오류 상세:`,
          JSON.stringify(err.body, null, 2),
        );
      failed++;
    }
  }

  console.log(`\n🎉 완료! 성공: ${succeeded}개 / 실패: ${failed}개`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
