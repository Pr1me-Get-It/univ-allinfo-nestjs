import { Injectable, OnModuleInit } from '@nestjs/common';
import AhoCorasick from 'modern-ahocorasick';
import { KeywordSubscriptionsRepository } from '../notifications.repository';

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
    await this.buildAutomaton();
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

  private async buildTrieAsync(keywords: string[]): Promise<AhoCorasick> {
    return new Promise((resolve) => {
      const ac = new AhoCorasick(keywords);
      resolve(ac);
    });
  }
}
