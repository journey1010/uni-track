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

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: [
        'id', 'name', 'last_name',
        'dni', 'phone', 'email', 'status',
        'password', 'level', 'token_version'
      ],
    });
  }

  async getUnifiedPermissions(userId: string | number): Promise<string[]> {
    const directPermissions = this.repository.manager
        .createQueryBuilder()
        .select('p.id', 'id')
        .addSelect('p.name', 'name')
        .from('permission_user', 'pu')
        .innerJoin('permissions', 'p', 'p.id = pu.permission_id')
        .where('pu.user_id = :userId', { userId });
    const permissionsByRole = this.repository.manager
        .createQueryBuilder()
        .select('p.id', 'id')
        .addSelect('p.name', 'name')
        .from('role_user', 'ru')
        .innerJoin('permission_role', 'pr', 'pr.role_id = ru.role_id')
        .innerJoin('permissions', 'p', 'p.id = pr.permission_id')
        .where('ru.user_id = :userId', { userId });
    const result = await this.repository.manager
        .createQueryBuilder()
        .select('u.id', 'id')
        .addSelect('u.name', 'name')
        .from(`(${directPermissions.getQuery()} UNION ${permissionsByRole.getQuery()})`, 'u')
        .orderBy('u.id')
        .setParameters({ userId })
        .getRawMany();
    return result.map((p) => p.name);
  }
}