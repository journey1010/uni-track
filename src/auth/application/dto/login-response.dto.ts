export interface LoginResponseDto {
    name: string;
    last_name: string;
    email: string;
    phone: string;
    permissions: string[];
    access_token: string;
    refresh_token?: string;
}
