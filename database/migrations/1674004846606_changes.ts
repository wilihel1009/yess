import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'changes'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.charset('utf8mb4')
      table.collate('utf8mb4_general_ci')
      table.increments('id').primary()
      table.integer('doc_id').notNullable()
      table.integer('doc_version').notNullable()
      table.integer('position').notNullable()
      table.text('input_content').nullable()
      table.integer('delete_length').nullable().unsigned()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
