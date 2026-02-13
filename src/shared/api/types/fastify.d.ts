import 'fastify';
import type fastify from 'fastify';

declare module 'fastify' {
  // We are "opening" the FastifyRequest interface to add our property
  interface FastifyRequest {
    user: {
      uid: string;
      email?: string;
      // You can also use your Domain User type here:
      // user: import('../identity/domain/Identity').Identity;
    };
  }
}