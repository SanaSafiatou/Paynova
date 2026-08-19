import { Module, Global } from '@nestjs/common';
import { ProviderRegistry } from './providers/provider.registry';
import { ExternalApiController } from './external-api.controller';

@Global()
@Module({
  controllers: [ExternalApiController],
  providers: [ProviderRegistry],
  exports: [ProviderRegistry],
})
export class ExternalApiModule {}
