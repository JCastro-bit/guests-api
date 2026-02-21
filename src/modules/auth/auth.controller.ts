import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterBody, LoginBody } from './auth.schema';

export class AuthController {
  constructor(private service: AuthService) {}

  async register(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply
  ) {
    const user = await this.service.register(request.body);

    const token = request.server.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.status(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }

  async login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ) {
    const user = await this.service.login(request.body);

    const token = request.server.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.status(200).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }

  async me(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    const user = await this.service.getProfile(userId);

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
}
