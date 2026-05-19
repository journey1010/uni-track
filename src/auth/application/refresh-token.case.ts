import { Injectable } from '@nestjs/common';
import { LoginResponseDto } from './dto/login-response.dto';
import { Result } from '@Common/results';
import { RefreshPayloadExtend } from '@modules/auth/domain/services/jwt.interface';
import { SessionMeta } from '@modules/auth/infrastructure/decorators/session-meta.decorator';
import { UserCacheService } from '@modules/auth/domain/services/user-cache.interface';
import { AuthTokenService } from './services/auth-token.service';

@Injectable()
export class RefreshTokenCase {

  constructor(
    private readonly userCacheService: UserCacheService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(
    payload: RefreshPayloadExtend,
    meta: SessionMeta,
  ): Promise<Result<LoginResponseDto, string>> {

      const cachedUser = await this.userCacheService.getCachedOrFetchUser(payload.sub);
      if (!cachedUser) {
        return Result.failure('Credenciales inválidas o cuenta inactiva');
      }
      
      const tokens = await this.authTokenService.refreshAuthTokens(
        cachedUser,
        meta,
        payload.exp,
      );

      return Result.success({
        name: cachedUser.name,
        last_name: cachedUser.last_name,
        email: cachedUser.email,
        phone: cachedUser.phone,
        permissions: cachedUser.permissionNames,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
  }
}