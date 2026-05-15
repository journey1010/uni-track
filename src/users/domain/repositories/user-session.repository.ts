import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, InsertResult } from 'typeorm';
import { UserSession } from '../entities/user.session.entity';

@Injectable()
export class UserSessionRepository {
    constructor(
        @InjectRepository(UserSession)
        private readonly repository: Repository<UserSession>,
    ) {}

    create(data: Partial<UserSession>): UserSession {
        return this.repository.create(data);
    }

    async save(session: UserSession): Promise<InsertResult> {
        return this.repository.insert(session);
    }

    async saveMany(sessions: UserSession[]): Promise<InsertResult> {
        return this.repository.insert(sessions);
    }

    async findByJti(jti: string): Promise<UserSession | null> {
        return this.repository.findOne({ where: { jti } });
    }

    async findActiveByJti(jti: string, type: string): Promise<UserSession | null> {
        return this.repository.findOne({
            where: {
                jti,
                type,
                expires_at: MoreThan(new Date()),
            },
        });
    }

    async deleteByJti(jti: string): Promise<void> {
        await this.repository.delete({ jti });
    }

    async deleteById(id: number): Promise<void> {
        await this.repository.delete(id);
    }
}
