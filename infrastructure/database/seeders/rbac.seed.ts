import { Seeder } from 'typeorm-extension';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Role } from '@modules/authorization/domain/entities/role.entity';
import { Permission } from '@modules/authorization/domain/entities/permission.entity';
import { Permission as PermissionEnum } from '@modules/authorization/domain/Enums/permissions';

export default class RbacSeeder implements Seeder {
  public async run(dataSource: DataSource | EntityManager): Promise<void> {
    console.log('Seeding RBAC (Roles and Permissions)...');

    const permissionRepository = dataSource.getRepository(Permission);
    const roleRepository = dataSource.getRepository(Role);

    const seededPermissions = await this.seedPermission(permissionRepository);
    await this.seedRoles(roleRepository, seededPermissions);

    console.log('RBAC Seeding completed successfully.');
  }

  private async seedRoles(roleRepository: Repository<Role>, seededPermissions: Permission[]): Promise<void> {
    const rolesData = [{ name: 'elden_lord', display_name: 'Elden Lord', description: 'The one who controls lands between the lands' },];
    const permissionRole = [{ role: 'elden_lord', permissions: [PermissionEnum.ELDENLORD] }];

    for (const data of rolesData) {
      let role = await roleRepository.findOne({
        where: [{ name: data.name }],
        relations: ['permissions'],
      });

      if (role) {
        roleRepository.merge(role, data);
      } else {
        role = roleRepository.create(data);
      }

      const roleConfig = permissionRole.find((rp) => rp.role === data.name);
      if (roleConfig) {
        role.permissions = seededPermissions.filter((p) => roleConfig.permissions.includes(p.code));
      }
      await roleRepository.save(role);
    }
  }

  private async seedPermission(permissionRepository: Repository<Permission>): Promise<Permission[]> {
    const permissionsData = [
      { name: '*', display_name: 'Elden Lord', description: 'Magic tricks', code: PermissionEnum.ELDENLORD},
      { name: 'users.view', display_name: 'View Users', description: 'Can view users list', code: PermissionEnum.USERS_VIEW},
      { name: 'users.create', display_name: 'Create Users', description: 'Can create new users', code: PermissionEnum.USERS_CREATE},
      { name: 'users.edit', display_name: 'Edit Users', description: 'Can edit existing users', code: PermissionEnum.USERS_EDIT},
      { name: 'users.delete', display_name: 'Delete Users', description: 'Can soft delete users', code: PermissionEnum.USERS_DELETE},
      { name: 'authorization.view', display_name: 'View Authorization', description: 'Can view authorization list (Roles And Permissions)', code: PermissionEnum.AUTHORIZATION_VIEW},
      { name: 'authorization.create', display_name: 'Create Authorization', description: 'Can create new authorization', code: PermissionEnum.AUTHORIZATION_CREATE},
      { name: 'authorization.edit', display_name: 'Edit Authorization', description: 'Can edit existing authorization', code: PermissionEnum.AUTHORIZATION_EDIT,},
      { name: 'authorization.delete', display_name: 'Delete Authorization', description: 'Can soft delete authorization', code: PermissionEnum.AUTHORIZATION_DELETE},
    ];

    const seededPermissions: Permission[] = [];

    for (const data of permissionsData) {
      let permission = await permissionRepository.findOne({
        where: [{ name: data.name }, { code: data.code }],
      });

      if (permission) {
        permissionRepository.merge(permission, data);
      } else {
        permission = permissionRepository.create(data);
      }

      const savedPermission = await permissionRepository.save(permission);
      seededPermissions.push(savedPermission);
    }

    return seededPermissions;
  }
}
