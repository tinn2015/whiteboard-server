import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { signAesDecrypt } from '../../utils/decrypt';

@Injectable()
export class AuthorityGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const reqHeaders = context.switchToHttp().getRequest().headers;
    const random = reqHeaders['x-qn-wb-random'];
    const signature = reqHeaders['x-qn-wb-signature'];
    if (!signature) return false;
    const decryptedData = signAesDecrypt(signature);

    console.log('解密check', random, decryptedData);
    return random === decryptedData;
  }
}
