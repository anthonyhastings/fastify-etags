import etag from 'etag';
import Fastify from 'fastify';

let exampleEntity = {
  id: '89d0b04f-41a1-4bd2-8bfb-6ee656843d8b',
  name: 'Evil Buu',
};

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
  const entityETag = etag(JSON.stringify(exampleEntity));
  reply.header('etag', entityETag);

  // Makes request conditional by only returning the resource if there is no match.
  // If the ETag in the header matches the ETag of the resource, the resource hasn't
  // changed since the last time it was requested, so return bodyless 304.
  if (
    request.headers['if-none-match'] &&
    request.headers['if-none-match'] === entityETag
  ) {
    return reply.status(304).send();
  }

  return exampleEntity;
});

fastify.route({
  method: 'POST',
  url: '/',
  schema: {
    body: {
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      type: 'object',
    },
  },
  handler: async (request, reply) => {
    const originalEntityETag = etag(JSON.stringify(exampleEntity));

    // Makes request conditional by only proceeding if there is a match.
    // If the ETag in the header doesn't match the ETag of the resource,
    // the resource has been edited since the it was originally fetched,
    // therefore return bodyless 412.
    if (
      request.headers['if-match'] &&
      request.headers['if-match'] !== originalEntityETag
    ) {
      reply.header('etag', originalEntityETag);
      return reply.status(412).send();
    }

    exampleEntity = {
      ...exampleEntity,
      name: request.body.name,
    };

    const entityETag = etag(JSON.stringify(exampleEntity));
    reply.header('etag', entityETag);

    return exampleEntity;
  },
});

const start = async () => {
  try {
    await fastify.listen(3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
