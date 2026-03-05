import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterBody, LoginBody, ForgotPasswordBody, ResetPasswordBody } from './auth.schema';
import { EmailService } from '../email/email.service';

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

    // Fire-and-forget welcome email
    const emailService = new EmailService(request.server);
    emailService.sendWelcome(user.email, user.name ?? '').catch(() => {});

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
      plan: user.plan,
      planStatus: user.planStatus,
      createdAt: user.createdAt,
    });
  }

  async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordBody }>,
    reply: FastifyReply
  ) {
    const result = await this.service.forgotPassword(request.body.email);

    if (result) {
      // Fire-and-forget reset email
      const emailService = new EmailService(request.server);
      emailService.sendResetPassword(result.email, result.name, result.token).catch(() => {});
    }

    // Always return the same message to prevent user enumeration
    return reply.send({ message: 'Si el correo existe, recibiras instrucciones en breve.' });
  }

  async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordBody }>,
    reply: FastifyReply
  ) {
    const { token, password } = request.body;
    const result = await this.service.resetPassword(token, password);
    return reply.send(result);
  }
}
