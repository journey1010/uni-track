import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: [
        'id', 'name', 'last_name',
        'dni', 'phone', 'email', 'status',
        'password', 'level', 'token_version'
      ],
    });
  }

  public async findById(id: string): Promise<User | null >{
    return this.repository.findOne({
      where: { id },
      select: [
        'id', 'name', 'last_name',
        'dni', 'phone', 'email', 'status',
        'level', 'token_version', 
      ],
    });
  }

  /**
   * Unify direct permissions (permission_user) and role-based permissions
   * (role_user → permission_role). Returns deduplicated list by permission.code.
   */
  public async getUnifiedPermissions(userId: string | number): Promise<Array<{ name: string; code: string }>> {
    const directPermissions = this.repository.manager
        .createQueryBuilder()
        .select(['p.id', 'p.name', 'p.code'])
        .from('permission_user', 'pu')
        .innerJoin('permissions', 'p', 'p.id = pu.permission_id')
        .where('pu.user_id = :userId', { userId });
    const permissionsByRole = this.repository.manager
        .createQueryBuilder()
        .select(['p.id', 'p.name', 'p.code'])
        .from('role_user', 'ru')
        .innerJoin('permission_role', 'pr', 'pr.role_id = ru.role_id')
        .innerJoin('permissions', 'p', 'p.id = pr.permission_id')
        .where('ru.user_id = :userId', { userId });
    const result = await this.repository.manager
        .createQueryBuilder()
        .select(['name', 'code'])
        .from(`(${directPermissions.getQuery()} UNION ${permissionsByRole.getQuery()})`, 'u')
        .orderBy('id')
        .setParameters({ userId })
        .getRawMany();
    return result;
  }
}