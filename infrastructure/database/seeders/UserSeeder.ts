import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { User } from '../../../src/modules/users/domain/entities/user.entity';
import { Role } from '../../../src/modules/authorization/domain/entities/role.entity';
import { Permission } from 'src/modules/authorization/domain/entities/permission.entity';
import { UserStatus } from '../../../src/modules/users/domain/Enums/user.status';
import { DateTime } from '../../config/timezone.config';
import { Hash } from '../../../infrastructure/helpers/Hash';

export default class UserSeeder implements Seeder {
  private readonly logger = new Logger(UserSeeder.name);

  public async run(dataSource: DataSource): Promise<void> {
    this.logger.log('Seeding initial User...');

    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);
    const permissionRepository = dataSource.getRepository(Permission);

    const eldenLordRole = await roleRepository.findOne({ where: { name: 'elden_lord' } });
    const eldenLordPermission = await permissionRepository.findOne( { where: { name: '*'}})

    const userData = {
      name: 'System',
      last_name: 'Administrator',
      dni: '00000000',
      phone: '00000000',
      email: 'ginopaflo001608@gmail.com',
      status: UserStatus.ACTIVE,
      level: 0,
      password: await Hash.make('password'),
      role: eldenLordRole,
      permission: eldenLordPermission,
      created_at: DateTime.now().toString(),
      updated_at: DateTime.now().toString(),
    };
    
    const user = userRepository.create(userData);
    await userRepository.save(user);

    this.logger.log('User Seeding completed successfully.');
  }
}