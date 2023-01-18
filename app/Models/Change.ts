import { DateTime } from 'luxon'
import { column, BaseModel } from '@ioc:Adonis/Lucid/Orm'

export default class Change extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public docId: number

  @column()
  public docVersion: number

  @column()
  public position: number

  @column()
  public inputContent: string | null

  @column()
  public deleteLength: number | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime
}
