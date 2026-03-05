import { FastifyRequest, FastifyReply } from 'fastify';
import { TableService } from './table.service';
import {
  CreateTable,
  UpdateTable,
  TableParams,
  TableQuery,
} from './table.schema';
import { assertValidUUID } from '../../lib/uuid';

export class TableController {
  constructor(private service: TableService) {}

  async create(
    request: FastifyRequest<{ Body: CreateTable }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    const table = await this.service.createTable(request.body, userId);
    return reply.status(201).send(table);
  }

  async getAll(
    request: FastifyRequest<{ Querystring: TableQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    const { page, limit } = request.query;
    const tables = await this.service.getAllTables(userId, page, limit);
    return reply.send(tables);
  }

  async getById(
    request: FastifyRequest<{ Params: TableParams }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    const table = await this.service.getTableById(request.params.id, userId);
    return reply.send(table);
  }

  async update(
    request: FastifyRequest<{ Params: TableParams; Body: UpdateTable }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    const table = await this.service.updateTable(request.params.id, userId, request.body);
    return reply.send(table);
  }

  async delete(
    request: FastifyRequest<{ Params: TableParams }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    await this.service.deleteTable(request.params.id, userId);
    return reply.status(204).send();
  }
}
