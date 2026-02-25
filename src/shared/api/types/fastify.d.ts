import 'fastify';
import type fastify from 'fastify';

declare module 'fastify' {
  // We are "opening" the FastifyRequest interface to add our property
  interface FastifyRequest {
    user: {
      uid: string;
      email?: string;
    } | null;
  }
}