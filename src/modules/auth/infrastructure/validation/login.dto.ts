import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Ingrese un Correo electrónico valido' })
    email: string;

    @IsString()
    @MinLength(5, { message: 'Contraseña debe tener al menos 5 caracteres' })
    @Matches(/\d/, { message: 'Contraseña debe tener al menos un numero' })
    password: string;
}
