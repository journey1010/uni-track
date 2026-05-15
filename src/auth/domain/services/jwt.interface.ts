
export type AccessTokenPayload = {
    aud: string;
    type: 'access';
    sub: string;
    jti: string;
    vrs: number;
    level: number;
    permissions: number[];
}

export type TokenPayloadExtend = {
    iat: number;
    exp: number;
}

export type RefreshTokenPayload = {
    aud: string;
    type: 'refresh';
    sub: string;
    jti: string;
}

export type AccessPayloadExtend = AccessTokenPayload & TokenPayloadExtend;
export type RefreshPayloadExtend = RefreshTokenPayload & TokenPayloadExtend;

export interface IJwtService {
    generateAuthTokens(
        accessPayload: AccessTokenPayload,
        refreshPayload: RefreshTokenPayload
    ): Promise<{ access: string; refresh: string }>;
    generateAccessToken(payload: AccessTokenPayload, expiresIn: number): Promise<string>;
    generateRefreshToken(payload: RefreshTokenPayload, expiresIn: number): Promise<string>;
    verify<T extends object>(token: string): Promise<T>;
    needTokenRotation(tokenTtl: number): boolean;
}