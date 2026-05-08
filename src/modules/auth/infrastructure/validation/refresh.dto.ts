import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
    @IsString()
    @IsNotEmpty({ message: 'refresh_token is required' })
    refresh_token: string;
}
