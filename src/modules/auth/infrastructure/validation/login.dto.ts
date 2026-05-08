import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'email must be a valid email address' })
    email: string;

    @IsString()
    @MinLength(5, { message: 'password must be at least 5 characters' })
    @Matches(/\d/, { message: 'password must include at least one number' })
    password: string;
}
