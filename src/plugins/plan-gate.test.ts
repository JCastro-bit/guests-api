import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requireActivePlan } from './plan-gate';
import { FastifyRequest, FastifyReply } from 'fastify';

const mockFindFirst = vi.fn();

const createMockRequest = (userId: string) => ({
  user: { id: userId, email: 'test@test.com', role: 'user' },
  server: {
    prisma: {
      user: {
        findFirst: mockFindFirst,
      },
    },
  },
}) as unknown as FastifyRequest;

const createMockReply = () => {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
  return reply;
};

describe('requireActivePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows request if planStatus is active', async () => {
    mockFindFirst.mockResolvedValue({ planStatus: 'active' });
    const request = createMockRequest('user-1');
    const reply = createMockReply();

    await requireActivePlan(request, reply);

    expect(reply.status).not.toHaveBeenCalled();
  });

  it('responds 403 if planStatus is inactive', async () => {
    mockFindFirst.mockResolvedValue({ planStatus: 'inactive' });
    const request = createMockRequest('user-1');
    const reply = createMockReply();

    await requireActivePlan(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ statusCode: 403 }),
      })
    );
  });

  it('responds 403 if planStatus is expired', async () => {
    mockFindFirst.mockResolvedValue({ planStatus: 'expired' });
    const request = createMockRequest('user-1');
    const reply = createMockReply();

    await requireActivePlan(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });

  it('responds 403 if user not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    const request = createMockRequest('user-1');
    const reply = createMockReply();

    await requireActivePlan(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
  });
});
