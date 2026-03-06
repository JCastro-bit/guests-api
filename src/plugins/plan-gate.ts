import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireActivePlan(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.user.id;

  const user = await request.server.prisma.user.findFirst({
    where: { id: userId },
    select: { planStatus: true },
  });

  if (!user || user.planStatus !== 'active') {
    return reply.status(403).send({
      error: {
        statusCode: 403,
        message: 'Necesitas un plan activo para realizar esta accion.',
      },
    });
  }
}
