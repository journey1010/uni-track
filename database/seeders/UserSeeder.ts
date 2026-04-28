import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { User } from '../../src/modules/users/domain/entities/user.entity';
import { Role } from '../../src/modules/authorization/domain/entities/role.entity';

export default class UserSeeder implements Seeder {
  private readonly logger = new Logger(UserSeeder.name);

  public async run(
    dataSource: DataSource,
  ): Promise<any> {
    this.logger.log('Seeding initial User...');

    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    const adminRole = await roleRepository.findOne({ where: { name: 'admin' } });

    if (!adminRole) {
      this.logger.warn('Admin role not found. Skipping user assignment.');
      return;
    }

    const userData = {
      name: 'System',
      last_name: 'Administrator',
      dni: '00000000',
      email: 'admin@uni-track.com',
      status: 1,
      level: 1,
    };

    let adminUser = await userRepository.findOne({
      where: [
        { email: userData.email },
        { dni: userData.dni }
      ],
      relations: ['roles']
    });

    if (adminUser) {
      adminUser.name = userData.name;
      adminUser.last_name = userData.last_name;
      adminUser.status = userData.status;
      adminUser.level = userData.level;
    } else {
      adminUser = userRepository.create(userData);
    }

    adminUser.roles = [adminRole];
    
    await userRepository.save(adminUser);

    this.logger.log('User Seeding completed successfully.');
  }
}
