import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminService } from './admin.service';
import { ActivatePlanBody } from './admin.schema';

export class AdminController {
  constructor(private readonly service: AdminService) {}

  async activatePlan(
    request: FastifyRequest<{ Body: ActivatePlanBody }>,
    reply: FastifyReply,
  ) {
    const { userId, plan } = request.body;
    const result = await this.service.activatePlan(userId, plan);
    return reply.status(200).send(result);
  }
}
