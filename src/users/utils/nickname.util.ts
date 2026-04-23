import {
  NICKNAME_ADJECTIVES,
  NICKNAME_NOUNS,
} from '../constants/nickname.constants';

export class NicknameUtil {
  static generateRandomNickname(): string {
    const adjective = this.getRandomElement(NICKNAME_ADJECTIVES);
    const noun = this.getRandomElement(NICKNAME_NOUNS);
    return `${adjective} ${noun}`;
  }

  private static getRandomElement<T>(arr: T[]): T {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }
}
