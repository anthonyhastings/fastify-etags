# Fastify ETags

## Introduction

<img src="https://user-images.githubusercontent.com/167421/162076514-1171c110-d01f-4521-bbf4-fde143d35a39.gif" alt="ETags demonstration" />

This repository is a simple server built using Fastify to showcase the framework and how ETags can be used to cache resources and ensure update collisions do not happen.

## Information

### What is an ETag?

An ETag is an identifier assigned by a server to a specific version of a resource found at a URL. If the resource at that URL ever changes, a new ETag is assigned. Used in this manner, ETags are similar to fingerprints and can quickly be compared to determine whether two representations of a resource are the same.

The method by which ETags are generated has never been specified in the HTTP specification. Common methods of ETag generation include using a collision-resistant hash function of the resource's content, a hash of the last modification timestamp, or even just a revision number.

### How can they be used?

ETags can be used to make conditional requests. This allows caches to be more efficient and saves bandwidth, as a server does not need to send a full response if the content has not changed. They can also be used for optimistic concurrency control to help prevent simultaneous updates of a resource from overwriting each other.

#### Caching of unchanged resources

When a resource is first requested, the server can choose to send back an ETag header along with the resources current representation:

```bash
curl --verbose http://localhost:3000
< HTTP/1.1 200 OK
< etag: "3f-PvFGsFdnzXZeuwFMcp7h0o2+SGc"
< content-type: application/json; charset=utf-8
< content-length: 63
< Date: Wed, 06 Apr 2022 22:04:19 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5

{"id":"89d0b04f-41a1-4bd2-8bfb-6ee656843d8b","name":"Evil Buu"}
```

The client may then decide to cache the representation, along with its ETag. Later, if the client wants to retrieve the same URL resource again, the client will send a request to the server that includes its previously saved copy of the ETag in the `If-None-Match` header.

```bash
curl --verbose --header "if-none-match: \"3f-PvFGsFdnzXZeuwFMcp7h0o2+SGc\"" http://localhost:3000
> GET / HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.79.1
> Accept: */*
> if-none-match: "3f-PvFGsFdnzXZeuwFMcp7h0o2+SGc"

< HTTP/1.1 304 Not Modified
< etag: "3f-PvFGsFdnzXZeuwFMcp7h0o2+SGc"
< Date: Thu, 07 Apr 2022 20:10:12 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
```

On this subsequent request, the server may now compare the client's ETag with the ETag for the current version of the resource. If the ETag values match, meaning that the resource has not changed, the server may send back a bodyless response with a HTTP 304 Not Modified status. The 304 status tells the client that its cached version is still good and that it should use that.

However, if the ETag values do not match, meaning the resource has likely changed, a full response is returned, just as if ETags were not being used. In this case, the client may decide to replace its previously cached version with the newly returned representation of the resource and the new ETag.

#### Avoiding update collisions

When attempting to update a resource, you can supply the `If-Match` header to make the request conditional. The server can compare the client's ETag with the ETag for the current version of the resource. If the ETag values match, it means the client has the most up to date version of the resource and there won't be any update collisions. The request can then be processed.

However, if the ETag values do not match it means the client wasn't editing the most up to date version of the resource, and the server may send back a bodyless response with a HTTP 412 Precondition Failed status.

```bash
curl --verbose --request POST http://localhost:3000 --header "Content-Type: application/json" --header "if-match: \"ABC-123\"" --data '{"name":"Hello World"}'
> POST / HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/7.79.1
> Accept: */*
> Content-Type: application/json
> if-match: "ABC-123"
> Content-Length: 22
>
< HTTP/1.1 412 Precondition Failed
< etag: "42-8sKosFpajKlVprJfSE2/ICjs5SY"
< content-length: 0
< Date: Thu, 07 Apr 2022 22:01:59 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
```

### Useful links

- [HTTP ETag](https://en.wikipedia.org/wiki/HTTP_ETag)
- [ETag - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
- [If-Match - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Match)
- [If-None-Match - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match)
