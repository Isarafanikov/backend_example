export class MetadataHandler {
  static getMatchingFields<T, MetadataType>(
    target: T,
    metadataKey: string | symbol,
  ): Record<keyof T, MetadataType> {
    const metadata: Record<keyof T, MetadataType> = {} as Record<keyof T, MetadataType>;
    for (const field of Object.getOwnPropertyNames(target)) {
      if (Reflect.hasMetadata(metadataKey, target, field)) {
        metadata[field as keyof T] = Reflect.getMetadata(metadataKey, target, field);
      }
    }
    return metadata;
  }
}
