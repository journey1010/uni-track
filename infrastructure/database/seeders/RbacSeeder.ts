import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Role } from '../../../src/modules/authorization/domain/entities/role.entity';
import { Permission } from '../../../src/modules/authorization/domain/entities/permission.entity';

export default class RbacSeeder implements Seeder {
  private readonly logger = new Logger(RbacSeeder.name);

  public async run(dataSource: DataSource  ): Promise<any> {
    this.logger.log('Seeding RBAC (Roles and Permissions)...');

    const permissionRepository = dataSource.getRepository(Permission);
    const roleRepository = dataSource.getRepository(Role);

    const permissionsData = [
      { name: '*', display_name: 'Elden Lord', description: 'Magic tricks', code: 999 },
      { name: 'users.view', display_name: 'View Users', description: 'Can view users list', code: 100 },
      { name: 'users.create', display_name: 'Create Users', description: 'Can create new users', code: 101 },
      { name: 'users.edit', display_name: 'Edit Users', description: 'Can edit existing users', code: 102 },
      { name: 'users.delete', display_name: 'Delete Users', description: 'Can soft delete users', code: 103 },
    ];

    const seededPermissions: Permission[] = [];

    for (const data of permissionsData) {
      let permission = await permissionRepository.findOne({
        where: [
          { name: data.name },
          { code: data.code }
        ]
      });

      if (permission) {
        permission.display_name = data.display_name;
        permission.description = data.description;
        permission.code = data.code;
        permission.name = data.name;
      } else {
        permission = permissionRepository.create(data);
      }
      
      const savedPermission = await permissionRepository.save(permission);
      seededPermissions.push(savedPermission);
    }

    // Define roles
    const rolesData = [
      { name: 'admin', display_name: 'Administrator', description: 'System Administrator', code: 1 },
      { name: 'manager', display_name: 'Manager', description: 'System Manager', code: 2 },
      { name: 'user', display_name: 'User', description: 'Standard User', code: 3 },
    ];

    for (const data of rolesData) {
      let role = await roleRepository.findOne({
        where: [
          { name: data.name },
          { code: data.code }
        ],
        relations: ['permissions']
      });

      if (role) {
        role.display_name = data.display_name;
        role.description = data.description;
        role.code = data.code;
        role.name = data.name;
      } else {
        role = roleRepository.create(data);
      }

      if (role.name === 'admin') {
        role.permissions = seededPermissions;
      }

      await roleRepository.save(role);
    }

    this.logger.log('RBAC Seeding completed successfully.');
  }
}