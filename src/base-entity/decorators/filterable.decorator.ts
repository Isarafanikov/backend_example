import { FilteringMetadata, KEY_FILTER } from '../prisma-filtering';

// eslint-disable-next-line max-len
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/explicit-module-boundary-types
export const Filterable = (type: FilteringMetadata['type']) =>
  Reflect.metadata(KEY_FILTER, new FilteringMetadata(type));
