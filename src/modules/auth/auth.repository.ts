import { PrismaClient, User } from '@prisma/client';

interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: 'user' | 'admin';
}

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || 'user',
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
