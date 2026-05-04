import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  private truncate(name: string, limit: number = 63): string {
    if (name.length <= limit) return name;
    const hash = Math.abs(this.hashCode(name)).toString(36).substring(0, 4);
    return `${name.substring(0, limit - 5)}_${hash}`;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash;
  }

  private snakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  public tableName(className: string, customName: string): string {
    return customName ? customName : this.snakeCase(className);
  }

  public columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return (
      (embeddedPrefixes.length ? this.snakeCase(embeddedPrefixes.join('_')) + '_' : '') +
      (customName ? customName : this.snakeCase(propertyName))
    );
  }

  public relationName(propertyName: string): string {
    return this.snakeCase(propertyName);
  }

  public joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.snakeCase(relationName + '_' + referencedColumnName);
  }

  public joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    secondPropertyName: string,
  ): string {
    return this.snakeCase(firstTableName + '_' + secondPropertyName.replace(/\./gi, '_'));
  }

  public joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return this.snakeCase(tableName + '_' + (columnName ? columnName : propertyName));
  }

  public foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[],
  ): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const name = columnNames.reduce((name, column) => `${name}_${column}`, `${tableName}`);
    return this.truncate(`fk_${name}`.toLowerCase());
  }

  public uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const name = columnNames.reduce((name, column) => `${name}_${column}`, `${tableName}`);
    return this.truncate(`uq_${name}`.toLowerCase());
  }

  public indexName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const name = columnNames.reduce((name, column) => `${name}_${column}`, `${tableName}`);
    return this.truncate(`idx_${name}`.toLowerCase());
  }

  public primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const name = columnNames.reduce((name, column) => `${name}_${column}`, `${tableName}`);
    return this.truncate(`pk_${name}`.toLowerCase());
  }
}