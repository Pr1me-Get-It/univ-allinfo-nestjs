import { Injectable, OnModuleInit } from '@nestjs/common';
import AhoCorasick from 'modern-ahocorasick';
import { KeywordSubscriptionsRepository } from '../notifications.repository';

@Injectable()
export class KeywordSearchService implements OnModuleInit {
  private isBuilding = false;
  private activeAutomaton: AhoCorasick | null = null;
  private hasPendingUpdate = false;
  private keywordRefCounts = new Map<string, number>();

  constructor(
    private readonly keywordSubscriptionsRepository: KeywordSubscriptionsRepository,
  ) {}

  async onModuleInit() {
    this.keywordRefCounts =
      await this.keywordSubscriptionsRepository.findKeywordCounts();
    await this.buildAutomaton();
  }

  async addKeywords(newKeywords: string[]) {
    let hasNew = false;
    for (const keyword of newKeywords) {
      const prev = this.keywordRefCounts.get(keyword) ?? 0;
      this.keywordRefCounts.set(keyword, prev + 1);
      if (prev === 0) hasNew = true;
    }

    if (!hasNew) return;
    if (this.isBuilding) {
      this.hasPendingUpdate = true;
      return;
    }

    await this.buildAutomaton();
  }

  async deleteKeywords(keywords: string[]) {
    let hasRemoved = false;
    for (const keyword of keywords) {
      const prev = this.keywordRefCounts.get(keyword);
      if (prev === undefined) continue;

      if (prev <= 1) {
        this.keywordRefCounts.delete(keyword);
        hasRemoved = true;
      } else {
        this.keywordRefCounts.set(keyword, prev - 1);
      }
    }

    if (!hasRemoved) return;
    if (this.isBuilding) {
      this.hasPendingUpdate = true;
      return;
    }

    await this.buildAutomaton();
  }

  search(text: string): string[] {
    if (!this.activeAutomaton) return [];
    const matches = this.activeAutomaton.search(text);
    const found = new Set<string>();
    for (const [, keywords] of matches) {
      for (const keyword of keywords) {
        found.add(keyword);
      }
    }
    return Array.from(found);
  }

  private async buildAutomaton() {
    this.isBuilding = true;
    this.hasPendingUpdate = false;

    try {
      this.activeAutomaton = await this.buildTrieAsync(
        Array.from(this.keywordRefCounts.keys()),
      );
    } finally {
      this.isBuilding = false;

      if (this.hasPendingUpdate) {
        this.buildAutomaton().catch((error) => {
          console.error('[KeywordSearchService] Error building trie:', error);
        });
      }
    }
  }

  private buildTrieAsync(keywords: string[]): Promise<AhoCorasick> {
    return new Promise((resolve) => {
      const ac = new AhoCorasick(keywords);
      resolve(ac);
    });
  }
}
