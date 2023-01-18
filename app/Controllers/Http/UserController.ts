import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UserController {
  public async put ({ auth, request, response }: HttpContextContract): Promise<void> {
    let user: User | null = await User.findBy('email', request.input('email'))
    if (user) {
      if (user.name !== request.input('name')) {
        user.name = request.input('name')
        await user.save()
        await user.refresh()
      }
    } else {
      user = await User.create({
        email: request.input('email'),
        name: request.input('name'),
      })
    }

    const token = await auth.use('api').generate(user, {expiresIn:'1hours'})
    return response.json(token)
  }
}
