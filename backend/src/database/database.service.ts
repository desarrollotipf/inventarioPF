import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  onModuleInit() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'fia-postgres.postgres.database.azure.com',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'adminfia',
      password: process.env.DB_PASSWORD || 'PF8600324509*',
      database: process.env.DB_NAME || 'pf_operacional',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.logger.log('Database pool initialized with schema: "InventariosTI"');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      // Set default search_path to "InventariosTI", public
      await client.query('SET search_path TO "InventariosTI", public;');
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }

  async getClient() {
    const client = await this.pool.connect();
    await client.query('SET search_path TO "InventariosTI", public;');
    return client;
  }
}
