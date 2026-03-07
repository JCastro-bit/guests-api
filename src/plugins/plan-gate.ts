import { FastifyRequest, FastifyReply } from 'fastify';

const PLAN_ORDER = { free: 0, esencial: 1, premium: 2 } as const;

type PlanTier = keyof typeof PLAN_ORDER;

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

export function requirePlan(minPlan: PlanTier) {
  return async function requirePlanHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = (request as any).user;

    if (!user) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const userId = user.id;

    const dbUser = await request.server.prisma.user.findFirst({
      where: { id: userId },
      select: { plan: true, planStatus: true },
    });

    if (!dbUser) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    if (minPlan !== 'free' && dbUser.planStatus !== 'active') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'PLAN_REQUIRED',
        message: `Esta acción requiere el plan ${minPlan}`,
        requiredPlan: minPlan,
        upgradeUrl: 'https://app.lovepostal.studio/upgrade',
      });
    }

    if (PLAN_ORDER[dbUser.plan as PlanTier] < PLAN_ORDER[minPlan]) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'PLAN_LIMIT_EXCEEDED',
        message: `Esta acción requiere el plan ${minPlan}`,
        requiredPlan: minPlan,
        upgradeUrl: 'https://app.lovepostal.studio/upgrade',
      });
    }
  };
}
