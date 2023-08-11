import { Module, DynamicModule } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  // module: RedisModule,
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
// @Module({})
// export class RedisModule {
//   static forRoot(): DynamicModule {
//     // const RedisProvider = {
//     //   provide: RedisService,
//     //   useFactory: () => {
//     //     return new RedisService();
//     //   },
//     // };
//     return {
//       imports: [ConfigModule],
//       module: RedisModule,
//       providers: [RedisService],
//       exports: [RedisService],
//     };
//   }
// }
