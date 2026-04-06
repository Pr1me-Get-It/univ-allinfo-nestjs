import { ValueTransformer } from 'typeorm';
import { UUID } from 'uuidv7';

export class UUIDTransformer implements ValueTransformer {
  // 저장할 때
  to(value: string | null | undefined): Buffer | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    // UUID_TO_BIN
    return Buffer.from(UUID.parse(value).bytes);
  }

  // 조회할 때
  from(value: Buffer | null | undefined): string | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    // BIN_TO_UUID
    return UUID.ofInner(value).toString();
  }
}
