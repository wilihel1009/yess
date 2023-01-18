/* eslint-disable max-len */
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database, { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { addString, deleteString } from 'App/Libraries/Helper'
import Change from 'App/Models/Change'
import Doc from 'App/Models/Doc'

export default class DocController {
  public async get ({ response, params }: HttpContextContract): Promise<void> {
    const doc: Doc | null = await Doc.find(params.id)

    return response.json(doc)
  }

  public async post ({ request, response }: HttpContextContract): Promise<void> {
    const trx: TransactionClientContract = await Database.transaction()
    try {
      const doc: Doc = new Doc()
      doc.merge({
        content: request.input('content'),
      })
      doc.useTransaction(trx)
      await doc.save()
      await doc.refresh()

      const change: Change = new Change()
      change.merge({
        docId: doc.id,
        docVersion: doc.version,
        position: 0,
        inputContent: doc.content,
      })
      change.useTransaction(trx)
      await change.save()

      await trx.commit()

      return response.json(doc)
    } catch (error) {
      await trx.rollback()

      return response.send(error.message)
    }
  }

  public async patch ({ request, response, params }: HttpContextContract): Promise<void> {
    const doc: Doc | null = await Doc.find(params.id)
    if (doc === null) {
      return response.notFound('invalid docs id')
    }

    const baseVersion: number = Number(request.input('baseVersion', -1))
    const position: number = Number(request.input('position', -1))
    const inputContent: string | null = request.input('inputContent', null)
    const deleteLength: number | null = request.input('deleteLength', null)
    if (baseVersion === -1 || position === -1 || (inputContent === null && deleteLength === null) || (inputContent && deleteLength)) {
      return response.badRequest('bad request')
    }

    const trx: TransactionClientContract = await Database.beginGlobalTransaction()
    try {
      const newPosition: number = await this.calcPosition(doc.id, baseVersion, position)
      if (newPosition < 0) {
        throw new Error('merge failed')
      }

      const change: Change = new Change()
      change.merge({
        docId: doc.id,
        docVersion: doc.version + 1,
        position: newPosition,
        inputContent: inputContent,
        deleteLength: deleteLength,
      })

      await change.save()

      doc.version = change.docVersion
      doc.content = await this.getDocVersionContent(doc.id, doc.version)

      await doc.save()

      await trx.commit()
    } catch (error) {
      await trx.rollback()

      return response.badRequest(error.message)
    }

    return response.json(await doc.refresh())
  }

  private async getDocVersionContent (docId: number, version: number): Promise<string> {
    const changes: Change[] = await Change.query()
      .where('doc_id', docId)
      .andWhere('doc_version', '<=', version)
      .orderBy('doc_version', 'asc')

    let content: string | null = null
    for (const change of changes) {
      if (content === null) {
        content = change.inputContent
      } else {
        if (change.inputContent !== null) {
          content = addString(content, change.position, change.inputContent)
        } else if (change.deleteLength !== null) {
          content = deleteString(content, change.position, change.deleteLength)
        }
      }
    }

    return content || ''
  }

  private async calcPosition (docId: number, baseVersion: number, position: number): Promise<number> {
    const changes: Change[] = await Change.query()
      .where('doc_id', docId)
      .andWhere('doc_version', '>', baseVersion)
      .orderBy('doc_version', 'asc')

    for (const change of changes) {
      if (change.inputContent !== null) {
        position += change.inputContent.length
      } else if (change.deleteLength !== null) {
        position -= change.deleteLength
      }
    }

    return position
  }
}
