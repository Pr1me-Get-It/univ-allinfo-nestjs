import { Injectable, OnModuleInit } from '@nestjs/common';
import AhoCorasick from 'modern-ahocorasick';
import { KeywordSubscriptionsRepository } from './notifications.repository';

@Injectable()
export class KeywordSearchService implements OnModuleInit {
  private isBuilding!: boolean;
  private activeAutomaton: AhoCorasick | null = null;
  private hasPendingUpdate!: boolean;
  private currentKeywords!: Set<string>;

  constructor(
    private readonly keywordSubscriptionsRepository: KeywordSubscriptionsRepository,
  ) {
    this.isBuilding = false;
    this.hasPendingUpdate = false;
  }

  async onModuleInit() {
    const distinctKeywords =
      await this.keywordSubscriptionsRepository.findDistinctKeywords();
    this.currentKeywords = new Set<string>(distinctKeywords);
  }

  async addKeywords(newKeywords: string[]) {
    const initialSize = this.currentKeywords.size;

    for (const keyword of newKeywords) {
      this.currentKeywords.add(keyword);
    }

    if (initialSize === this.currentKeywords.size) {
      return;
    }
    if (this.isBuilding) {
      this.hasPendingUpdate = true;
      return;
    }

    await this.buildAutomaton();
  }

  private async buildAutomaton() {
    this.isBuilding = true;
    this.hasPendingUpdate = false;

    try {
      const stanbyAutomaton = await this.buildTrieAsync(
        Array.from(this.currentKeywords),
      );
      this.activeAutomaton = stanbyAutomaton;
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
