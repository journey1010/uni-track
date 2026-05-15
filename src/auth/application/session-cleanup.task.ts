import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserSession } from '@modules/users/domain/entities/user.session.entity';

@Injectable()
export class SessionCleanupTask {
    private readonly logger = new Logger(SessionCleanupTask.name);

    constructor(
        @InjectRepository(UserSession)
        private readonly sessionRepository: Repository<UserSession>,
    ) {}

    @Cron(process.env.SESSION_CLEANUP_CRON || CronExpression.EVERY_6_HOURS)
    async handleCleanup(): Promise<void> {
        const now = new Date();
        this.logger.log(`Starting session cleanup at ${now.toISOString()}`);

        const result = await this.sessionRepository.delete({
            expires_at: LessThan(now),
        });

        this.logger.log(
            `Session cleanup completed: ${result.affected ?? 0} expired sessions removed.`,
        );
    }
}
